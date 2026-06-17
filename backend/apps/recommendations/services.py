import math
import logging
from datetime import date
from decimal import Decimal
from django.utils import timezone

from .models import Recommendation, InteractionHistory

logger = logging.getLogger(__name__)

# Spanish preference values → activity_type English key
PREF_TYPE_MAP: dict[str, str] = {
    "gaming":       "gaming",
    "cine":         "cinema",
    "deportes":     "sports",
    "música":       "concert",
    "musica":       "concert",
    "gastronomía":  "restaurant",
    "gastronomia":  "restaurant",
    "arte":         "museum",
    "turismo":      "tourism",
    "bienestar":    "park",
    "bar":          "bar",
    "shopping":     "shopping",
    "entretenimiento": "gaming",
}

# ── V1 base weights (sum = 100) ───────────────────────────────────────────────
WEIGHT_PREFERENCE  = 40
WEIGHT_CATEGORY    = 25
WEIGHT_POPULARITY  = 15
WEIGHT_PROXIMITY   = 10
WEIGHT_INTERACTION = 10

# ── Contextual modifiers (additive, score clamped [0, 100]) ──────────────────
MOD_BUDGET_MATCH   =  10
MOD_BUDGET_OVER    = -10
MOD_PEOPLE_INVALID = -20
MOD_AGE_BLOCKED    = -50
MOD_TIME_BONUS     =   5
MOD_DISTANCE = {2: 10, 5: 8, 10: 5, 20: 2}

# ── V2 interaction weights ────────────────────────────────────────────────────
INTERACTION_WEIGHTS = {
    "favorite":             0.25,
    "create_reminder":      0.20,
    "recommendation_click": 0.15,
    "view":                 0.05,
    "unfavorite":          -0.10,
}


# ── Core scoring helpers ──────────────────────────────────────────────────────

def _pref_boost(category: str, activity_type: str = "", pref_map: dict = None) -> float:
    if not pref_map:
        return 0
    cat = category.lower()
    atype = activity_type.lower() if activity_type else ""
    for key, weight in pref_map.items():
        k = key.lower()
        if k in cat or cat in k:
            return min(weight * (WEIGHT_PREFERENCE / 10), WEIGHT_PREFERENCE)
        if atype and (k in atype or atype in k):
            return min(weight * (WEIGHT_PREFERENCE / 10), WEIGHT_PREFERENCE)
        # Spanish pref value → activity_type mapping (e.g. "arte"→"museum")
        mapped = PREF_TYPE_MAP.get(k)
        if mapped and atype and (mapped == atype or mapped in atype):
            return min(weight * (WEIGHT_PREFERENCE / 10), WEIGHT_PREFERENCE)
    return 0


def _category_score(category: str, pref_map: dict) -> float:
    cat = category.lower()
    for key in pref_map:
        k = key.lower()
        if k in cat or cat in k:
            return WEIGHT_CATEGORY
        mapped = PREF_TYPE_MAP.get(k)
        if mapped and mapped in cat:
            return WEIGHT_CATEGORY
    return 0


def _popularity_score(score_base: int) -> float:
    return min((score_base / 100) * WEIGHT_POPULARITY, WEIGHT_POPULARITY)


def _interaction_score_v2(entity_id: str, interactions: list[tuple]) -> float:
    """V2: weighted by action type, returns score contribution 0-10."""
    total = 0.0
    for eid, action in interactions:
        if str(eid) == str(entity_id):
            total += INTERACTION_WEIGHTS.get(action, 0)
    return max(-WEIGHT_INTERACTION, min(WEIGHT_INTERACTION, total * WEIGHT_INTERACTION))


def _weather_modifier(is_outdoor: bool, is_indoor: bool, is_outdoor_friendly) -> float:
    if is_outdoor_friendly is None:
        return 0
    if not is_outdoor_friendly:
        if is_indoor:
            return 10
        if is_outdoor and not is_indoor:
            return -10
    else:
        if is_outdoor:
            return 8
    return 0


# ── Sprint 3 contextual modifiers ────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _distance_modifier(user_lat, user_lon, place_lat, place_lon) -> float:
    if any(x is None for x in [user_lat, user_lon, place_lat, place_lon]):
        return 0
    try:
        km = _haversine_km(user_lat, user_lon, float(place_lat), float(place_lon))
    except (TypeError, ValueError):
        return 0
    for threshold, bonus in sorted(MOD_DISTANCE.items()):
        if km <= threshold:
            return bonus
    return 0


