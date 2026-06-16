import logging
import time
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

BASE_URL = "https://api.opentripmap.com/0.1/en/places"
RADIUS_CACHE_TTL = 86400   # 24 hours
DETAILS_CACHE_TTL = 604800  # 7 days
TIMEOUT = 10
REQUEST_DELAY = 0.4  # respect ~3 req/s limit


def _get_api_key() -> str | None:
    return getattr(settings, "OPENTRIPMAP_API_KEY", None)


class OpenTripMapProvider:
    """
    Secondary enrichment source: photos and descriptions for activities.
    500 req/day free tier — use conservatively via management command only.
    """

    def search_radius(
        self,
        lat: float,
        lon: float,
        radius_m: int = 500,
        kinds: str = "cultural,amusements,museums,sport",
        limit: int = 10,
    ) -> list[dict]:
        api_key = _get_api_key()
        if not api_key:
            logger.debug("[opentripmap] no API key configured, skipping")
            return []

        cache_key = f"otm:radius:{lat:.4f}:{lon:.4f}:{radius_m}:{kinds}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            resp = requests.get(
                f"{BASE_URL}/radius",
                params={
                    "radius": radius_m,
                    "lon": lon,
                    "lat": lat,
                    "kinds": kinds,
                    "limit": limit,
                    "format": "json",
                    "apikey": api_key,
                },
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                cache.set(cache_key, data, RADIUS_CACHE_TTL)
                return data
        except requests.exceptions.RequestException as exc:
            logger.warning("[opentripmap] search_radius failed: %s", exc)

        return []

    def get_details(self, xid: str) -> dict | None:
        api_key = _get_api_key()
        if not api_key:
            return None

        cache_key = f"otm:details:{xid}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            resp = requests.get(
                f"{BASE_URL}/{xid}",
                params={"apikey": api_key},
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            cache.set(cache_key, data, DETAILS_CACHE_TTL)
            return data
        except requests.exceptions.RequestException as exc:
            logger.warning("[opentripmap] get_details(%s) failed: %s", xid, exc)

        return None

    def find_best_match(self, name: str, candidates: list[dict]) -> dict | None:
        """
        Returns the candidate whose name most closely matches `name`.
        Uses simple token overlap — avoids external difflib dependency.
        """
        if not candidates:
            return None

        name_tokens = set(name.lower().split())
        best = None
        best_score = 0.0

        for c in candidates:
            c_name = c.get("name", "")
            if not c_name:
                continue
            c_tokens = set(c_name.lower().split())
            if not name_tokens or not c_tokens:
                continue
            overlap = len(name_tokens & c_tokens)
            score = overlap / max(len(name_tokens), len(c_tokens))
            if score > best_score:
                best_score = score
                best = c

        # Require at least 50% token overlap
        return best if best_score >= 0.5 else None

    def enrich_activity(self, activity) -> bool:
        """
        Tries to find an image for the activity from OpenTripMap.
        Returns True if image_url was updated.
        """
        lat = float(activity.latitude) if activity.latitude else None
        lon = float(activity.longitude) if activity.longitude else None
        if lat is None or lon is None:
            return False

        time.sleep(REQUEST_DELAY)
        candidates = self.search_radius(lat, lon, radius_m=300)
        match = self.find_best_match(activity.name, candidates)
        if not match:
            return False

        xid = match.get("xid")
        if not xid:
            return False

        time.sleep(REQUEST_DELAY)
        details = self.get_details(xid)
        if not details:
            return False

        image_url = details.get("preview", {}).get("source", "")
        if not image_url:
            # Try older API format
            image_url = details.get("image", "")

        wiki_text = details.get("wikipedia_extracts", {}).get("text", "")

        updated = False
        if image_url and not activity.image_url:
            activity.image_url = image_url
            updated = True

        if wiki_text and not activity.description:
            activity.description = wiki_text[:500]
            updated = True

        if updated:
            update_fields = []
            if image_url and not activity.image_url:
                update_fields.append("image_url")
            if wiki_text and not activity.description:
                update_fields.append("description")
            activity.save(update_fields=update_fields or ["image_url", "description"])

        return updated


opentripmap_provider = OpenTripMapProvider()
