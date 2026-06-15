import uuid
import logging
from datetime import date as date_type
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify

from .models import Plan, PlanItem
from apps.audit.services import log_action

logger = logging.getLogger(__name__)

SLOT_KEYWORDS = {
    "morning": ["café", "cafe", "desayuno", "breakfast", "park", "parque", "outdoor", "brunch", "coffee"],
    "afternoon": ["restaurant", "museo", "museum", "tour", "arte", "art", "gastronomía", "food", "cultural"],
    "evening": ["bar", "music", "gaming", "concierto", "concert", "entertainment", "nightlife", "show", "teatro"],
}


def _slot_bonus(slot: str, category: str, activity_type: str = "") -> float:
    keywords = SLOT_KEYWORDS.get(slot, [])
    text = (category + " " + activity_type).lower()
    for kw in keywords:
        if kw in text:
            return 15
    return 0


def _generate_slug(plan_date: date_type, user_id) -> str:
    base = slugify(f"plan-{plan_date.strftime('%Y-%m-%d')}-{str(user_id)[:8]}")
    suffix = str(uuid.uuid4())[:8]
    return f"{base}-{suffix}"


def _build_item_reason(breakdown: dict, pref_map: dict, is_outdoor_friendly) -> str:
    from apps.recommendations.services import _build_reason_from_breakdown
    weather_data = {"is_outdoor_friendly": is_outdoor_friendly} if is_outdoor_friendly is not None else None
    return _build_reason_from_breakdown(breakdown, pref_map, weather_data)


def generate_plan(user, plan_date: date_type, budget: Decimal, people_count: int, city: str) -> Plan:
    """
    Generate a 3-slot itinerary plan for the given date.
    Weather rule: ≤5 days from today → real OpenWeather; >5 days → neutral (is_outdoor_friendly=None).
    """
    from apps.activities.models import Activity
    from apps.places.models import Place
    from apps.events.models import Event, EventStatus
    from apps.users.selectors import get_user_preferences
    from apps.recommendations.models import InteractionHistory
    from apps.recommendations.services import (
        _pref_boost,
        _popularity_score,
        _interaction_score_v2,
        _weather_modifier,
        _budget_modifier,
        _people_modifier,
    )
    from apps.integrations.providers.openweather import openweather_provider

    today = timezone.now().date()
    delta_days = (plan_date - today).days

    # Weather rule: ≤5 days → real API, >5 days → neutral
    is_outdoor_friendly = None
    if delta_days <= 5 and user.latitude and user.longitude:
        try:
            weather = openweather_provider.get_current_weather(
                float(user.latitude), float(user.longitude)
            )
            if weather:
                is_outdoor_friendly = weather.get("is_outdoor_friendly")
        except Exception as exc:
            logger.warning("Weather fetch failed for planner: %s", exc)

    prefs = list(get_user_preferences(user))
    pref_map = {
        (p.value.lower() if p.value else p.category.lower()): p.weight
        for p in prefs
    }
    interactions = list(
        InteractionHistory.objects.filter(user=user).values_list("entity_id", "action")
    )

    budget_per_slot = float(budget) / 3
    all_candidates = []

    # Activities
    activity_qs = Activity.objects.filter(
        is_active=True,
        min_budget__lte=budget_per_slot,
        min_people__lte=people_count,
    ).select_related("place")
    if city:
        activity_qs = activity_qs.filter(place__city__icontains=city)

    for act in activity_qs[:30]:
        pref_s = _pref_boost(act.category, act.activity_type, pref_map)
        pop_s = _popularity_score(act.score_base)
        inter_s = _interaction_score_v2(act.id, interactions)
        weather_s = _weather_modifier(act.outdoor, act.indoor, is_outdoor_friendly)
        budget_s = _budget_modifier(budget_per_slot, float(act.min_budget))
        people_s = _people_modifier(people_count, act.min_people, act.max_people)

        breakdown = {
            "preference": pref_s, "popularity": pop_s, "interaction": inter_s,
            "weather": weather_s, "budget": budget_s, "people": people_s,
        }
        base_score = max(0, min(100, sum(breakdown.values())))

        all_candidates.append({
            "base_score": base_score,
            "breakdown": breakdown,
            "entity_type": "activity",
            "entity_id": act.id,
            "name": act.name,
            "category": act.category,
            "activity_type": act.activity_type,
        })

    # Places
    place_qs = Place.objects.filter(is_active=True)
    if city:
        place_qs = place_qs.filter(city__icontains=city)

    for place in place_qs[:20]:
        pref_s = _pref_boost(place.category, "", pref_map)
        pop_s = max(0, 15 - place.price_level * 2)
        inter_s = _interaction_score_v2(place.id, interactions)

        breakdown = {
            "preference": pref_s, "popularity": pop_s, "interaction": inter_s,
            "weather": 0, "budget": 0, "people": 0,
        }
        base_score = max(0, min(100, sum(breakdown.values())))

        all_candidates.append({
            "base_score": base_score,
            "breakdown": breakdown,
            "entity_type": "place",
            "entity_id": place.id,
            "name": place.name,
            "category": place.category,
            "activity_type": "",
        })

    # Events on plan date
    event_qs = Event.objects.filter(
        status=EventStatus.PUBLISHED,
        price__lte=budget_per_slot,
        start_date__date=plan_date,
    )
    if city:
        event_qs = event_qs.filter(place__city__icontains=city)

    for event in event_qs[:15]:
        pref_s = _pref_boost(event.category, "", pref_map)
        inter_s = _interaction_score_v2(event.id, interactions)

        breakdown = {
            "preference": pref_s, "popularity": 20, "interaction": inter_s,
            "weather": 0, "budget": 10, "people": 0,
        }
        base_score = max(0, min(100, sum(breakdown.values())))

        all_candidates.append({
            "base_score": base_score,
            "breakdown": breakdown,
            "entity_type": "event",
            "entity_id": event.id,
            "name": event.title,
            "category": event.category,
            "activity_type": "",
        })

    # Pick top-1 per slot without repeating entities
    used_ids: set = set()
    slot_results: dict = {}

    for slot in ("morning", "afternoon", "evening"):
        scored = []
        for c in all_candidates:
            if c["entity_id"] in used_ids:
                continue
            total = c["base_score"] + _slot_bonus(slot, c["category"], c.get("activity_type", ""))
            scored.append((min(100, total), c))

        scored.sort(key=lambda x: x[0], reverse=True)

        if scored:
            _, best = scored[0]
            used_ids.add(best["entity_id"])
            reason = _build_item_reason(best["breakdown"], pref_map, is_outdoor_friendly)
            slot_results[slot] = {
                "entity_type": best["entity_type"],
                "entity_id": best["entity_id"],
                "reason": reason,
            }

    title = f"Plan para {plan_date.strftime('%d/%m/%Y')}"
    slug = _generate_slug(plan_date, user.id)

    plan = Plan.objects.create(
        user=user,
        title=title,
        date=plan_date,
        budget=budget,
        people_count=people_count,
        city=city,
        slug=slug,
        is_public=False,
        status="generated",
    )

    for order, slot in enumerate(("morning", "afternoon", "evening")):
        if slot in slot_results:
            item_data = slot_results[slot]
            PlanItem.objects.create(
                plan=plan,
                entity_type=item_data["entity_type"],
                entity_id=item_data["entity_id"],
                slot=slot,
                order=order,
                generation_reason=item_data["reason"],
            )

    log_action(
        user=user,
        action="create_plan",
        entity_type="plan",
        entity_id=str(plan.id),
        metadata={"title": title, "date": str(plan_date), "city": city},
    )

    return plan