def _budget_modifier(budget, min_cost) -> float:
    if budget is None or min_cost is None:
        return 0
    if min_cost <= budget:
        return MOD_BUDGET_MATCH
    if min_cost <= budget * 1.3:
        return 0
    return MOD_BUDGET_OVER


def _people_modifier(people, min_people: int, max_people) -> float:
    if people is None:
        return 0
    if people < min_people:
        return MOD_PEOPLE_INVALID
    if max_people is not None and people > max_people:
        return MOD_PEOPLE_INVALID
    return 0


def _age_modifier(user, minimum_age: int) -> float:
    if not minimum_age or minimum_age <= 0 or not user.birth_date:
        return 0
    today = date.today()
    age = today.year - user.birth_date.year - (
        (today.month, today.day) < (user.birth_date.month, user.birth_date.day)
    )
    return MOD_AGE_BLOCKED if age < minimum_age else 0


def _time_of_day_modifier(is_indoor: bool, is_outdoor: bool, category: str, activity_type: str = "") -> float:
    hour = timezone.localtime(timezone.now()).hour
    cat = category.lower()
    atype = activity_type.lower()
    MORNING_CATS = ("café", "cafe", "desayuno", "breakfast", "outdoor", "park", "parque")
    AFTERNOON_CATS = ("restaurant", "food", "gastronomía", "gastronomia", "museo", "museum", "cine", "cinema")
    EVENING_CATS = ("bar", "music", "gaming", "concierto", "concert", "entertainment", "entretenimiento", "deporte", "sport")
    if 6 <= hour < 12:
        if any(k in cat for k in MORNING_CATS) or is_outdoor:
            return MOD_TIME_BONUS
    elif 12 <= hour < 19:
        if any(k in cat for k in AFTERNOON_CATS) or any(k in atype for k in ("cinema", "museum")):
            return MOD_TIME_BONUS
    else:
        if any(k in cat for k in EVENING_CATS) or any(k in atype for k in ("gaming", "concert", "bar", "sports")):
            return MOD_TIME_BONUS
        if is_indoor:
            return 3
    return 0


def _day_of_week_modifier(is_outdoor: bool, category: str, activity_type: str = "") -> float:
    """V2: weekends favour outdoor/long activities, weekdays favour nearby/quick ones."""
    weekday = timezone.localtime(timezone.now()).weekday()  # 0=Mon, 6=Sun
    cat = category.lower()
    atype = activity_type.lower()
    is_weekend = weekday >= 5
    WEEKEND_CATS = ("parque", "park", "turismo", "museo", "excursión")
    WEEKEND_TYPES = ("sports", "gaming", "cinema", "concert", "tourism", "museum")
    WEEKDAY_CATS = ("café", "cafe", "bar", "restaurant", "gastronomía", "gastronomia")
    if is_weekend:
        if is_outdoor or any(k in cat for k in WEEKEND_CATS) or atype in WEEKEND_TYPES:
            return 5
    else:
        if any(k in cat for k in WEEKDAY_CATS) or atype in ("restaurant", "bar"):
            return 3
    return 0


def _feedback_score_from_cache(entity_id: str, entity_type: str, cache: dict) -> float:
    """V3: weighted score from pre-fetched PlanFeedback cache. Avoids N+1."""
    feedbacks = cache.get((entity_type, str(entity_id)), [])
    if not feedbacks:
        return 0
    total = 0.0
    for r in feedbacks:
        if r == 5:
            total += 25
        elif r >= 4:
            total += 12
        elif r == 3:
            total += 5
        elif r == 2:
            total -= 10
        else:
            total -= 25
    return max(-25, min(25, total / len(feedbacks)))


def _build_feedback_cache() -> dict:
    """Prefetch all PlanFeedback into a dict keyed by (entity_type, entity_id)."""
    from apps.planner.models import PlanFeedback
    cache: dict = {}
    for fb in PlanFeedback.objects.values("entity_type", "entity_id", "rating"):
        key = (fb["entity_type"], str(fb["entity_id"]))
        cache.setdefault(key, []).append(fb["rating"])
    return cache


def _build_reason_from_breakdown(breakdown: dict, pref_map: dict, weather_data: dict | None) -> str:
    parts = []
    if breakdown.get("preference", 0) >= 20:
        keys = list(pref_map.keys())
        pref_label = keys[0] if keys else "tus gustos"
        parts.append(f"coincide con tus preferencias de {pref_label}")
    if breakdown.get("distance", 0) >= 5:
        parts.append("está cerca de tu ubicación")
    if breakdown.get("weather", 0) > 0 and weather_data and weather_data.get("is_outdoor_friendly"):
        parts.append("perfecto para salir con el clima actual")
    elif breakdown.get("weather", 0) > 0 and weather_data and weather_data.get("is_outdoor_friendly") is False:
        parts.append("ideal para el clima de hoy")
    if breakdown.get("time_of_day", 0) >= MOD_TIME_BONUS:
        parts.append("ideal para este momento del día")
    if breakdown.get("day_of_week", 0) >= 5:
        parts.append("perfecto para el fin de semana")
    if not parts:
        parts.append("popular entre usuarios similares")
    return ", ".join(parts).capitalize() + "."


