from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings

from apps.core.responses import success_response, error_response
from apps.users.models import User


class AuthThrottle(ScopedRateThrottle):
    scope = "auth"


_SUCCESS_MSG = "Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña."


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def password_reset_request(request):
    email = request.data.get("email", "").strip().lower()
    if not email:
        return error_response("VALIDATION_ERROR", "El correo electrónico es obligatorio.")

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Always return 200 to prevent email enumeration
        return success_response({"detail": _SUCCESS_MSG})

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/restablecer-contrasena/{uid}/{token}"

    send_mail(
        subject="Restablecer contraseña — Planify",
        message=(
            f"Hola {user.first_name or user.email},\n\n"
            f"Recibimos una solicitud para restablecer la contraseña de tu cuenta en Planify.\n\n"
            f"Hacé clic en el siguiente enlace (válido por 24 horas):\n\n"
            f"{reset_link}\n\n"
            f"Si no solicitaste este cambio, podés ignorar este mensaje con seguridad."
        ),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@planify.com"),
        recipient_list=[user.email],
        fail_silently=False,
    )

    return success_response({"detail": _SUCCESS_MSG})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def password_reset_confirm(request):
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")
    new_password = request.data.get("new_password", "")

    if not uid or not token or not new_password:
        return error_response("VALIDATION_ERROR", "Faltan campos obligatorios.")

    if len(new_password) < 8:
        return error_response("VALIDATION_ERROR", "La contraseña debe tener al menos 8 caracteres.")

    try:
        pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return error_response("INVALID_TOKEN", "El enlace de restablecimiento no es válido.")

    if not default_token_generator.check_token(user, token):
        return error_response("INVALID_TOKEN", "El enlace expiró o ya fue utilizado. Solicitá uno nuevo.")

    user.set_password(new_password)
    user.save(update_fields=["password"])

    return success_response({"detail": "Contraseña restablecida con éxito. Ya podés iniciar sesión."})
