from .models import Place
from apps.audit.services import log_action


def create_place(*, user, **kwargs) -> Place:
    place = Place.objects.create(owner=user, **kwargs)
    log_action(user=user, action="create", entity_type="place", entity_id=str(place.id))
    return place


def update_place(*, user, place: Place, **kwargs) -> Place:
    for field, value in kwargs.items():
        setattr(place, field, value)
    place.save()
    log_action(user=user, action="update", entity_type="place", entity_id=str(place.id))
    return place


def deactivate_place(*, user, place: Place) -> None:
    place.soft_delete()
    log_action(user=user, action="deactivate", entity_type="place", entity_id=str(place.id))
