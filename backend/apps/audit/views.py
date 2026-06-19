from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrModerator
from apps.core.responses import success_response
from .selectors import get_audit_logs_for_user
from .serializers import AuditLogSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrModerator])
def audit_log_list(request):
    logs = get_audit_logs_for_user(request.user)
    return success_response(AuditLogSerializer(logs, many=True).data)
