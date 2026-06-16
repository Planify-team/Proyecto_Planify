"""
GCBA Open Data provider — downloads CSV from the Buenos Aires CDN.

Data source: https://data.buenosaires.gob.ar/dataset/espacios-culturales
CDN URL:     https://cdn.buenosaires.gob.ar/datosabiertos/datasets/
             ministerio-de-cultura/espacios-culturales/espacios-culturales.csv

The CSV has 3000+ cultural spaces with proper WGS84 lat/lon (LATITUD/LONGITUD).
Field: FUNCION_PRINCIPAL contains the category used for classification.
"""
import csv
import io
import logging
import time
import requests

logger = logging.getLogger(__name__)

TIMEOUT = 20
RETRY_DELAY = 5

ESPACIOS_CULTURALES_URL = (
    "https://cdn.buenosaires.gob.ar/datosabiertos/datasets/"
    "ministerio-de-cultura/espacios-culturales/espacios-culturales.csv"
)

# Maps FUNCION_PRINCIPAL → (category, activity_type, score_base, indoor, outdoor, is_free)
FUNCION_MAP: dict[str, tuple] = {
    "SALA DE TEATRO":                ("Cultura",        "concert",  75, True,  False, None),
    "MUSEO":                         ("Museo",          "museum",   72, True,  False, None),
    "CENTRO CULTURAL":               ("Cultura",        "tourism",  68, True,  True,  True),
    "GALERIA DE ARTE":               ("Cultura",        "museum",   65, True,  False, True),
    "CLUB DE MUSICA EN VIVO":        ("Entretenimiento","concert",  78, True,  False, None),
    "CLUB DE MUSICA EN VIVO - NUEVO":("Entretenimiento","concert",  78, True,  False, None),
    "SALA DE CINE":                  ("Entretenimiento","cinema",   70, True,  False, None),
    "ANFITEATRO":                    ("Cultura",        "concert",  62, False, True,  True),
    "ESPACIO FERIAL":                ("Turismo",        "tourism",  60, False, True,  True),
    "MONUMENTOS Y LUGARES HISTORICOS":("Turismo",       "tourism",  58, False, True,  True),
    "ESPACIO DE FORMACION":          ("Cultura",        "tourism",  55, True,  True,  True),
    "BIBLIOTECA":                    ("Cultura",        "tourism",  50, True,  False, True),
}


def _safe_float(value) -> float | None:
    if value is None:
        return None
    try:
        f = float(str(value).replace(",", ".").strip())
        return f if f != 0.0 else None
    except (ValueError, TypeError):
        return None


def _normalize_url(raw: str) -> str:
    """Add https:// to bare domain strings like 'WWW.EXAMPLE.COM'."""
    url = raw.strip()
    if not url:
        return ""
    if url.lower().startswith(("http://", "https://")):
        return url[:200]
    # bare domain — add https://
    return ("https://" + url)[:200]


def _normalize_name(raw: str) -> str:
    """Title-case names stored in ALL CAPS in the dataset."""
    s = raw.strip()
    if not s:
        return s
    # Only convert if all-upper (avoid mangling already-mixed names)
    if s == s.upper():
        return s.title()
    return s


class GCBAProvider:
    """
    Downloads the GCBA 'Espacios Culturales' CSV and converts each row
    into a normalized Activity dict ready for update_or_create.
    """

    def fetch_csv(self) -> list[dict]:
        """Download and parse the CSV, return raw rows as list of dicts."""
        for attempt in range(2):
            try:
                resp = requests.get(ESPACIOS_CULTURALES_URL, timeout=TIMEOUT)
                resp.raise_for_status()
                content = resp.content.decode("utf-8", errors="replace")
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
                logger.info("[gcba] downloaded %d rows from espacios-culturales", len(rows))
                return rows
            except requests.exceptions.RequestException as exc:
                logger.warning("[gcba] attempt %d failed: %s", attempt + 1, exc)
                if attempt == 0:
                    time.sleep(RETRY_DELAY)
        return []

    def parse_record(self, record: dict) -> dict | None:
        """Convert a CSV row to an Activity-ready dict. Returns None to skip."""
        funcion = record.get("FUNCION_PRINCIPAL", "").strip()
        mapping = FUNCION_MAP.get(funcion)
        if mapping is None:
            return None  # skip BAR, LIBRERIA, DISQUERIA, etc.

        category, activity_type, score_base, indoor, outdoor, is_free = mapping

        name_raw = record.get("ESTABLECIMIENTO", "").strip()
        if not name_raw:
            return None

        name = _normalize_name(name_raw)

        lat = _safe_float(record.get("LATITUD"))
        lon = _safe_float(record.get("LONGITUD"))
        # Sanity check: Buenos Aires is roughly lat -34 to -35, lon -58 to -59
        if lat is not None and not (-36 < lat < -33):
            lat = None
        if lon is not None and not (-60 < lon < -57):
            lon = None

        address = record.get("DIRECCION", "").strip()
        barrio = record.get("BARRIO", "").strip().title()
        if barrio and barrio not in address:
            address_display = f"{address} ({barrio})" if address else barrio
        else:
            address_display = address

        raw_web = record.get("WEB", "").strip()
        external_url = _normalize_url(raw_web)

        fid = record.get("fid", "").strip()
        external_id = f"gcba:espacios-culturales:{fid}" if fid else f"gcba:espacios-culturales:{name_raw}"

        return {
            "name": name,
            "description": "",
            "category": category,
            "activity_type": activity_type,
            "score_base": score_base,
            "indoor": indoor,
            "outdoor": outdoor,
            "address": address_display[:300],
            "latitude": lat,
            "longitude": lon,
            "external_url": external_url,
            "source": "gcba",
            "external_id": external_id,
            "is_free": is_free,
            "city": "Buenos Aires",
            "min_budget": 0,
            "max_budget": None,
            "min_people": 1,
            "max_people": None,
        }

    def fetch_and_parse(self, limit: int = 0) -> list[dict]:
        """
        Returns list of normalized Activity dicts from the GCBA CSV.
        limit=0 means no limit (import all).
        """
        rows = self.fetch_csv()
        result = []
        skipped_category = 0
        skipped_no_name = 0
        category_counts: dict[str, int] = {}

        for i, record in enumerate(rows):
            if limit and i >= limit:
                break
            parsed = self.parse_record(record)
            if parsed is None:
                funcion = record.get("FUNCION_PRINCIPAL", "").strip()
                if record.get("ESTABLECIMIENTO", "").strip():
                    skipped_category += 1
                else:
                    skipped_no_name += 1
                continue
            category_counts[parsed["category"]] = category_counts.get(parsed["category"], 0) + 1
            result.append(parsed)

        logger.info(
            "[gcba] parsed %d activities (skipped: %d no-category, %d no-name). Categories: %s",
            len(result), skipped_category, skipped_no_name, category_counts,
        )
        return result


# Singleton for use in management commands
gcba_provider = GCBAProvider()

# Public alias kept for backwards compatibility with tests
DATASETS: dict[str, dict] = {
    "espacios_culturales": {"resource_id": "gcba:espacios-culturales", "source": "gcba"},
}
