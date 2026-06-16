"""
Import activities from Buenos Aires Open Data portal (GCBA).

Usage:
    python manage.py seed_gcba
    python manage.py seed_gcba --dataset teatros
    python manage.py seed_gcba --dry-run
    python manage.py seed_gcba --clear-gcba
"""
import logging
from django.core.management.base import BaseCommand
from apps.integrations.providers.gcba import gcba_provider, DATASETS
from apps.activities.models import Activity

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import activities from GCBA Open Data portal"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dataset",
            choices=list(DATASETS.keys()),
            help="Import only this dataset (default: all)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse records without persisting to DB",
        )
        parser.add_argument(
            "--clear-gcba",
            action="store_true",
            help="Delete existing GCBA activities before importing",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=500,
            help="Max records per dataset (default: 500)",
        )

    def handle(self, *args, **options):
        dataset_keys = [options["dataset"]] if options["dataset"] else list(DATASETS.keys())
        dry_run = options["dry_run"]
        limit = options["limit"]

        if options["clear_gcba"] and not dry_run:
            deleted, _ = Activity.objects.filter(source="gcba").delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing GCBA activities"))

        total_imported = 0
        total_updated = 0
        total_skipped = 0

        for key in dataset_keys:
            self.stdout.write(f"\n[gcba] Processing dataset: {key}")
            try:
                records = gcba_provider.fetch_and_parse(key, limit=limit)
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"  ERROR fetching {key}: {exc}"))
                continue

            if not records:
                self.stdout.write(self.style.WARNING(f"  No records returned for {key}"))
                continue

            imported = 0
            updated = 0
            skipped_coord = 0

            for rec in records:
                # Skip if no coordinates (can't place on map or verify location)
                if rec.get("latitude") is None:
                    skipped_coord += 1
                    continue

                if dry_run:
                    imported += 1
                    continue

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
                    logger.warning("[gcba] Failed to save %s: %s", rec.get("name"), exc)
                    skipped_coord += 1

            label = "(dry run) would import" if dry_run else "imported"
            self.stdout.write(
                f"  {key}: {label} {imported} new, {updated} updated, "
                f"{skipped_coord} skipped (no coords)"
            )
            total_imported += imported
            total_updated += updated
            total_skipped += skipped_coord

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Total: {total_imported} imported, "
                f"{total_updated} updated, {total_skipped} skipped"
            )
        )
