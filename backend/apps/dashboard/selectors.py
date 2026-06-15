from django.utils import timezone


def get_business_stats(user):
    from apps.places.models import Place
    from apps.promotions.models import Promotion, PromotionStatus
    from apps.reviews.models import Review

    owned_place_ids = list(
        Place.objects.filter(owner=user).values_list("id", flat=True)
    )
    total_places = len(owned_place_ids)
    total_promotions = Promotion.objects.filter(owner=user).count()
    active_promotions = Promotion.objects.filter(owner=user, status=PromotionStatus.ACTIVE).count()

    reviews_qs = Review.objects.filter(entity_type="place", entity_id__in=[str(i) for i in owned_place_ids])
    total_reviews = reviews_qs.count()
    avg = None
    if total_reviews:
        from django.db.models import Avg
        avg = reviews_qs.aggregate(a=Avg("stars"))["a"]
        avg = round(float(avg), 1) if avg is not None else None

    return {
        "total_places": total_places,
        "total_promotions": total_promotions,
        "active_promotions": active_promotions,
        "total_reviews": total_reviews,
        "avg_rating": avg,
    }


def get_owned_places(user):
    from apps.places.models import Place
    return Place.objects.filter(owner=user).order_by("name")


def get_owned_promotions(user):
    from apps.promotions.models import Promotion
    return Promotion.objects.filter(owner=user).order_by("-start_date")


def get_organizer_stats(user):
    from apps.events.models import Event, EventStatus
    from apps.reviews.models import Review

    total_events = Event.objects.filter(organizer=user).count()
    published_events = Event.objects.filter(organizer=user, status=EventStatus.PUBLISHED).count()

    owned_event_ids = list(Event.objects.filter(organizer=user).values_list("id", flat=True))
    reviews_qs = Review.objects.filter(entity_type="event", entity_id__in=[str(i) for i in owned_event_ids])
    total_reviews = reviews_qs.count()
    avg = None
    if total_reviews:
        from django.db.models import Avg
        avg = reviews_qs.aggregate(a=Avg("stars"))["a"]
        avg = round(float(avg), 1) if avg is not None else None

    return {
        "total_events": total_events,
        "published_events": published_events,
        "total_reviews": total_reviews,
        "avg_rating": avg,
    }


def get_owned_events(user):
    from apps.events.models import Event
    return Event.objects.filter(organizer=user).order_by("-start_date")
