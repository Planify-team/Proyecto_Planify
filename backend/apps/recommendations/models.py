import uuid
from django.db import models
from django.conf import settings


class Recommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recommendations")
    activity = models.ForeignKey("activities.Activity", on_delete=models.CASCADE, null=True, blank=True)
    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, null=True, blank=True)
    place = models.ForeignKey("places.Place", on_delete=models.CASCADE, null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    recommendation_reason = models.TextField(blank=True, default="")
    score_breakdown = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recommendations"
        ordering = ["-score", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-score"]),
        ]

    def __str__(self):
        return f"{self.user.email} — score {self.score}"


class InteractionHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interactions")
    action = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=100)
    entity_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "interaction_history"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["entity_type", "entity_id", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.action} on {self.entity_type}"
