import uuid
from django.db import models
from django.conf import settings


PLAN_STATUS_CHOICES = [
    ("draft", "Borrador"),
    ("generated", "Generado"),
    ("planned", "Planificado"),
    ("completed", "Completado"),
    ("cancelled", "Cancelado"),
]

ENTITY_CHOICES = [
    ("place", "Lugar"),
    ("activity", "Actividad"),
    ("event", "Evento"),
]

SLOT_CHOICES = [
    ("morning", "Mañana"),
    ("afternoon", "Tarde"),
    ("evening", "Noche"),
]


class Plan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plans",
    )
    title = models.CharField(max_length=200)
    date = models.DateField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    people_count = models.PositiveSmallIntegerField(default=1)
    city = models.CharField(max_length=100)
    slug = models.CharField(max_length=120, unique=True)
    is_public = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plans"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.date})"


class PlanItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="items")
    entity_type = models.CharField(max_length=20, choices=ENTITY_CHOICES)
    entity_id = models.UUIDField()
    slot = models.CharField(max_length=20, choices=SLOT_CHOICES)
    order = models.PositiveSmallIntegerField(default=0)
    note = models.TextField(blank=True, default="")
    generation_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "plan_items"
        ordering = ["slot", "order"]

    def __str__(self):
        return f"{self.plan.title} — {self.slot} #{self.order}"


class PlanFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="feedback")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plan_feedbacks",
    )
    entity_type = models.CharField(max_length=20, choices=ENTITY_CHOICES)
    entity_id = models.UUIDField()
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "plan_feedback"
        ordering = ["-created_at"]
        unique_together = ("plan", "user", "entity_type", "entity_id")

    def __str__(self):
        return f"{self.user.email} — {self.entity_type} rating {self.rating}"
