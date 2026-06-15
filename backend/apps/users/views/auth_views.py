from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.responses import success_response, created_response, error_response
from apps.users.serializers import UserRegistrationSerializer, UserSerializer, UserUpdateSerializer
from apps.users.services import register_user, authenticate_user, update_user_profile
from apps.audit.services import log_action


class AuthThrottle(ScopedRateThrottle):
    scope = "auth"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = register_user(**serializer.validated_data)
    refresh = RefreshToken.for_user(user)
    return created_response(
        {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login(request):
    email = request.data.get("email", "")
    password = request.data.get("password", "")

    if not email or not password:
        return error_response("VALIDATION_ERROR", "Email and password are required.")

    user = authenticate_user(email=email, password=password)
    refresh = RefreshToken.for_user(user)
    return success_response(
        {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        log_action(
            user=request.user,
            action="logout",
            entity_type="user",
            entity_id=str(request.user.id),
        )
        return success_response({"detail": "Successfully logged out."})
    except Exception:
        return error_response("LOGOUT_ERROR", "Invalid or expired token.")


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "GET":
        return success_response(UserSerializer(request.user).data)

    serializer = UserUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated = update_user_profile(user=request.user, **serializer.validated_data)
    return success_response(UserSerializer(updated).data)
