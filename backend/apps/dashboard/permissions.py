from rest_framework.permissions import BasePermission


class IsBusinessOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "business_owner")


class IsEventOrganizer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "event_organizer")
