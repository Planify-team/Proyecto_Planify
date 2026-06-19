import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model providing UUID pk, created_at, updated_at."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(TimeStampedModel):
    """Abstract model adding logical deletion support."""

    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])

