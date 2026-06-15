from django.db.models import Avg, Count, OuterRef, Subquery
from .models import Activity


def _rating_subquery(entity_type: str, field: str):
    from apps.reviews.models import Review
    base = Review.objects.filter(entity_type=entity_type, entity_id=OuterRef("id")).values("entity_id")
    if field == "avg":
        return base.annotate(v=Avg("stars")).values("v")[:1]
    return base.annotate(v=Count("id")).values("v")[:1]


def get_active_activities(activity_type=None, indoor=None, outdoor=None, budget=None, category=None, free=None, name=None):
    qs = Activity.objects.filter(is_active=True).select_related("place")
    if name:
        qs = qs.filter(name__icontains=name)
    if activity_type:
        qs = qs.filter(activity_type=activity_type)
    if category:
        qs = qs.filter(category__icontains=category)
    if indoor is not None:
        val = str(indoor).lower() in ("true", "1")
        qs = qs.filter(indoor=val)
    if outdoor is not None:
        val = str(outdoor).lower() in ("true", "1")
        qs = qs.filter(outdoor=val)
    if budget is not None:
        try:
            qs = qs.filter(min_budget__lte=float(budget))
        except (ValueError, TypeError):
            pass
    if free:
        qs = qs.filter(min_budget=0)
    qs = qs.annotate(
        avg_rating=Subquery(_rating_subquery("activity", "avg")),
        review_count=Subquery(_rating_subquery("activity", "count")),
    )
    return qs.order_by("-score_base")


def get_activity_by_id(activity_id):
    from apps.reviews.models import Review
    avg_sub = (
        Review.objects.filter(entity_type="activity", entity_id=OuterRef("id"))
        .values("entity_id").annotate(a=Avg("stars")).values("a")[:1]
    )
    cnt_sub = (
        Review.objects.filter(entity_type="activity", entity_id=OuterRef("id"))
        .values("entity_id").annotate(c=Count("id")).values("c")[:1]
    )
    try:
        return (
            Activity.objects.select_related("place")
            .annotate(avg_rating=Subquery(avg_sub), review_count=Subquery(cnt_sub))
            .get(id=activity_id, is_active=True)
        )
    except Activity.DoesNotExist:
        return None
