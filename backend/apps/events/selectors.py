from django.utils import timezone
from .models import Event, EventStatus
from apps.core.selectors import annotate_ratings


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
    return annotate_ratings(qs, "event").select_related("place", "organizer").order_by("start_date")


def get_event_by_id(event_id):
    try:
        return (
            annotate_ratings(Event.objects.select_related("place", "organizer"), "event")
            .get(id=event_id)
        )
    except Event.DoesNotExist:
        return None
