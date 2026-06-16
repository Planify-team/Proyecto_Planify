"""
Enrich activities with images from OpenTripMap.

Usage:
    python manage.py enrich_activities_opentripmap
    python manage.py enrich_activities_opentripmap --limit 50
    python manage.py enrich_activities_opentripmap --source gcba
"""
import logging
from django.core.management.base import BaseCommand
from apps.integrations.providers.opentripmap import opentripmap_provider
from apps.activities.models import Activity

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Enrich activities with images and descriptions from OpenTripMap"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=200,
            help="Max activities to enrich (respects 500 req/day limit)",
        )
        parser.add_argument(
            "--source",
            help="Only enrich activities from this source (e.g. 'gcba', 'manual')",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        source_filter = options.get("source")

        qs = Activity.objects.filter(
            image_url="",
            is_active=True,
            latitude__isnull=False,
        )
        if source_filter:
            qs = qs.filter(source=source_filter)

        activities = list(qs[:limit])
        total = len(activities)
        self.stdout.write(f"Processing {total} activities without images...")

        enriched_images = 0
        enriched_desc = 0
        skipped = 0

        for act in activities:
            had_image = bool(act.image_url)
            had_desc = bool(act.description)

            updated = opentripmap_provider.enrich_activity(act)

            if updated:
                if not had_image and act.image_url:
                    enriched_images += 1
                    self.stdout.write(f"  [ok] {act.name} → image found")
                if not had_desc and act.description:
                    enriched_desc += 1
            else:
                skipped += 1
                self.stdout.write(f"  [skip] {act.name} → no match")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {enriched_images} activities enriched with image, "
                f"{enriched_desc} with description, {skipped} skipped"
            )
        )
