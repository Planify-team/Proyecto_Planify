from rest_framework.permissions import BasePermission, SAFE_METHODS


class PlacePermission(BasePermission):
    """Read: anyone authenticated. Write: admin or moderator only."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ("admin", "moderator", "business_owner")

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        if request.user.role in ("admin", "moderator"):
            return True
        if request.user.role == "business_owner":
            return obj.owner == request.user
        return False