# ── Main recommendation engine ────────────────────────────────────────────────

def generate_recommendations_for_user(
    user,
    lat: float = None,
    lon: float = None,
    budget: float = None,
    people: int = None,
) -> list:
    from apps.activities.selectors import get_active_activities
    from apps.events.selectors import get_published_events
    from apps.places.selectors import get_active_places
    from apps.users.selectors import get_user_preferences
    from apps.integrations.providers.openweather import openweather_provider

    user_lat = lat if lat is not None else (float(user.latitude) if user.latitude else None)
    user_lon = lon if lon is not None else (float(user.longitude) if user.longitude else None)

    prefs = list(get_user_preferences(user))
    pref_map = {
        (p.value.lower() if p.value else p.category.lower()): p.weight
        for p in prefs
    }

    weather = None
    if user_lat is not None and user_lon is not None:
        weather = openweather_provider.get_current_weather(user_lat, user_lon)
    is_outdoor_friendly = weather.get("is_outdoor_friendly") if weather else None

    interactions = list(
        InteractionHistory.objects.filter(user=user).values_list("entity_id", "action")
    )
    feedback_cache = _build_feedback_cache()

    pending = []

    # ── Activities ────────────────────────────────────────────────────────────
    for activity in get_active_activities():
        # Prefer the activity's own coordinates; fall back to linked Place
        act_lat = float(activity.latitude) if activity.latitude else None
        act_lon = float(activity.longitude) if activity.longitude else None
        if act_lat is None and activity.place_id:
            place = activity.place
            act_lat = float(place.latitude) if place and place.latitude else None
            act_lon = float(place.longitude) if place and place.longitude else None

        min_cost = float(activity.min_budget) if activity.min_budget else None

        pref_s       = _pref_boost(activity.category, activity.activity_type, pref_map)
        cat_s        = _category_score(activity.category, pref_map)
        pop_s        = _popularity_score(activity.score_base)
        inter_s      = _interaction_score_v2(activity.id, interactions)
        weather_s    = _weather_modifier(activity.outdoor, activity.indoor, is_outdoor_friendly)
        dist_s       = _distance_modifier(user_lat, user_lon, act_lat, act_lon)
        budget_s     = _budget_modifier(budget, min_cost)
        people_s     = _people_modifier(people, activity.min_people, activity.max_people)
        time_s       = _time_of_day_modifier(activity.indoor, activity.outdoor, activity.category, activity.activity_type)
        day_s        = _day_of_week_modifier(activity.outdoor, activity.category, activity.activity_type)
        feedback_s   = _feedback_score_from_cache(str(activity.id), "activity", feedback_cache)

        breakdown = {
            "preference": round(pref_s + cat_s, 2),
            "popularity": round(pop_s, 2),
            "interaction": round(inter_s, 2),
            "weather": round(weather_s, 2),
            "distance": round(dist_s, 2),
            "budget": round(budget_s, 2),
            "time_of_day": round(time_s, 2),
            "day_of_week": round(day_s, 2),
            "feedback_bonus": round(max(0, feedback_s), 2),
            "feedback_penalty": round(min(0, feedback_s), 2),
        }
        score = max(0, min(100,
            pref_s + cat_s + pop_s + inter_s + weather_s
            + dist_s + budget_s + people_s + time_s + day_s + feedback_s
        ))
        reason = _build_reason_from_breakdown(breakdown, pref_map, weather)
        pending.append(Recommendation(
            user=user, activity=activity,
            score=Decimal(str(round(score, 2))),
            recommendation_reason=reason,
            score_breakdown=breakdown,
        ))

    # ── Events ────────────────────────────────────────────────────────────────
    now = timezone.now()
    for event in get_published_events():
        place_lat = event.place.latitude if event.place_id else None
        place_lon = event.place.longitude if event.place_id else None
        distance_km = None
        if user_lat and place_lat:
            try:
                distance_km = _haversine_km(user_lat, user_lon, float(place_lat), float(place_lon))
            except Exception:
                pass

        days_away = max(0, (event.start_date - now).days) if event.start_date > now else 99
        proximity_bonus = WEIGHT_PROXIMITY if 0 <= days_away <= 7 else 0
        event_cost = float(event.price) if event.price else 0

        pref_s     = _pref_boost(event.category, "", pref_map)
        cat_s      = _category_score(event.category, pref_map)
        pop_s      = _popularity_score(60)
        inter_s    = _interaction_score_v2(event.id, interactions)
        dist_s     = _distance_modifier(user_lat, user_lon, place_lat, place_lon)
        budget_s   = _budget_modifier(budget, event_cost)
        age_s      = _age_modifier(user, event.minimum_age)
        time_s     = _time_of_day_modifier(is_indoor=True, is_outdoor=False, category=event.category, activity_type="")
        day_s      = _day_of_week_modifier(is_outdoor=False, category=event.category, activity_type="")
        feedback_s = _feedback_score_from_cache(str(event.id), "event", feedback_cache)

        breakdown = {
            "preference": round(pref_s + cat_s, 2),
            "popularity": round(pop_s + proximity_bonus, 2),
            "interaction": round(inter_s, 2),
            "weather": 0,
            "distance": round(dist_s, 2),
            "budget": round(budget_s, 2),
            "time_of_day": round(time_s, 2),
            "day_of_week": round(day_s, 2),
            "feedback_bonus": round(max(0, feedback_s), 2),
            "feedback_penalty": round(min(0, feedback_s), 2),
        }
        score = max(0, min(100,
            pref_s + cat_s + pop_s + proximity_bonus + inter_s
            + dist_s + budget_s + age_s + time_s + day_s + feedback_s
        ))
        reason = _build_reason_from_breakdown(breakdown, pref_map, None)
        pending.append(Recommendation(
            user=user, event=event,
            score=Decimal(str(round(score, 2))),
            recommendation_reason=reason,
            score_breakdown=breakdown,
        ))

    # ── Places ────────────────────────────────────────────────────────────────
    for place in get_active_places():
        distance_km = None
        if user_lat and place.latitude:
            try:
                distance_km = _haversine_km(user_lat, user_lon, float(place.latitude), float(place.longitude))
            except Exception:
                pass

        pref_s     = _pref_boost(place.category, "", pref_map)
        cat_s      = _category_score(place.category, pref_map)
        pop_s      = _popularity_score(50)
        inter_s    = _interaction_score_v2(place.id, interactions)
        dist_s     = _distance_modifier(user_lat, user_lon, place.latitude, place.longitude)
        time_s     = _time_of_day_modifier(is_indoor=True, is_outdoor=False, category=place.category, activity_type="")
        day_s      = _day_of_week_modifier(is_outdoor=False, category=place.category, activity_type="")
        feedback_s = _feedback_score_from_cache(str(place.id), "place", feedback_cache)
        place_cost = float(place.price_level or 0) * 500
        budget_s   = _budget_modifier(budget, place_cost) if place_cost > 0 else 0

        breakdown = {
            "preference": round(pref_s + cat_s, 2),
            "popularity": round(pop_s, 2),
            "interaction": round(inter_s, 2),
            "weather": 0,
            "distance": round(dist_s, 2),
            "budget": round(budget_s, 2),
            "time_of_day": round(time_s, 2),
            "day_of_week": round(day_s, 2),
            "feedback_bonus": round(max(0, feedback_s), 2),
            "feedback_penalty": round(min(0, feedback_s), 2),
        }
        score = max(0, min(100,
            pref_s + cat_s + pop_s + inter_s + dist_s + budget_s + time_s + day_s + feedback_s
        ))
        reason = _build_reason_from_breakdown(breakdown, pref_map, None)
        pending.append(Recommendation(
            user=user, place=place,
            score=Decimal(str(round(score, 2))),
            recommendation_reason=reason,
            score_breakdown=breakdown,
        ))

    Recommendation.objects.filter(user=user).delete()
    pending.sort(key=lambda r: r.score, reverse=True)
    Recommendation.objects.bulk_create(pending[:20])

    from apps.audit.services import log_action
    log_action(
        user=user,
        action="recommendation_generated",
        entity_type="recommendation",
        entity_id=str(user.id),
        metadata={"count": min(len(pending), 20)},
    )

    return list(
        Recommendation.objects
        .filter(user=user)
        .select_related("activity", "event", "place", "event__place", "activity__place")
        .order_by("-score")[:20]
    )


def log_interaction(*, user, action: str, entity_type: str, entity_id: str) -> InteractionHistory:
    return InteractionHistory.objects.create(
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    )
