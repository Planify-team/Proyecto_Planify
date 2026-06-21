from rest_framework import serializers
from .models import Recommendation


class RecommendationSerializer(serializers.ModelSerializer):
    activity_detail = serializers.SerializerMethodField()
    event_detail = serializers.SerializerMethodField()
    place_detail = serializers.SerializerMethodField()
    item_type = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = (
            "id", "score", "recommendation_reason", "score_breakdown",
            "activity", "event", "place",
            "activity_detail", "event_detail", "place_detail",
            "item_type", "created_at",
        )
        read_only_fields = fields

    def get_item_type(self, obj):
        if obj.activity_id:
            return "activity"
        if obj.event_id:
            return "event"
        if obj.place_id:
            return "place"
        return None

    def get_activity_detail(self, obj):
        if not obj.activity_id:
            return None
        a = obj.activity
        return {
            "id": str(a.id),
            "name": a.name,
            "category": a.category,
            "activity_type": a.activity_type,
            "min_budget": str(a.min_budget),
            "indoor": a.indoor,
            "outdoor": a.outdoor,
            "address": a.address or "",
            "city": a.city or "",
            "is_free": a.is_free,
            "image_url": a.image_url or "",
        }

    def get_event_detail(self, obj):
        if not obj.event_id:
            return None
        e = obj.event
        place = e.place  # already select_related in services.py
        return {
            "id": str(e.id),
            "title": e.title,
            "category": e.category,
            "start_date": e.start_date,
            "price": str(e.price),
            "image_url": e.image_url,
            "place_name": place.name if place else "",
            "place_address": place.address if place else "",
            "place_city": place.city if place else "",
        }

    def get_place_detail(self, obj):
        if not obj.place_id:
            return None
        p = obj.place
        return {
            "id": str(p.id),
            "name": p.name,
            "category": p.category,
            "address": p.address or "",
            "city": p.city or "",
            "price_level": p.price_level,
            "image_url": p.image_url,
            "latitude": float(p.latitude) if p.latitude else None,
            "longitude": float(p.longitude) if p.longitude else None,
        }
