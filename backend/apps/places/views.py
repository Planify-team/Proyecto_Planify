from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from apps.core.responses import success_response, created_response, no_content_response, error_response
from .serializers import PlaceSerializer, PlaceCreateSerializer
from .selectors import get_active_places, get_place_by_id
from .services import create_place, update_place, deactivate_place
from .permissions import PlacePermission


@api_view(["GET", "POST"])
@permission_classes([PlacePermission])
def place_list(request):
    if request.method == "GET":
        city = request.query_params.get("city")
        category = request.query_params.get("category")
        cuisine = request.query_params.get("cuisine") or None
        wheelchair = request.query_params.get("wheelchair") or None

        def _parse_bool_param(val):
            if val == "true":
                return True
            if val == "false":
                return False
            return None

        outdoor_seating = _parse_bool_param(request.query_params.get("outdoor_seating"))
        fee = _parse_bool_param(request.query_params.get("fee"))

        places = get_active_places(
            city=city, category=category, cuisine=cuisine, wheelchair=wheelchair,
            outdoor_seating=outdoor_seating, fee=fee,
        )

        if request.query_params.get("open_now") == "true":
            from .utils import OpeningHoursParser
            places = [p for p in places if OpeningHoursParser.is_open(p.opening_hours) is True]

        return success_response(PlaceSerializer(places, many=True).data)

    serializer = PlaceCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    place = create_place(user=request.user, **serializer.validated_data)
    return created_response(PlaceSerializer(place).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([PlacePermission])
def place_detail(request, pk):
    from rest_framework import status
    place = get_place_by_id(pk)
    if not place:
        return error_response("NOT_FOUND", "Lugar no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return success_response(PlaceSerializer(place).data)

    if not PlacePermission().has_object_permission(request, None, place):
        from rest_framework import status as http_status
        return error_response("PERMISSION_DENIED", "No tenés permiso para modificar este lugar.", status_code=http_status.HTTP_403_FORBIDDEN)

    if request.method == "PATCH":
        serializer = PlaceCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = update_place(user=request.user, place=place, **serializer.validated_data)
        return success_response(PlaceSerializer(updated).data)

    if request.method == "DELETE":
        deactivate_place(user=request.user, place=place)
        return no_content_response()
