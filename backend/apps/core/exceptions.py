from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def _first_message(data) -> str | None:
    """Extract the first human-readable error string from a DRF error structure."""
    if isinstance(data, str):
        return data
    if isinstance(data, list) and data:
        return _first_message(data[0])
    if isinstance(data, dict):
        for val in data.values():
            msg = _first_message(val)
            if msg:
                return msg
    return None


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_code = "ERROR"
        message = "Ocurrió un error inesperado."

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            error_code = "VALIDATION_ERROR"
            message = _first_message(response.data) or "Verificá los datos ingresados."
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "AUTHENTICATION_ERROR"
            detail = response.data.get("detail") if isinstance(response.data, dict) else None
            message = str(detail) if detail else "Credenciales inválidas."
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "PERMISSION_DENIED"
            detail = response.data.get("detail") if isinstance(response.data, dict) else None
            message = str(detail) if detail else "No tenés permiso para realizar esta acción."
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "NOT_FOUND"
            message = "El recurso solicitado no existe."
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            error_code = "RATE_LIMIT_EXCEEDED"
            message = "Demasiadas solicitudes. Intentá de nuevo en unos minutos."

        details = response.data if isinstance(response.data, dict) else {"detail": response.data}

        response.data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "details": details,
            },
        }

    return response
