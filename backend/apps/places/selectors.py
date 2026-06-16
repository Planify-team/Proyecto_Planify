import math
from django.db.models import Avg, Count, OuterRef, Subquery
from .models import Place


def _rating_subquery(entity_type: str):
    from apps.reviews.models import Review
    return (
        Review.objects.filter(entity_type=entity_type, entity_id=OuterRef("id"))
        .values("entity_id")
    )


def get_active_places(
    city=None, category=None, lat=None, lon=None, radius_km=None, name=None,
    outdoor_seating=None, fee=None, wheelchair=None, cuisine=None,
):
    from apps.reviews.models import Review
    qs = Place.objects.filter(is_active=True)
    if name:
        qs = qs.filter(name__icontains=name)
    if city:
        qs = qs.filter(city__icontains=city)
    if category:
        qs = qs.filter(category__icontains=category)
    if lat is not None and lon is not None and radius_km:
        lat_range = radius_km / 111.0
        lon_range = radius_km / (111.0 * math.cos(math.radians(float(lat))))
        qs = qs.filter(
            latitude__range=(float(lat) - lat_range, float(lat) + lat_range),
            longitude__range=(float(lon) - lon_range, float(lon) + lon_range),
        )
    if outdoor_seating is not None:
        qs = qs.filter(outdoor_seating=outdoor_seating)
    if fee is not None:
        qs = qs.filter(fee=fee)
    if wheelchair == "yes":
        qs = qs.filter(wheelchair="yes")
    elif wheelchair == "limited":
        qs = qs.filter(wheelchair__in=["yes", "limited"])
    if cuisine:
        qs = qs.filter(cuisine__icontains=cuisine)
    avg_sub = _rating_subquery("place").annotate(a=Avg("stars")).values("a")[:1]
    cnt_sub = _rating_subquery("place").annotate(c=Count("id")).values("c")[:1]
    qs = qs.annotate(avg_rating=Subquery(avg_sub), review_count=Subquery(cnt_sub))
    return qs.order_by("name")


def get_place_by_id(place_id):
    from apps.reviews.models import Review
    avg_sub = (
        Review.objects.filter(entity_type="place", entity_id=OuterRef("id"))
        .values("entity_id").annotate(a=Avg("stars")).values("a")[:1]
    )
    cnt_sub = (
        Review.objects.filter(entity_type="place", entity_id=OuterRef("id"))
        .values("entity_id").annotate(c=Count("id")).values("c")[:1]
    )
    try:
        return (
            Place.objects
            .annotate(avg_rating=Subquery(avg_sub), review_count=Subquery(cnt_sub))
            .get(id=place_id, is_active=True)
        )
    except Place.DoesNotExist:
        return None
