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
        raise AuthenticationFailed("Invalid credentials.")
    if user.status == UserStatus.SUSPENDED:
        raise PermissionDenied("Your account has been suspended.")
    if user.status == UserStatus.DELETED:
        raise AuthenticationFailed("Account not found.")

    log_action(user=user, action="login", entity_type="user", entity_id=str(user.id))
    return user


def update_user_profile(*, user: User, first_name: str = None, last_name: str = None,
                         birth_date=None, profile_image: str = None,
                         latitude=None, longitude=None) -> User:
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if birth_date is not None:
        user.birth_date = birth_date
    if profile_image is not None:
        user.profile_image = profile_image
    if latitude is not None:
        user.latitude = latitude
    if longitude is not None:
        user.longitude = longitude

    user.save()
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
        raise PermissionDenied("You cannot delete another user's account.")
    target_user.soft_delete()
    log_action(
        user=requesting_user,
        action="delete",
        entity_type="user",
        entity_id=str(target_user.id),
    )


def set_user_preferences(*, user: User, preferences: list) -> list:
    created = []
    for pref in preferences:
        obj, _ = UserPreference.objects.update_or_create(
            user=user,
            category=pref["category"],
            value=pref["value"],
            defaults={"weight": pref.get("weight", 1)},
        )
        created.append(obj)
    log_action(user=user, action="update_preferences", entity_type="user", entity_id=str(user.id))
    return created
