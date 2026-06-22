import logging
import math
from django.utils import timezone
from django.db.models import Q

from apps.places.models import Place
from .providers.overpass import overpass_provider

logger = logging.getLogger(__name__)

SYNC_STALE_HOURS = 24
NEARBY_LIMIT = 25  # max places returned to the user per "cerca de mí" query

# These categories are inherently worth showing even with minimal OSM data
_HIGH_VALUE_CATEGORIES = {"Museo", "Parque", "Cultura", "Turismo", "Deporte", "Entretenimiento"}

# These categories are never useful for planning outings
_SKIP_CATEGORIES = {"Salud", "Alojamiento", "Shopping"}


def _osm_passes_quality(item: dict) -> bool:
    """Return True if the OSM place is worth storing and showing to users."""
    category = item.get("category", "")

    if category in _SKIP_CATEGORIES:
        return False

    # Cultural/outdoor venues are always worth showing
    if category in _HIGH_VALUE_CATEGORIES:
        return True

    # For gastronomy/bars/cafés require at least one contact/operational signal
    has_website = bool((item.get("website") or "").strip())
    has_phone = bool((item.get("phone") or "").strip())
    has_hours = bool((item.get("opening_hours") or "").strip())
    has_address = bool((item.get("address") or "").strip())
    return (has_website or has_phone or has_hours or has_address)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def get_external_places(lat: float, lon: float, radius: int = 1500, place_type: str = "") -> list:
    """Return nearby places, curated-first, capped at NEARBY_LIMIT."""
    stale_threshold = timezone.now() - timezone.timedelta(hours=SYNC_STALE_HOURS)
    db_places = list(
        Place.objects.filter(
            is_active=True,
            last_synced_at__gte=stale_threshold,
            latitude__isnull=False,
            longitude__isnull=False,
        ).exclude(category__in=_SKIP_CATEGORIES)
    )

    nearby_db = [
        p for p in db_places
        if _haversine_km(lat, lon, float(p.latitude), float(p.longitude)) <= radius / 1000
    ]

    if nearby_db:
        # Curated places first, then by name
        nearby_db.sort(key=lambda p: (not p.is_curated, p.name))
        return nearby_db[:NEARBY_LIMIT]

    raw_results = overpass_provider.search_nearby(lat, lon, radius, place_type)
    return _upsert_places(raw_results)


def search_external_places(query: str, lat: float, lon: float) -> list:
    """Text search — Overpass doesn't support it natively, so returns nearby + internal fallback."""
    raw_results = overpass_provider.search_by_query(query, lat, lon)
    if not raw_results:
        return list(
            Place.objects.filter(is_active=True, name__icontains=query).order_by("name")[:20]
        )
    return _upsert_places(raw_results)


def _auto_description(item: dict) -> str:
    category = item.get("category", "")
    city = item.get("city", "")
    cuisine = item.get("cuisine", "")
    outdoor_seating = item.get("outdoor_seating")
    fee = item.get("fee")

    if cuisine:
        cuisine_clean = cuisine.split(";")[0].strip().lower()
        cuisine_map = {
            "pizza": "Pizzería",
            "sushi": "Restaurante de sushi",
            "burger": "Hamburguesería",
            "italian": "Restaurante italiano",
            "chinese": "Restaurante chino",
            "mexican": "Restaurante mexicano",
            "argentinian": "Restaurante argentino",
            "seafood": "Restaurante de mariscos",
            "vegetarian": "Restaurante vegetariano",
            "vegan": "Restaurante vegano",
        }
        label = cuisine_map.get(cuisine_clean, f"Restaurante de {cuisine_clean}")
        if city:
            return f"{label} en {city}"
        return label

    if category == "Parque":
        return f"Espacio verde en {city}" if city else "Espacio verde"
    if category == "Museo" and fee is False:
        return f"Museo de entrada gratuita en {city}" if city else "Museo de entrada gratuita"
    if category == "Museo":
        return f"Museo en {city}" if city else "Museo"
    if outdoor_seating is True:
        return f"{category} con terraza exterior en {city}" if city else f"{category} con terraza exterior"

    if city:
        return f"{category} en {city}"
    return category or "Lugar"


def _upsert_places(raw_results: list) -> list:
    now = timezone.now()
    places = []
    skipped = 0
    for item in raw_results:
        if not item.get("external_id") or not item.get("latitude") or not item.get("longitude"):
            continue
        if not _osm_passes_quality(item):
            skipped += 1
            continue
        description = item.get("description", "") or _auto_description(item)
        place, _ = Place.objects.update_or_create(
            external_id=item["external_id"],
            defaults={
                "name": item["name"],
                "address": item["address"],
                "city": item.get("city", ""),
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "category": item["category"],
                "price_level": item.get("price_level", 0),
                "phone": item.get("phone", ""),
                "website": item.get("website", ""),
                "source": "osm",
                "last_synced_at": now,
                "is_active": True,
                "opening_hours": item.get("opening_hours", ""),
                "cuisine": item.get("cuisine", ""),
                "fee": item.get("fee"),
                "outdoor_seating": item.get("outdoor_seating"),
                "wheelchair": item.get("wheelchair", ""),
                "internet_access": item.get("internet_access"),
                "description": description,
                # is_curated is intentionally excluded: never overwrite manual curation
            },
        )
        places.append(place)
    if skipped:
        logger.debug("_upsert_places: skipped %d low-quality OSM results", skipped)
    return places[:NEARBY_LIMIT]
