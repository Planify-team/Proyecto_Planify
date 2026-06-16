"""
Import activities from the Buenos Aires Open Data portal (GCBA).

Source: https://data.buenosaires.gob.ar/dataset/espacios-culturales
Downloads the 'Espacios Culturales' CSV (~3000 cultural spaces with lat/lon).

Usage:
    python manage.py seed_gcba
    python manage.py seed_gcba --dry-run
    python manage.py seed_gcba --limit 100
    python manage.py seed_gcba --clear-gcba
"""
import logging
from django.core.management.base import BaseCommand
from apps.integrations.providers.gcba import gcba_provider
from apps.activities.models import Activity

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import cultural spaces from GCBA Open Data (espacios-culturales dataset)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and count records without persisting to DB",
        )
        parser.add_argument(
            "--clear-gcba",
            action="store_true",
            help="Delete existing GCBA activities before importing",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Max records to import (default: 0 = all)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]

        if options["clear_gcba"] and not dry_run:
            deleted, _ = Activity.objects.filter(source="gcba").delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing GCBA activities"))

        self.stdout.write("Downloading GCBA espacios-culturales dataset...")
        records = gcba_provider.fetch_and_parse(limit=limit)

        if not records:
            self.stderr.write(self.style.ERROR("No records returned — check network or CDN availability"))
            return

        self.stdout.write(f"Parsed {len(records)} activities to import")

        if dry_run:
            from collections import Counter
            by_cat = Counter(r["category"] for r in records)
            self.stdout.write("\nDry run — would import:")
            for cat, count in sorted(by_cat.items(), key=lambda x: -x[1]):
                self.stdout.write(f"  {count:4d}  {cat}")
            with_coords = sum(1 for r in records if r.get("latitude") is not None)
            with_url = sum(1 for r in records if r.get("external_url"))
            self.stdout.write(f"\n  {with_coords} with coordinates")
            self.stdout.write(f"  {with_url} with website URL")
            self.stdout.write(self.style.SUCCESS(f"\n[dry-run] Would import {len(records)} activities"))
            return

        imported = 0
        updated = 0
        skipped = 0

        for rec in records:
            external_id = rec.pop("external_id")
            try:
                obj, created = Activity.objects.update_or_create(
                    external_id=external_id,
                    defaults=rec,
                )
                if created:
                    imported += 1
                else:
                    updated += 1
            except Exception as exc:
                logger.warning("[gcba] Failed to save '%s': %s", rec.get("name"), exc)
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {imported} imported, {updated} updated, {skipped} failed\n"
                f"Total GCBA activities in DB: {Activity.objects.filter(source='gcba').count()}"
            )
        )
