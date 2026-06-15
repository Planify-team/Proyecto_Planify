from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework import status

from apps.core.responses import success_response, created_response, no_content_response, error_response
from .serializers import EventSerializer, EventCreateSerializer
from .selectors import get_published_events, get_event_by_id
from .services import create_event, update_event, publish_event, cancel_event
from .permissions import EventPermission


@api_view(["GET", "POST"])
@permission_classes([EventPermission])
def event_list(request):
    if request.method == "GET":
        events = get_published_events(
            category=request.query_params.get("category"),
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
            city=request.query_params.get("city"),
            free=request.query_params.get("free"),
            name=request.query_params.get("name"),
        )
        return success_response(EventSerializer(events, many=True).data)

    serializer = EventCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    event = create_event(user=request.user, **serializer.validated_data)
    return created_response(EventSerializer(event).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([EventPermission])
def event_detail(request, pk):
    from rest_framework import status as http_status
    event = get_event_by_id(pk)
    if not event:
        return error_response("NOT_FOUND", "Evento no encontrado.", status_code=http_status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return success_response(EventSerializer(event).data)

    if not EventPermission().has_object_permission(request, None, event):
        return error_response("PERMISSION_DENIED", "No tenés permiso para modificar este evento.", status_code=http_status.HTTP_403_FORBIDDEN)

    if request.method == "PATCH":
        serializer = EventCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        event = update_event(user=request.user, event=event, **serializer.validated_data)
        return success_response(EventSerializer(event).data)

    if request.method == "DELETE":
        cancel_event(user=request.user, event=event)
        return no_content_response()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def event_publish(request, pk):
    from rest_framework import status as http_status
    event = get_event_by_id(pk)
    if not event:
        return error_response("NOT_FOUND", "Evento no encontrado.", status_code=http_status.HTTP_404_NOT_FOUND)
    if not (request.user.role in ("admin", "moderator") or event.organizer == request.user):
        return error_response("PERMISSION_DENIED", "No tenés permiso para publicar este evento.", status_code=http_status.HTTP_403_FORBIDDEN)
    event = publish_event(user=request.user, event=event)
    return success_response(EventSerializer(event).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def event_cancel(request, pk):
    from rest_framework import status as http_status
    event = get_event_by_id(pk)
    if not event:
        return error_response("NOT_FOUND", "Evento no encontrado.", status_code=http_status.HTTP_404_NOT_FOUND)
    if not EventPermission().has_object_permission(request, None, event):
        return error_response("PERMISSION_DENIED", "No tenés permiso para cancelar este evento.", status_code=http_status.HTTP_403_FORBIDDEN)
    reason = request.data.get("reason", "")
    event = cancel_event(user=request.user, event=event, reason=reason)
    return success_response(EventSerializer(event).data)
