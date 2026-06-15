from .models import Plan, PlanItem


def get_plans_for_user(user):
    return Plan.objects.filter(user=user).prefetch_related("items")


def get_plan_by_id(plan_id, user=None):
    try:
        qs = Plan.objects.prefetch_related("items")
        if user is not None:
            return qs.get(id=plan_id, user=user)
        return qs.get(id=plan_id)
    except (Plan.DoesNotExist, ValueError):
        return None


def get_plan_by_slug(slug: str):
    try:
        return Plan.objects.prefetch_related("items").get(slug=slug, is_public=True)
    except Plan.DoesNotExist:
        return None
