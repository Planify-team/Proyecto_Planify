from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from apps.core.responses import success_response, error_response
from apps.places.serializers import PlaceSerializer
from apps.promotions.serializers import PromotionSerializer
from apps.events.serializers import EventSerializer
from .selectors import (
    get_business_stats, get_owned_places, get_owned_promotions,
    get_organizer_stats, get_owned_events,
)
from .permissions import IsBusinessOwner, IsEventOrganizer


@api_view(["GET"])
@permission_classes([IsBusinessOwner])
def business_dashboard(request):
    stats = get_business_stats(request.user)
    return success_response(stats)


@api_view(["GET"])
@permission_classes([IsBusinessOwner])
def business_places(request):
    places = get_owned_places(request.user)
    return success_response(PlaceSerializer(places, many=True).data)


@api_view(["GET"])
@permission_classes([IsBusinessOwner])
def business_promotions(request):
    promotions = get_owned_promotions(request.user)
    return success_response(PromotionSerializer(promotions, many=True).data)


@api_view(["GET"])
@permission_classes([IsEventOrganizer])
def organizer_dashboard(request):
    stats = get_organizer_stats(request.user)
    return success_response(stats)


@api_view(["GET"])
@permission_classes([IsEventOrganizer])
def organizer_events(request):
    events = get_owned_events(request.user)
    return success_response(EventSerializer(events, many=True).data)
