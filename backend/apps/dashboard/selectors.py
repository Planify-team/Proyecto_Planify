def get_business_stats(user):
    from apps.places.models import Place
    from apps.promotions.models import Promotion, PromotionStatus
    from apps.reviews.models import Review

    owned_place_ids = list(
        Place.objects.filter(owner=user).values_list("id", flat=True)
    )
    total_places = len(owned_place_ids)
    total_promotions = Promotion.objects.filter(owner=user).count()
    active_promotions = Promotion.objects.filter(owner=user, status=PromotionStatus.ACTIVE).count()

    reviews_qs = Review.objects.filter(entity_type="place", entity_id__in=[str(i) for i in owned_place_ids])
    total_reviews = reviews_qs.count()
    avg = None
    if total_reviews:
        from django.db.models import Avg
        avg = reviews_qs.aggregate(a=Avg("stars"))["a"]
        avg = round(float(avg), 1) if avg is not None else None

    return {
        "total_places": total_places,
        "total_promotions": total_promotions,
        "active_promotions": active_promotions,
        "total_reviews": total_reviews,
        "avg_rating": avg,
    }


def get_owned_places(user):
    from apps.places.models import Place
    return Place.objects.filter(owner=user).order_by("name")


def get_owned_promotions(user):
    from apps.promotions.models import Promotion
    return Promotion.objects.filter(owner=user).order_by("-start_date")


def get_organizer_stats(user):
    from apps.events.models import Event, EventStatus
    from apps.reviews.models import Review

    total_events = Event.objects.filter(organizer=user).count()
    published_events = Event.objects.filter(organizer=user, status=EventStatus.PUBLISHED).count()

    owned_event_ids = list(Event.objects.filter(organizer=user).values_list("id", flat=True))
    reviews_qs = Review.objects.filter(entity_type="event", entity_id__in=[str(i) for i in owned_event_ids])
    total_reviews = reviews_qs.count()
    avg = None
    if total_reviews:
        from django.db.models import Avg
        avg = reviews_qs.aggregate(a=Avg("stars"))["a"]
        avg = round(float(avg), 1) if avg is not None else None

    return {
        "total_events": total_events,
        "published_events": published_events,
        "total_reviews": total_reviews,
        "avg_rating": avg,
    }


def get_owned_events(user):
    from apps.events.models import Event
    return Event.objects.filter(organizer=user).order_by("-start_date")


def get_user_activity_stats(user):
    from django.db.models import Avg
    from django.utils import timezone
    from apps.planner.models import Plan, PlanItem, PlanFeedback

    completed_plans = list(Plan.objects.filter(user=user, status="completed"))
    total_plans = Plan.objects.filter(user=user).count()
    plans_completed = len(completed_plans)

    completed_ids = [p.id for p in completed_plans]

    # Unique places from completed plans
    places_visited = PlanItem.objects.filter(
        plan_id__in=completed_ids, entity_type="place"
    ).values("entity_id").distinct().count()

    # Unique cities from completed plans
    cities_explored = Plan.objects.filter(
        id__in=completed_ids
    ).values("city").distinct().count()

    # favorite_category: most common category in entities of completed plan items
    # Simplified: look at activities since they have categories; fallback to entity_type
    from apps.activities.models import Activity
    from apps.places.models import Place
    from apps.events.models import Event as EventModel
    from collections import Counter

    category_counter: Counter = Counter()
    items = list(PlanItem.objects.filter(plan_id__in=completed_ids))
    act_ids = [str(i.entity_id) for i in items if i.entity_type == "activity"]
    place_ids = [str(i.entity_id) for i in items if i.entity_type == "place"]
    event_ids = [str(i.entity_id) for i in items if i.entity_type == "event"]

    for act in Activity.objects.filter(id__in=act_ids):
        category_counter[act.category] += 1
    for pl in Place.objects.filter(id__in=place_ids):
        category_counter[pl.category] += 1
    for ev in EventModel.objects.filter(id__in=event_ids):
        category_counter[ev.category] += 1

    favorite_category = category_counter.most_common(1)[0][0] if category_counter else None

    # Streak: consecutive weeks with at least 1 completed plan
    import datetime
    completed_dates = [p.date for p in completed_plans]

    def to_iso_week(d):
        iso = d.isocalendar()
        return (iso[0], iso[1])

    completed_weeks = set(to_iso_week(d) for d in completed_dates)

    current_streak = 0
    check_date = timezone.now().date()
    for _ in range(104):
        if to_iso_week(check_date) in completed_weeks:
            current_streak += 1
        else:
            break
        check_date -= datetime.timedelta(weeks=1)

    best_streak = 0
    temp_streak = 0
    prev_yw = None
    for yw in sorted(completed_weeks, reverse=True):
        if prev_yw is None:
            temp_streak = 1
        else:
            prev_d = datetime.date.fromisocalendar(prev_yw[0], prev_yw[1], 1)
            curr_d = datetime.date.fromisocalendar(yw[0], yw[1], 1)
            if (prev_d - curr_d).days == 7:
                temp_streak += 1
            else:
                best_streak = max(best_streak, temp_streak)
                temp_streak = 1
        prev_yw = yw
    best_streak = max(best_streak, temp_streak)

    # avg rating given
    avg_obj = PlanFeedback.objects.filter(user=user).aggregate(avg=Avg("rating"))
    avg_rating_given = round(float(avg_obj["avg"]), 2) if avg_obj["avg"] is not None else None

    return {
        "plans_completed": plans_completed,
        "places_visited": places_visited,
        "cities_explored": cities_explored,
        "favorite_category": favorite_category,
        "current_streak_weeks": current_streak,
        "best_streak_weeks": best_streak,
        "total_plans": total_plans,
        "avg_rating_given": avg_rating_given,
    }
