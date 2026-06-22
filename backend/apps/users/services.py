from django.contrib.auth import authenticate
from rest_framework.exceptions import ValidationError, AuthenticationFailed, PermissionDenied

from .models import User, UserPreference, UserStatus
from apps.audit.services import log_action


def register_user(*, email: str, password: str, first_name: str, last_name: str, birth_date=None) -> User:
    if User.objects.filter(email=email).exists():
        raise ValidationError({"email": "No se pudo completar el registro. Verificá los datos ingresados."})

    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        birth_date=birth_date,
    )

    log_action(user=user, action="register", entity_type="user", entity_id=str(user.id))
    return user


def authenticate_user(*, email: str, password: str) -> User:
    user = authenticate(username=email, password=password)
    if not user:
        raise AuthenticationFailed("Correo o contraseña incorrectos.")
    if user.status == UserStatus.SUSPENDED:
        raise PermissionDenied("Tu cuenta ha sido suspendida. Contactá soporte.")
    if user.status == UserStatus.DELETED:
        raise AuthenticationFailed("Correo o contraseña incorrectos.")

    log_action(user=user, action="login", entity_type="user", entity_id=str(user.id))
    return user


def update_user_profile(*, user: User, first_name: str = None, last_name: str = None,
                         birth_date=None, profile_image: str = None,
                         latitude=None, longitude=None) -> User:
    changed = []
    if first_name is not None:
        user.first_name = first_name
        changed.append("first_name")
    if last_name is not None:
        user.last_name = last_name
        changed.append("last_name")
    if birth_date is not None:
        user.birth_date = birth_date
        changed.append("birth_date")
    if profile_image is not None:
        user.profile_image = profile_image
        changed.append("profile_image")
    if latitude is not None:
        user.latitude = latitude
        changed.append("latitude")
    if longitude is not None:
        user.longitude = longitude
        changed.append("longitude")

    if changed:
        user.save(update_fields=[*changed, "updated_at"])
    log_action(user=user, action="update", entity_type="user", entity_id=str(user.id))
    return user


def change_password(*, user: User, old_password: str, new_password: str) -> None:
    if not user.check_password(old_password):
        raise ValidationError({"old_password": "La contraseña actual es incorrecta."})
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    log_action(user=user, action="change_password", entity_type="user", entity_id=str(user.id))


def delete_user(*, requesting_user: User, target_user: User) -> None:
    if requesting_user != target_user and requesting_user.role != "admin":
        raise PermissionDenied("No podés eliminar la cuenta de otro usuario.")
    target_user.soft_delete()
    log_action(
        user=requesting_user,
        action="delete",
        entity_type="user",
        entity_id=str(target_user.id),
    )


def set_user_preferences(*, user: User, preferences: list) -> list:
    if not preferences:
        return []
    objs = [
        UserPreference(
            user=user,
            category=p["category"],
            value=p["value"],
            weight=p.get("weight", 1),
        )
        for p in preferences
    ]
    UserPreference.objects.bulk_create(
        objs,
        update_conflicts=True,
        update_fields=["weight"],
        unique_fields=["user", "category", "value"],
    )
    keys = {(p["category"], p["value"]) for p in preferences}
    result = [r for r in UserPreference.objects.filter(user=user) if (r.category, r.value) in keys]
    log_action(user=user, action="update_preferences", entity_type="user", entity_id=str(user.id))
    return result
