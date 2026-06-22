import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Favorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, null=True, blank=True)
    place = models.ForeignKey("places.Place", on_delete=models.CASCADE, null=True, blank=True)
    activity = models.ForeignKey("activities.Activity", on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        indexes = [models.Index(fields=["user", "-created_at"])]

    def clean(self):
        refs = [self.event_id, self.place_id, self.activity_id]
        filled = [r for r in refs if r is not None]
        if len(filled) != 1:
            raise ValidationError("Un favorito debe referenciar exactamente uno de: evento, lugar o actividad.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} — favorite"
