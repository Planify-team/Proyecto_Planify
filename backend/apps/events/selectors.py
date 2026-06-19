from django.db.models import Avg, Count, OuterRef, Subquery
from django.utils import timezone
from .models import Event, EventStatus


def _rating_subquery(field: str):
    from apps.reviews.models import Review
    base = Review.objects.filter(entity_type="event", entity_id=OuterRef("id")).values("entity_id")
    if field == "avg":
        return base.annotate(v=Avg("stars")).values("v")[:1]
    return base.annotate(v=Count("id")).values("v")[:1]


def get_published_events(category=None, date_from=None, date_to=None, city=None, free=None, name=None, place_id=None):
    qs = Event.objects.filter(status=EventStatus.PUBLISHED, start_date__gte=timezone.now())
    if name:
        qs = qs.filter(title__icontains=name)
    if category:
        qs = qs.filter(category__icontains=category)
    if date_from:
        qs = qs.filter(start_date__date__gte=date_from)
    if date_to:
        qs = qs.filter(start_date__date__lte=date_to)
    if city:
        qs = qs.filter(place__city__icontains=city)
    if free:
        qs = qs.filter(price=0)
    if place_id:
        qs = qs.filter(place_id=place_id)
    qs = qs.annotate(
        avg_rating=Subquery(_rating_subquery("avg")),
        review_count=Subquery(_rating_subquery("count")),
    )
    return qs.select_related("place", "organizer").order_by("start_date")


def get_event_by_id(event_id):
    try:
        return (
            Event.objects.select_related("place", "organizer")
            .annotate(
                avg_rating=Subquery(_rating_subquery("avg")),
                review_count=Subquery(_rating_subquery("count")),
            )
            .get(id=event_id)
        )
    except Event.DoesNotExist:
        return None
