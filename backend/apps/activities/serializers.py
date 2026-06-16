from rest_framework import serializers
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    place_name = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = (
            "id", "name", "description", "category", "activity_type",
            "min_budget", "max_budget", "min_people", "max_people",
            "indoor", "outdoor", "score_base", "is_active", "place", "place_name",
            "avg_rating", "review_count",
            "latitude", "longitude", "address", "is_free",
            "external_url", "image_url", "source",
            "city", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_place_name(self, obj):
        return obj.place.name if obj.place else None

    def get_avg_rating(self, obj):
        val = getattr(obj, "avg_rating", None)
        return round(float(val), 1) if val is not None else None

    def get_review_count(self, obj):
        return getattr(obj, "review_count", None) or 0


class ActivityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = (
            "name", "description", "category", "activity_type",
            "min_budget", "max_budget", "min_people", "max_people",
            "indoor", "outdoor", "score_base", "place",
        )
