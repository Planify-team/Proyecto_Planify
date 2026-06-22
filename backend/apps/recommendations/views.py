from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.core.responses import success_response, error_response
from .serializers import RecommendationSerializer
from .services import generate_recommendations_for_user, log_interaction


def _parse_float(value):
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _parse_int(value):
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommendation_list(request):
    lat    = _parse_float(request.query_params.get("lat"))
    lon    = _parse_float(request.query_params.get("lon"))
    budget = _parse_float(request.query_params.get("budget"))
    people = _parse_int(request.query_params.get("people"))

    recommendations = generate_recommendations_for_user(
        request.user,
        lat=lat,
        lon=lon,
        budget=budget,
        people=people,
    )

    for rec in recommendations[:5]:
        raw_id = rec.activity_id or rec.event_id or rec.place_id
        if raw_id:
            entity_type = "activity" if rec.activity_id else ("event" if rec.event_id else "place")
            log_interaction(user=request.user, action="view", entity_type=entity_type, entity_id=str(raw_id))

    return success_response(RecommendationSerializer(recommendations, many=True).data)


VALID_ENTITY_TYPES = {"activity", "event", "place"}


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recommendation_click(request):
    entity_type = request.data.get("entity_type", "")
    entity_id = request.data.get("entity_id", "")
    if not entity_type or not entity_id:
        return error_response(
            "MISSING_PARAMS", "Se requieren entity_type y entity_id.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if entity_type not in VALID_ENTITY_TYPES:
        return error_response(
            "VALIDATION_ERROR", "entity_type inválido.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    log_interaction(
        user=request.user,
        action="recommendation_click",
        entity_type=entity_type,
        entity_id=str(entity_id),
    )
    return success_response(None)
