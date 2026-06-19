from django.urls import path, include
from apps.integrations.urls import weather_urlpatterns, external_places_urlpatterns, geocoding_urlpatterns
from apps.core.views import trending, search

urlpatterns = [
    path("health/", include("apps.core.urls")),
    path("trending/", trending, name="trending"),
    path("search/", search, name="search"),
    path("auth/", include("apps.users.urls.auth")),
    path("users/", include("apps.users.urls.users")),
    path("places/", include("apps.places.urls")),
    path("events/", include("apps.events.urls")),
    path("activities/", include("apps.activities.urls")),
    path("recommendations/", include("apps.recommendations.urls")),
    path("favorites/", include("apps.favorites.urls")),
    path("promotions/", include("apps.promotions.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("reminders/", include("apps.notifications.reminder_urls")),
    path("weather/", include((weather_urlpatterns, "weather"))),
    path("external/places/", include((external_places_urlpatterns, "external-places"))),
    path("geocode/", include((geocoding_urlpatterns, "geocoding"))),
    path("reviews/", include("apps.reviews.urls")),
    path("plans/", include("apps.planner.urls")),
    path("dashboard/", include("apps.dashboard.urls")),
]
