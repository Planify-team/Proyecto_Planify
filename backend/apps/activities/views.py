from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework import status

from apps.core.responses import success_response, created_response, no_content_response, error_response
from apps.core.permissions import IsAdminOrModerator
from .serializers import ActivitySerializer, ActivityCreateSerializer
from .selectors import get_active_activities, get_activity_by_id
from .services import create_activity, update_activity, deactivate_activity


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticatedOrReadOnly])
def activity_list(request):
    if request.method == "GET":
        activities = get_active_activities(
            activity_type=request.query_params.get("type"),
            indoor=request.query_params.get("indoor"),
            outdoor=request.query_params.get("outdoor"),
            budget=request.query_params.get("budget"),
            category=request.query_params.get("category"),
            free=request.query_params.get("free"),
            name=request.query_params.get("name"),
        )
        return success_response(ActivitySerializer(activities, many=True).data)

    if not IsAdminOrModerator().has_permission(request, None):
        return error_response("PERMISSION_DENIED", "Solo administradores pueden crear actividades.", status_code=status.HTTP_403_FORBIDDEN)

    serializer = ActivityCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    activity = create_activity(user=request.user, **serializer.validated_data)
    return created_response(ActivitySerializer(activity).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticatedOrReadOnly])
def activity_detail(request, pk):
    activity = get_activity_by_id(pk)
    if not activity:
        return error_response("NOT_FOUND", "Actividad no encontrada.", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return success_response(ActivitySerializer(activity).data)

    if not IsAdminOrModerator().has_permission(request, None):
        return error_response("PERMISSION_DENIED", "Solo administradores pueden modificar actividades.", status_code=status.HTTP_403_FORBIDDEN)

    if request.method == "PATCH":
        serializer = ActivityCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = update_activity(user=request.user, activity=activity, **serializer.validated_data)
        return success_response(ActivitySerializer(updated).data)

    deactivate_activity(user=request.user, activity=activity)
    return no_content_response()
