from datetime import date as date_type
from rest_framework import serializers
from .models import Plan, PlanItem, PlanFeedback


class PlanItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanItem
        fields = (
            "id", "entity_type", "entity_id", "slot", "order",
            "note", "generation_reason", "created_at",
        )
        read_only_fields = ("id", "created_at")


class PlanSerializer(serializers.ModelSerializer):
    items = PlanItemSerializer(many=True, read_only=True)

    class Meta:
        model = Plan
        fields = (
            "id", "title", "date", "budget", "people_count", "city",
            "slug", "is_public", "status", "items", "created_at", "updated_at",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")


class PlanGenerateSerializer(serializers.Serializer):
    date = serializers.DateField()
    budget = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    people_count = serializers.IntegerField(min_value=1, default=1)
    city = serializers.CharField(max_length=100)

    def validate_date(self, value):
        if value < date_type.today():
            raise serializers.ValidationError("La fecha del plan no puede ser en el pasado.")
        return value


class PlanItemCreateSerializer(serializers.Serializer):
    entity_type = serializers.ChoiceField(choices=["place", "activity", "event"])
    entity_id = serializers.UUIDField()
    slot = serializers.ChoiceField(choices=["morning", "afternoon", "evening"])
    note = serializers.CharField(allow_blank=True, default="", max_length=500)


class PlanUpdateSerializer(serializers.Serializer):
    is_public = serializers.BooleanField(required=False)
    status = serializers.ChoiceField(
        choices=["draft", "generated", "planned", "completed", "cancelled"],
        required=False,
    )
    title = serializers.CharField(max_length=200, required=False)


class PlanFeedbackSerializer(serializers.Serializer):
    entity_type = serializers.ChoiceField(choices=["place", "activity", "event"])
    entity_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, default="", max_length=1000)


class PlanFeedbackReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeedback
        fields = ("id", "entity_type", "entity_id", "rating", "comment", "created_at")
