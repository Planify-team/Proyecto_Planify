from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.core.cache import cache
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from apps.core.responses import success_response


@api_view(["GET"])
@permission_classes([AllowAny])
def trending(request):
    from apps.favorites.models import Favorite
    from apps.places.models import Place
    from apps.activities.models import Activity
    from apps.events.models import Event

    cutoff = timezone.now() - timedelta(days=30)
    limit = 6

    def _top_ids(field):
        return list(
            Favorite.objects
            .filter(**{f"{field}__isnull": False}, created_at__gte=cutoff)
            .values(field)
            .annotate(n=Count("id"))
            .order_by("-n")
            .values_list(field, flat=True)[:limit]
        )

    place_ids = _top_ids("place")
    activity_ids = _top_ids("activity")
    event_ids = _top_ids("event")

    places = list(Place.objects.filter(id__in=place_ids, is_active=True).values(
        "id", "name", "category", "city", "image_url", "price_level",
    ))
    activities = list(Activity.objects.filter(id__in=activity_ids, is_active=True).values(
        "id", "name", "category", "activity_type", "min_budget", "indoor", "outdoor",
    ))
    events = list(Event.objects.filter(id__in=event_ids, status="published").values(
        "id", "title", "category", "start_date", "price", "image_url",
    ))

    return success_response({"places": places, "activities": activities, "events": events})


@api_view(["GET"])
@permission_classes([AllowAny])
def search(request):
    from apps.places.models import Place
    from apps.activities.models import Activity
    from apps.events.models import Event, EventStatus

    q = request.query_params.get("q", "").strip()
    if not q:
        return success_response({"places": [], "activities": [], "events": []})

    places = list(
        Place.objects.filter(is_active=True, name__icontains=q)
        .values("id", "name", "category", "city", "image_url", "price_level")[:10]
    )
    activities = list(
        Activity.objects.filter(is_active=True, name__icontains=q)
        .values("id", "name", "category", "activity_type", "min_budget", "indoor", "outdoor")[:10]
    )
    events = list(
        Event.objects.filter(status=EventStatus.PUBLISHED, title__icontains=q)
        .values("id", "title", "category", "start_date", "price", "image_url")[:10]
    )
    return success_response({"places": places, "activities": activities, "events": events})


@api_view(["GET"])
@permission_classes([AllowAny])
def healthcheck(request):
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False

    redis_ok = True
    try:
        cache.set("_health", "1", timeout=5)
        redis_ok = cache.get("_health") == "1"
    except Exception:
        redis_ok = False

    healthy = db_ok and redis_ok
    status_code = 200 if healthy else 503
    return Response(
        {
            "success": healthy,
            "data": {
                "status": "healthy" if healthy else "unhealthy",
                "database": "connected" if db_ok else "disconnected",
                "redis": "connected" if redis_ok else "disconnected",
            },
        },
        status=status_code,
    )
