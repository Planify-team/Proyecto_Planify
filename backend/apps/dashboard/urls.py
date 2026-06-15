from django.urls import path
from . import views

urlpatterns = [
    path("business/stats/", views.business_dashboard, name="dashboard-business-stats"),
    path("business/places/", views.business_places, name="dashboard-business-places"),
    path("business/promotions/", views.business_promotions, name="dashboard-business-promotions"),
    path("organizer/stats/", views.organizer_dashboard, name="dashboard-organizer-stats"),
    path("organizer/events/", views.organizer_events, name="dashboard-organizer-events"),
]
