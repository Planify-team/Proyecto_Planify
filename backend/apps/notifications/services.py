from rest_framework.exceptions import ValidationError

from .models import Notification, Reminder, NotificationStatus, NotificationType
from apps.audit.services import log_action


def create_notification(*, user, title: str, message: str, notification_type: str) -> Notification:
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        status=NotificationStatus.SENT,
    )


def create_reminder(*, user, event, reminder_date) -> Reminder:
    if Reminder.objects.filter(user=user, event=event).exists():
        raise ValidationError("Ya tenés un recordatorio para este evento.")
    reminder = Reminder.objects.create(user=user, event=event, reminder_date=reminder_date)
    log_action(user=user, action="reminder", entity_type="reminder", entity_id=str(reminder.id))

    from apps.recommendations.services import log_interaction
    log_interaction(user=user, action="create_reminder", entity_type="event", entity_id=str(event.id))

    create_notification(
        user=user,
        title=f"Recordatorio: {event.title}",
        message=f"Recordatorio programado para el {reminder_date.strftime('%d/%m/%Y %H:%M')}.",
        notification_type=NotificationType.EVENT_REMINDER,
    )
    return reminder


def delete_reminder(*, user, reminder: Reminder) -> None:
    if reminder.user != user:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("No podés eliminar el recordatorio de otro usuario.")
    reminder.delete()


def mark_notification_read(*, notification: Notification) -> Notification:
    notification.read = True
    notification.save(update_fields=["read"])
    return notification


def mark_all_notifications_read(*, user) -> int:
    return Notification.objects.filter(user=user, read=False).update(read=True)