def create_empty_plan(user, plan_date, budget, people_count: int, city: str) -> Plan:
    slug = _generate_slug(plan_date, user.id)
    plan = Plan.objects.create(
        user=user,
        title=f"Plan para {plan_date.strftime('%d/%m/%Y')}",
        date=plan_date,
        budget=budget,
        people_count=people_count,
        city=city,
        slug=slug,
        status="draft",
    )
    log_action(
        user=user,
        action="create_plan",
        entity_type="plan",
        entity_id=str(plan.id),
        metadata={"title": plan.title, "date": str(plan_date), "city": city, "mode": "empty"},
    )
    return plan


def add_item(plan: Plan, entity_type: str, entity_id: str, slot: str, note: str = "") -> PlanItem:
    from rest_framework.exceptions import ValidationError as DRFValidationError
    from apps.places.models import Place
    from apps.activities.models import Activity
    from apps.events.models import Event

    model_map = {"place": Place, "activity": Activity, "event": Event}
    model = model_map.get(entity_type)
    if model is None or not model.objects.filter(id=entity_id).exists():
        raise DRFValidationError({"entity_id": f"No existe ningún {entity_type} con id {entity_id}."})

    order = PlanItem.objects.filter(plan=plan, slot=slot).count()
    return PlanItem.objects.create(
        plan=plan,
        entity_type=entity_type,
        entity_id=entity_id,
        slot=slot,
        order=order,
        note=note,
    )


def remove_item(item: PlanItem) -> None:
    item.delete()


def delete_plan(plan: Plan, user) -> None:
    log_action(
        user=user,
        action="delete_plan",
        entity_type="plan",
        entity_id=str(plan.id),
        metadata={"title": plan.title},
    )
    plan.delete()
