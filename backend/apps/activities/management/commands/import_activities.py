"""
Importa actividades desde un archivo CSV preparado por el equipo.

Uso:
    python manage.py import_activities ruta/al/archivo.csv
    python manage.py import_activities ruta/al/archivo.csv --dry-run
    python manage.py import_activities ruta/al/archivo.csv --city "Buenos Aires"

Columnas esperadas (en cualquier orden):
    name            (requerido) Nombre de la actividad
    description     Descripción
    category        Ej: "Entretenimiento", "Gastronomía", "Deporte"
    activity_type   restaurant | bar | cinema | museum | park | sports | concert | gaming | tourism | shopping
    city            Default: "Buenos Aires"
    min_budget      Número (ARS). Default: 0
    max_budget      Número (ARS). Vacío = sin límite
    min_people      Número. Default: 1
    max_people      Número. Vacío = sin límite
    indoor          true/false/si/no. Default: false
    outdoor         true/false/si/no. Default: false
    score_base      1-100. Default: 60
    address         Dirección en texto libre
    latitude        Decimal. Ej: -34.6037
    longitude       Decimal. Ej: -58.3816
    is_free         true/false/si/no. Vacío = desconocido
    external_url    URL del lugar
    image_url       URL de imagen

La importación es idempotente: si ya existe una actividad con el mismo nombre
y ciudad, la actualiza en lugar de duplicarla.
"""
import csv
import sys
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.activities.models import Activity, ActivityType

VALID_TYPES = {t.value for t in ActivityType}

BOOL_MAP = {
    "true": True, "si": True, "sí": True, "yes": True, "1": True,
    "false": False, "no": False, "0": False,
}


def _parse_bool(value: str):
    """Retorna True, False, o None si está vacío/desconocido."""
    v = value.strip().lower()
    if not v:
        return None
    return BOOL_MAP.get(v, None)


def _parse_decimal(value: str, default=None):
    v = value.strip()
    if not v:
        return default
    try:
        return float(v)
    except ValueError:
        return default


def _parse_int(value: str, default=None):
    v = value.strip()
    if not v:
        return default
    try:
        return int(v)
    except ValueError:
        return default


class Command(BaseCommand):
    help = "Importa actividades desde CSV preparado por el equipo"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Ruta al archivo CSV")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula la importación sin guardar nada en la base de datos",
        )
        parser.add_argument(
            "--city",
            type=str,
            default="",
            help="Ciudad por defecto si la columna 'city' está vacía (ej: 'Buenos Aires')",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_file"])
        if not csv_path.exists():
            raise CommandError(f"Archivo no encontrado: {csv_path}")

        dry_run = options["dry_run"]
        default_city = options["city"]

        created = 0
        updated = 0
        skipped = 0
        errors = []

        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        self.stdout.write(f"Procesando {len(rows)} filas de {csv_path.name}…\n")

        for i, row in enumerate(rows, start=2):  # fila 1 = header
            name = row.get("name", "").strip()
            if not name:
                errors.append(f"Fila {i}: sin nombre — omitida")
                skipped += 1
                continue

            activity_type = row.get("activity_type", "").strip().lower()
            if activity_type not in VALID_TYPES:
                errors.append(
                    f"Fila {i} '{name}': activity_type '{activity_type}' inválido "
                    f"(válidos: {', '.join(sorted(VALID_TYPES))}) — omitida"
                )
                skipped += 1
                continue

            city = row.get("city", "").strip() or default_city

            defaults = {
                "description": row.get("description", "").strip(),
                "category": row.get("category", "").strip(),
                "activity_type": activity_type,
                "city": city,
                "min_budget": _parse_decimal(row.get("min_budget", ""), default=0),
                "max_budget": _parse_decimal(row.get("max_budget", "")),
                "min_people": _parse_int(row.get("min_people", ""), default=1),
                "max_people": _parse_int(row.get("max_people", "")),
                "indoor": _parse_bool(row.get("indoor", "")) or False,
                "outdoor": _parse_bool(row.get("outdoor", "")) or False,
                "score_base": _parse_int(row.get("score_base", ""), default=60),
                "address": row.get("address", "").strip(),
                "latitude": _parse_decimal(row.get("latitude", "")),
                "longitude": _parse_decimal(row.get("longitude", "")),
                "is_free": _parse_bool(row.get("is_free", "")),
                "external_url": row.get("external_url", "").strip(),
                "image_url": row.get("image_url", "").strip(),
                "source": "manual",
                "is_active": True,
            }

            action = "CREAR"
            existing = Activity.objects.filter(name=name, city=city).first()
            if existing:
                action = "ACTUALIZAR"

            self.stdout.write(f"  [{action}] {name} ({activity_type}) — {city}")

            if not dry_run:
                if existing:
                    Activity.objects.filter(name=name, city=city).update(**defaults)
                    updated += 1
                else:
                    Activity.objects.create(name=name, **defaults)
                    created += 1
            else:
                if existing:
                    updated += 1
                else:
                    created += 1

        self.stdout.write("\n" + "─" * 50)
        if dry_run:
            self.stdout.write(self.style.WARNING("MODO DRY-RUN — nada fue guardado"))
        self.stdout.write(self.style.SUCCESS(f"✓ Creadas:      {created}"))
        self.stdout.write(self.style.SUCCESS(f"✓ Actualizadas: {updated}"))
        if skipped:
            self.stdout.write(self.style.WARNING(f"⚠ Omitidas:     {skipped}"))
        if errors:
            self.stdout.write(self.style.ERROR("\nErrores:"))
            for e in errors:
                self.stdout.write(self.style.ERROR(f"  • {e}"))

        if dry_run and (created + updated) > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"\nEjecutá sin --dry-run para guardar {created + updated} actividades."
                )
            )
