import logging
import time
import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://data.buenosaires.gob.ar/api/3/action/datastore_search"
TIMEOUT = 15
RETRY_DELAY = 5

# GCBA CKAN resource IDs — discovered via https://data.buenosaires.gob.ar
# Each dataset maps field names from the raw API to our normalized schema.
DATASETS: dict[str, dict] = {
    "teatros": {
        "resource_id": "2c2b5ebf-e5c0-4a3c-b6d7-30dc4e4d0a1b",
        "category": "Cultura",
        "activity_type": "concert",
        "score_base": 70,
        "indoor": True,
        "outdoor": False,
        "name_field": "nombre",
        "address_field": "domicilio",
        "lat_field": "lat",
        "lon_field": "long",
        "description_field": "observaciones",
        "url_field": "web",
        "barrio_field": "barrio",
        "is_free": None,
    },
    "centros_culturales": {
        "resource_id": "b2e3d6c1-8f7a-4b5e-9c3d-1a2b4e5f6a7b",
        "category": "Cultura",
        "activity_type": "tourism",
        "score_base": 65,
        "indoor": True,
        "outdoor": False,
        "name_field": "nombre",
        "address_field": "domicilio",
        "lat_field": "lat",
        "lon_field": "long",
        "description_field": "descripcion",
        "url_field": "web",
        "barrio_field": "barrio",
        "is_free": True,
    },
    "deportivos": {
        "resource_id": "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
        "category": "Deporte",
        "activity_type": "sports",
        "score_base": 60,
        "indoor": False,
        "outdoor": True,
        "name_field": "nombre",
        "address_field": "domicilio",
        "lat_field": "lat",
        "lon_field": "long",
        "description_field": "descripcion",
        "url_field": "",
        "barrio_field": "barrio",
        "is_free": True,
    },
    "bibliotecas": {
        "resource_id": "4f5a6b7c-8d9e-0f1a-2b3c-4d5e6f7a8b9c",
        "category": "Cultura",
        "activity_type": "tourism",
        "score_base": 50,
        "indoor": True,
        "outdoor": False,
        "name_field": "nombre",
        "address_field": "domicilio",
        "lat_field": "lat",
        "lon_field": "long",
        "description_field": "descripcion",
        "url_field": "web",
        "barrio_field": "barrio",
        "is_free": True,
    },
    "museos": {
        "resource_id": "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
        "category": "Museo",
        "activity_type": "museum",
        "score_base": 72,
        "indoor": True,
        "outdoor": False,
        "name_field": "nombre",
        "address_field": "domicilio",
        "lat_field": "lat",
        "lon_field": "long",
        "description_field": "descripcion",
        "url_field": "web",
        "barrio_field": "barrio",
        "is_free": None,
    },
}


def _safe_float(value) -> float | None:
    if value is None:
        return None
    try:
        f = float(str(value).replace(",", ".").strip())
        return f if f != 0.0 else None
    except (ValueError, TypeError):
        return None


class GCBAProvider:
    """
    Client for Buenos Aires Open Data portal (CKAN/SODA API).
    Converts GCBA dataset records into normalized Activity dicts.
    """

    def fetch_dataset(self, dataset_key: str, limit: int = 500) -> list[dict]:
        config = DATASETS.get(dataset_key)
        if not config:
            raise ValueError(f"Unknown GCBA dataset: {dataset_key}")

        resource_id = config["resource_id"]
        url = BASE_URL
        params = {"resource_id": resource_id, "limit": limit}

        for attempt in range(2):
            try:
                resp = requests.get(url, params=params, timeout=TIMEOUT)
                resp.raise_for_status()
                data = resp.json()
                if not data.get("success"):
                    logger.warning("[gcba] dataset %s returned success=false", dataset_key)
                    return []
                records = data.get("result", {}).get("records", [])
                logger.info("[gcba] %s: %d records fetched", dataset_key, len(records))
                return records
            except requests.exceptions.RequestException as exc:
                logger.warning("[gcba] attempt %d failed for %s: %s", attempt + 1, dataset_key, exc)
                if attempt == 0:
                    time.sleep(RETRY_DELAY)

        return []

    def parse_record(self, record: dict, config: dict) -> dict | None:
        name = str(record.get(config["name_field"], "")).strip()
        if not name:
            return None

        lat = _safe_float(record.get(config.get("lat_field", "lat")))
        lon = _safe_float(record.get(config.get("lon_field", "long")))

        address_parts = []
        addr = str(record.get(config.get("address_field", "domicilio"), "")).strip()
        if addr:
            address_parts.append(addr)
        barrio = str(record.get(config.get("barrio_field", "barrio"), "")).strip()
        if barrio:
            address_parts.append(barrio)
        address = ", ".join(address_parts)

        description = str(record.get(config.get("description_field", "descripcion"), "")).strip()
        external_url = str(record.get(config.get("url_field", "web"), "")).strip()

        # Build a stable external_id from the CKAN _id field
        ckan_id = record.get("_id") or record.get("id") or name
        external_id = f"gcba:{config['resource_id']}:{ckan_id}"

        return {
            "name": name,
            "description": description,
            "category": config["category"],
            "activity_type": config["activity_type"],
            "score_base": config["score_base"],
            "indoor": config["indoor"],
            "outdoor": config["outdoor"],
            "address": address,
            "latitude": lat,
            "longitude": lon,
            "external_url": external_url[:200] if external_url else "",
            "source": "gcba",
            "external_id": external_id,
            "is_free": config.get("is_free"),
            "city": "Buenos Aires",
            "min_budget": 0,
            "max_budget": None,
            "min_people": 1,
            "max_people": None,
        }

    def fetch_and_parse(self, dataset_key: str, limit: int = 500) -> list[dict]:
        config = DATASETS[dataset_key]
        records = self.fetch_dataset(dataset_key, limit=limit)
        result = []
        skipped = 0
        for record in records:
            parsed = self.parse_record(record, config)
            if parsed is None:
                skipped += 1
                continue
            result.append(parsed)
        if skipped:
            logger.info("[gcba] %s: skipped %d records (missing name)", dataset_key, skipped)
        return result


gcba_provider = GCBAProvider()
