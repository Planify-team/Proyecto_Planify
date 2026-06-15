from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from apps.core.responses import (
    success_response, created_response, no_content_response, error_response
)
from .models import PlanItem
from .selectors import get_plans_for_user, get_plan_by_id, get_plan_by_slug
from .serializers import (
    PlanSerializer, PlanGenerateSerializer,
    PlanItemSerializer, PlanItemCreateSerializer, PlanUpdateSerializer,
    PlanFeedbackSerializer, PlanFeedbackReadSerializer,
)
from .services import generate_plan, create_empty_plan, add_item, remove_item, delete_plan, create_plan_feedback, share_plan


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_plan_view(request):
    serializer = PlanGenerateSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Datos inválidos.", serializer.errors)

    plan = generate_plan(
        user=request.user,
        plan_date=serializer.validated_data["date"],
        budget=serializer.validated_data["budget"],
        people_count=serializer.validated_data["people_count"],
        city=serializer.validated_data["city"],
    )
    return created_response(PlanSerializer(plan).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def plan_list(request):
    if request.method == "GET":
        plans = get_plans_for_user(request.user)
        return success_response(PlanSerializer(plans, many=True).data)

    serializer = PlanGenerateSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Datos inválidos.", serializer.errors)

    plan = create_empty_plan(
        user=request.user,
        plan_date=serializer.validated_data["date"],
        budget=serializer.validated_data["budget"],
        people_count=serializer.validated_data["people_count"],
        city=serializer.validated_data["city"],
    )
    return created_response(PlanSerializer(plan).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def plan_detail(request, plan_id):
    plan = get_plan_by_id(plan_id, user=request.user)
    if not plan:
        return error_response("NOT_FOUND", "Plan no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return success_response(PlanSerializer(plan).data)

    if request.method == "PATCH":
        serializer = PlanUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Datos inválidos.", serializer.errors)

        update_fields = []
        for field, value in serializer.validated_data.items():
            setattr(plan, field, value)
            update_fields.append(field)

        if update_fields:
            update_fields.append("updated_at")
            plan.save(update_fields=update_fields)

        return success_response(PlanSerializer(plan).data)

    delete_plan(plan, request.user)
    return no_content_response()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_plan_item(request, plan_id):
    plan = get_plan_by_id(plan_id, user=request.user)
    if not plan:
        return error_response("NOT_FOUND", "Plan no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    serializer = PlanItemCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Datos inválidos.", serializer.errors)

    item = add_item(
        plan=plan,
        entity_type=serializer.validated_data["entity_type"],
        entity_id=str(serializer.validated_data["entity_id"]),
        slot=serializer.validated_data["slot"],
        note=serializer.validated_data.get("note", ""),
    )
    return created_response(PlanItemSerializer(item).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_plan_item(request, plan_id, item_id):
    plan = get_plan_by_id(plan_id, user=request.user)
    if not plan:
        return error_response("NOT_FOUND", "Plan no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    try:
        item = PlanItem.objects.get(id=item_id, plan=plan)
    except PlanItem.DoesNotExist:
        return error_response("NOT_FOUND", "Ítem no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    remove_item(item)
    return no_content_response()


@api_view(["GET"])
@permission_classes([AllowAny])
def public_plan(request, slug):
    from apps.recommendations.services import log_interaction
    plan = get_plan_by_slug(slug)
    if not plan:
        return error_response("NOT_FOUND", "Plan no encontrado o no es público.", status_code=status.HTTP_404_NOT_FOUND)
    if request.user.is_authenticated:
        log_interaction(
            user=request.user,
            action="plan_viewed",
            entity_type="plan",
            entity_id=str(plan.id),
        )
    return success_response(PlanSerializer(plan).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def plan_share(request, plan_id):
    plan = get_plan_by_id(plan_id, user=request.user)
    if not plan:
        return error_response("NOT_FOUND", "Plan no encontrado.", status_code=status.HTTP_404_NOT_FOUND)
    share_plan(plan=plan, user=request.user)
    return success_response({"shared": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def plan_feedback(request, plan_id):
    plan = get_plan_by_id(plan_id, user=request.user)
    if not plan:
        return error_response("NOT_FOUND", "Plan no encontrado.", status_code=status.HTTP_404_NOT_FOUND)

    serializer = PlanFeedbackSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Datos inválidos.", serializer.errors)

    feedback = create_plan_feedback(
        plan=plan,
        user=request.user,
        entity_type=serializer.validated_data["entity_type"],
        entity_id=str(serializer.validated_data["entity_id"]),
        rating=serializer.validated_data["rating"],
        comment=serializer.validated_data.get("comment", ""),
    )
    return created_response(PlanFeedbackReadSerializer(feedback).data)
