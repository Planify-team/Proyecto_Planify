from django.db.models import Avg, Count, OuterRef, Subquery


def annotate_ratings(qs, entity_type: str):
    """Annotate a queryset with avg_rating and review_count from the reviews table."""
    from apps.reviews.models import Review
    base = Review.objects.filter(entity_type=entity_type, entity_id=OuterRef("id")).values("entity_id")
    avg_sub = base.annotate(v=Avg("stars")).values("v")[:1]
    cnt_sub = base.annotate(v=Count("id")).values("v")[:1]
    return qs.annotate(avg_rating=Subquery(avg_sub), review_count=Subquery(cnt_sub))
