from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import Event, EventStatus
from apps.audit.services import log_action


def update_event(*, user, event: Event, **kwargs) -> Event:
    changed = list(kwargs.keys())
    for field, value in kwargs.items():
        setattr(event, field, value)
    if changed:
        event.save(update_fields=[*changed, "updated_at"])
    log_action(user=user, action="update", entity_type="event", entity_id=str(event.id))
    return event


def create_event(*, user, **kwargs) -> Event:
    event = Event.objects.create(organizer=user, **kwargs)
    log_action(user=user, action="create", entity_type="event", entity_id=str(event.id))
    return event


def publish_event(*, user, event: Event) -> Event:
    if not event.can_publish():
        raise ValidationError({"status": f"No se puede publicar un evento en estado '{event.status}'."})
    if not (user.role in ("admin", "moderator") or event.organizer == user):
        raise PermissionDenied("No tenés permiso para publicar este evento.")
    event.status = EventStatus.PUBLISHED
    event.save(update_fields=["status", "updated_at"])
    log_action(user=user, action="publish", entity_type="event", entity_id=str(event.id))
    return event


def cancel_event(*, user, event: Event, reason: str = "") -> Event:
    if not event.can_cancel():
        raise ValidationError({"status": f"No se puede cancelar un evento en estado '{event.status}'."})
    if not (user.role in ("admin", "moderator") or event.organizer == user):
        raise PermissionDenied("No tenés permiso para cancelar este evento.")
    event.status = EventStatus.CANCELLED
    event.cancellation_reason = reason
    event.save(update_fields=["status", "cancellation_reason", "updated_at"])
    log_action(
        user=user,
        action="cancel",
        entity_type="event",
        entity_id=str(event.id),
        metadata={"reason": reason},
    )
    return event
