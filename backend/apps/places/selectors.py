import math
from .models import Place
from apps.core.selectors import annotate_ratings


def get_active_places(
    city=None, category=None, lat=None, lon=None, radius_km=None, name=None,
    outdoor_seating=None, fee=None, wheelchair=None, cuisine=None,
):
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
    return annotate_ratings(qs, "place").order_by("name")


def get_place_by_id(place_id):
    try:
        return annotate_ratings(Place.objects.all(), "place").get(id=place_id, is_active=True)
    except Place.DoesNotExist:
        return None
