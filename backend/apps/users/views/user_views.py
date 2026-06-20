from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.core.responses import success_response, no_content_response, error_response
from apps.users.models import User, UserPreference
from apps.users.serializers import (
    UserSerializer,
    UserUpdateSerializer,
    UserPreferenceSerializer,
    ChangePasswordSerializer,
)
from apps.users.services import update_user_profile, change_password, delete_user, set_user_preferences
from apps.users.selectors import list_active_users, get_user_preferences
from apps.users.permissions import IsSelfOrAdmin
from apps.core.permissions import IsAdmin
from apps.audit.services import log_action


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def user_list(request):
    users = list_active_users()
    return success_response(UserSerializer(users, many=True).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    try:
        user = User.objects.get(id=pk, is_active=True)
    except User.DoesNotExist:
        return error_response("NOT_FOUND", "Usuario no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    if not IsSelfOrAdmin().has_object_permission(request, None, user):
        return error_response("PERMISSION_DENIED", "Acceso denegado.", status_code=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return success_response(UserSerializer(user).data)

    if request.method == "PATCH":
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = update_user_profile(user=user, **serializer.validated_data)
        return success_response(UserSerializer(updated).data)

    delete_user(requesting_user=request.user, target_user=user)
    return no_content_response()


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def user_preferences(request):
    if request.method == "GET":
        prefs = get_user_preferences(request.user)
        return success_response(UserPreferenceSerializer(prefs, many=True).data)

    serializer = UserPreferenceSerializer(data=request.data, many=True)
    serializer.is_valid(raise_exception=True)
    updated = set_user_preferences(user=request.user, preferences=serializer.validated_data)
    return success_response(UserPreferenceSerializer(updated, many=True).data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def user_preference_detail(request, pk):
    try:
        pref = UserPreference.objects.get(id=pk, user=request.user)
    except UserPreference.DoesNotExist:
        return error_response("NOT_FOUND", "Preferencia no encontrada.", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "PATCH":
        serializer = UserPreferenceSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changed = list(serializer.validated_data.keys())
        for field, value in serializer.validated_data.items():
            setattr(pref, field, value)
        if changed:
            pref.save(update_fields=changed)
        log_action(user=request.user, action="update", entity_type="user_preference", entity_id=str(pref.id))
        return success_response(UserPreferenceSerializer(pref).data)

    pref.delete()
    log_action(user=request.user, action="delete", entity_type="user_preference", entity_id=str(pk))
    return no_content_response()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    change_password(
        user=request.user,
        old_password=serializer.validated_data["old_password"],
        new_password=serializer.validated_data["new_password"],
    )
    return success_response({"detail": "Contraseña cambiada exitosamente."})
