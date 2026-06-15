import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="apps.planner.tasks.plan_reminder_job")
def plan_reminder_job():
    """
    Runs hourly. Sends notifications for plans happening today or tomorrow.
    Avoids duplicate notifications using a simple flag on the plan.
    """
    from apps.planner.models import Plan
    from apps.notifications.models import Notification, NotificationType

    today = timezone.now().date()
    tomorrow = today + timezone.timedelta(days=1)

    # Day-of notification
    day_of_plans = Plan.objects.filter(
        date=today,
        status__in=("generated", "planned"),
    ).select_related("user")

    for plan in day_of_plans:
        already_sent = Notification.objects.filter(
            user=plan.user,
            notification_type=NotificationType.SYSTEM,
            title__contains=str(plan.id),
            message__startswith="Hoy tenés",
        ).exists()
        if not already_sent:
            Notification.objects.create(
                user=plan.user,
                title=f"Plan de hoy [{plan.id}]",
                message=f"Hoy tenés un plan programado: {plan.title}",
                notification_type=NotificationType.SYSTEM,
            )
            logger.info("Day-of reminder sent for plan %s", plan.id)

    # Day-before notification
    tomorrow_plans = Plan.objects.filter(
        date=tomorrow,
        status__in=("generated", "planned"),
    ).select_related("user")

    for plan in tomorrow_plans:
        already_sent = Notification.objects.filter(
            user=plan.user,
            notification_type=NotificationType.SYSTEM,
            title__contains=str(plan.id),
            message__startswith="Tu plan para mañana",
        ).exists()
        if not already_sent:
            Notification.objects.create(
                user=plan.user,
                title=f"Plan de mañana [{plan.id}]",
                message=f"Tu plan para mañana está listo: {plan.title}",
                notification_type=NotificationType.SYSTEM,
            )
            logger.info("Day-before reminder sent for plan %s", plan.id)

    return {
        "day_of": day_of_plans.count(),
        "day_before": tomorrow_plans.count(),
    }


@shared_task(name="apps.planner.tasks.plan_completion_job")
def plan_completion_job():
    """
    Runs hourly. Marks plans whose date has passed as 'completed'.
    Also registers plan_completed in InteractionHistory to feed Recommendation Engine V3.
    """
    from apps.planner.models import Plan
    from apps.recommendations.services import log_interaction

    yesterday = timezone.now().date() - timezone.timedelta(days=1)

    expired_plans = Plan.objects.filter(
        date__lte=yesterday,
        status__in=("generated", "planned"),
    ).select_related("user")

    count = 0
    for plan in expired_plans:
        plan.status = "completed"
        plan.save(update_fields=["status", "updated_at"])
        log_interaction(
            user=plan.user,
            action="plan_completed",
            entity_type="plan",
            entity_id=str(plan.id),
        )
        count += 1
        logger.info("Plan %s marked as completed", plan.id)

    return {"completed": count}
