from .models import AuditLog


def get_audit_logs_for_user(user):
    return AuditLog.objects.filter(user=user).select_related("user").order_by("-created_at")
