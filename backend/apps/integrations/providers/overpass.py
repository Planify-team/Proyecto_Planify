import logging
import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TTL = 86400  # 24 hours — OSM data is stable
TIMEOUT = 25
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
HEADERS = {"User-Agent": "Planify/1.0 (lautaromatiasmelean@gmail.com)"}

OSM_TO_CATEGORY: dict[str, str] = {
    "restaurant": "Gastronomía",
    "fast_food": "Gastronomía",
    "food_court": "Gastronomía",
    "ice_cream": "Gastronomía",
    "bar": "Bar",
    "pub": "Bar",
    "biergarten": "Bar",
    "cafe": "Café",
    "museum": "Museo",
    "cinema": "Cine",
    "nightclub": "Entretenimiento",
    "theatre": "Cultura",
    "arts_centre": "Cultura",
    "library": "Cultura",
    "park": "Parque",
    "fitness_centre": "Deporte",
    "sports_centre": "Deporte",
    "stadium": "Deporte",
    "attraction": "Turismo",
    "viewpoint": "Turismo",
    "hotel": "Alojamiento",
    "hostel": "Alojamiento",
    "hospital": "Salud",
    "clinic": "Salud",
    "pharmacy": "Salud",
    "mall": "Shopping",
    "supermarket": "Shopping",
    "swimming_pool": "Deporte",
    "golf_course": "Deporte",
    "miniature_golf": "Deporte",
    "bowling_alley": "Entretenimiento",
    "escape_game": "Entretenimiento",
    "amusement_arcade": "Entretenimiento",
    "zoo": "Turismo",
    "theme_park": "Turismo",
    "aquarium": "Turismo",
    "artwork": "Cultura",
    "ice_cream": "Gastronomía",
}

_TYPE_TO_FILTER: dict[str, str] = {
    "restaurant": '["amenity"~"restaurant|fast_food"]',
    "bar": '["amenity"~"bar|pub|biergarten"]',
    "cafe": '["amenity"="cafe"]',
    "museum": '["amenity"="museum"]',
    "park": '["leisure"="park"]',
    "cinema": '["amenity"="cinema"]',
    "gym": '["leisure"~"fitness_centre|sports_centre"]',
    "nightclub": '["amenity"="nightclub"]',
    "theatre": '["amenity"="theatre"]',
    "attraction": '["tourism"~"attraction|viewpoint"]',
    "hotel": '["tourism"~"hotel|hostel"]',
    "hospital": '["amenity"~"hospital|clinic"]',
    "pharmacy": '["amenity"="pharmacy"]',
    "shopping": '["shop"~"mall|supermarket"]',
}

def _parse_bool_tag(value: str | None) -> bool | None:
    if value in ("yes", "true", "1"):
        return True
    if value in ("no", "false", "0"):
        return False
    return None


_DEFAULT_AMENITIES = "restaurant|fast_food|bar|pub|cafe|ice_cream|museum|cinema|nightclub|theatre|arts_centre|library|biergarten"
_DEFAULT_LEISURE = "park|fitness_centre|sports_centre|stadium|swimming_pool|golf_course|miniature_golf|bowling_alley|escape_game|amusement_arcade"
_DEFAULT_TOURISM = "attraction|viewpoint|zoo|theme_park|aquarium|artwork"


class OverpassProvider:
    def search_nearby(self, lat: float, lon: float, radius: int = 1500, place_type: str = "") -> list[dict]:
        lat_r = round(lat, 4)
        lon_r = round(lon, 4)
        cache_key = f"overpass:{lat_r}:{lon_r}:{radius}:{place_type}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        query = self._build_query(lat_r, lon_r, radius, place_type)
        try:
            resp = requests.get(OVERPASS_URL, params={"data": query}, headers=HEADERS, timeout=TIMEOUT)
            resp.raise_for_status()
            elements = resp.json().get("elements", [])
            results = self._parse_elements(elements)
            cache.set(cache_key, results, CACHE_TTL)
            return results
        except Exception as exc:
            logger.warning("OverpassProvider.search_nearby error: %s", exc)
            return []

    def search_by_query(self, query: str, lat: float, lon: float) -> list[dict]:
        """Text search is not natively supported by Overpass — returns nearby results."""
        return self.search_nearby(lat, lon, radius=3000)

    def _build_query(self, lat: float, lon: float, radius: int, place_type: str) -> str:
        around = f"(around:{radius},{lat},{lon})"
        tag = _TYPE_TO_FILTER.get(place_type, "")
        if tag:
            # nodes only — faster; large places (parks, malls) are also tagged on nodes in OSM
            return (
                f"[out:json][timeout:{TIMEOUT}];"
                f"(node{tag}{around};);"
                f"out 60;"
            )
        return (
            f"[out:json][timeout:{TIMEOUT}];"
            f'(node["amenity"~"{_DEFAULT_AMENITIES}"]{around};'
            f'node["leisure"~"{_DEFAULT_LEISURE}"]{around};'
            f'node["tourism"~"{_DEFAULT_TOURISM}"]{around};'
            f");"
            f"out 80;"
        )

    def _parse_elements(self, elements: list) -> list[dict]:
        results = []
        seen: set[str] = set()
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:es") or tags.get("name:en")
            if not name:
                continue

            lat, lon = el.get("lat"), el.get("lon")
            if lat is None or lon is None:
                continue

            external_id = f"osm:{el['type']}:{el['id']}"
            if external_id in seen:
                continue
            seen.add(external_id)

            results.append({
                "external_id": external_id,
                "name": name,
                "address": self._build_address(tags),
                "city": tags.get("addr:city") or tags.get("addr:town") or "",
                "latitude": lat,
                "longitude": lon,
                "category": self._resolve_category(tags),
                "price_level": 0,
                "source": "osm",
                "phone": tags.get("phone") or tags.get("contact:phone") or "",
                "website": tags.get("website") or tags.get("contact:website") or "",
                "opening_hours": tags.get("opening_hours", ""),
                "cuisine": tags.get("cuisine", ""),
                "fee": _parse_bool_tag(tags.get("fee")),
                "outdoor_seating": _parse_bool_tag(tags.get("outdoor_seating")),
                "wheelchair": tags.get("wheelchair", ""),
                "internet_access": _parse_bool_tag(tags.get("internet_access") or tags.get("wifi")),
                "description": tags.get("description") or tags.get("note") or "",
            })
        return results

    def _resolve_category(self, tags: dict) -> str:
        for key in ("amenity", "leisure", "tourism", "shop"):
            val = tags.get(key)
            if val and val in OSM_TO_CATEGORY:
                return OSM_TO_CATEGORY[val]
        return "Lugar"

    def _build_address(self, tags: dict) -> str:
        parts = []
        street = tags.get("addr:street")
        if street:
            number = tags.get("addr:housenumber", "")
            parts.append(f"{street} {number}".strip())
        city = tags.get("addr:city") or tags.get("addr:town")
        if city:
            parts.append(city)
        return ", ".join(parts)


overpass_provider = OverpassProvider()
