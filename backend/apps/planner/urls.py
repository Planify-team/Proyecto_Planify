from django.urls import path
from . import views

urlpatterns = [
    path("generate/", views.generate_plan_view, name="plan-generate"),
    path("", views.plan_list, name="plan-list"),
    path("<uuid:plan_id>/", views.plan_detail, name="plan-detail"),
    path("<uuid:plan_id>/items/", views.add_plan_item, name="plan-add-item"),
    path("<uuid:plan_id>/items/<uuid:item_id>/", views.remove_plan_item, name="plan-remove-item"),
    path("<uuid:plan_id>/share/", views.plan_share, name="plan-share"),
    path("<uuid:plan_id>/feedback/", views.plan_feedback, name="plan-feedback"),
    path("public/<slug:slug>/", views.public_plan, name="plan-public"),
]
