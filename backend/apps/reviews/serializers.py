from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ("id", "user_email", "user_name", "entity_type", "entity_id", "stars", "text", "created_at")
        read_only_fields = ("id", "user_email", "user_name", "created_at")

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.email.split("@")[0]


class ReviewCreateSerializer(serializers.Serializer):
    entity_type = serializers.ChoiceField(choices=["place", "activity", "event"])
    entity_id = serializers.UUIDField()
    stars = serializers.IntegerField(min_value=1, max_value=5)
    text = serializers.CharField(allow_blank=True, default="", max_length=1000)
