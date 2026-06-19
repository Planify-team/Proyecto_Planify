from datetime import date as date_type
from rest_framework import serializers
from .models import Plan, PlanItem, PlanFeedback


class PlanItemSerializer(serializers.ModelSerializer):
    entity_name = serializers.SerializerMethodField()
    entity_description = serializers.SerializerMethodField()
    entity_category = serializers.SerializerMethodField()

    class Meta:
        model = PlanItem
        fields = (
            "id", "entity_type", "entity_id", "entity_name",
            "entity_description", "entity_category",
            "slot", "order", "note", "generation_reason", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def _resolve_entity(self, obj):
        cache = getattr(self, "_entity_cache", {})
        key = f"{obj.entity_type}:{obj.entity_id}"
        if key in cache:
            return cache[key]
        try:
            if obj.entity_type == "place":
                from apps.places.models import Place
                entity = Place.objects.get(id=obj.entity_id)
            elif obj.entity_type == "activity":
                from apps.activities.models import Activity
                entity = Activity.objects.get(id=obj.entity_id)
            elif obj.entity_type == "event":
                from apps.events.models import Event
                entity = Event.objects.get(id=obj.entity_id)
            else:
                entity = None
        except Exception:
            entity = None
        if not hasattr(self, "_entity_cache"):
            self._entity_cache = {}
        self._entity_cache[key] = entity
        return entity

    def get_entity_name(self, obj) -> str:
        entity = self._resolve_entity(obj)
        if entity is None:
            return ""
        return getattr(entity, "title", None) or getattr(entity, "name", "") or ""

    def get_entity_description(self, obj) -> str:
        entity = self._resolve_entity(obj)
        if entity is None:
            return ""
        return getattr(entity, "description", "") or ""

    def get_entity_category(self, obj) -> str:
        entity = self._resolve_entity(obj)
        if entity is None:
            return ""
        return getattr(entity, "category", "") or ""


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


class TrendingPlanSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    city = serializers.CharField()
    date = serializers.DateField()
    slug = serializers.CharField()
    item_count = serializers.IntegerField()
    view_count = serializers.IntegerField()
    share_count = serializers.IntegerField()


class PlanItemUpdateSerializer(serializers.Serializer):
    note = serializers.CharField(allow_blank=True, max_length=500, required=False)
    order = serializers.IntegerField(min_value=0, required=False)


class ClonePlanSerializer(serializers.Serializer):
    date = serializers.DateField()

    def validate_date(self, value):
        if value < date_type.today():
            raise serializers.ValidationError("La fecha no puede ser en el pasado.")
        return value


class SurprisePlanSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)

    def validate_date(self, value):
        if value < date_type.today():
            raise serializers.ValidationError("La fecha no puede ser en el pasado.")
        return value
