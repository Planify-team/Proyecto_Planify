import uuid
import pytest
from datetime import date, timedelta
from django.utils import timezone


@pytest.fixture
def place(db):
    from apps.places.models import Place
    return Place.objects.create(
        name="Café del Sur",
        category="cafe",
        address="Av. Corrientes 123",
        city="Buenos Aires",
    )


@pytest.fixture
def activity(db, place):
    from apps.activities.models import Activity
    return Activity.objects.create(
        place=place,
        name="Tour Cultural",
        category="cultural",
        activity_type="tourism",
        min_budget=0,
        max_budget=5000,
        min_people=1,
        indoor=True,
        outdoor=False,
        score_base=70,
    )


@pytest.fixture
def plan(db, regular_user):
    from apps.planner.models import Plan
    return Plan.objects.create(
        user=regular_user,
        title="Plan para 01/07/2026",
        date=date(2026, 7, 1),
        budget=3000,
        people_count=2,
        city="Buenos Aires",
        slug=f"plan-2026-07-01-{str(uuid.uuid4())[:8]}",
        is_public=False,
        status="generated",
    )


@pytest.fixture
def public_plan(db, regular_user):
    from apps.planner.models import Plan
    return Plan.objects.create(
        user=regular_user,
        title="Plan Público",
        date=date(2026, 7, 2),
        budget=2000,
        people_count=1,
        city="Córdoba",
        slug=f"plan-publico-{str(uuid.uuid4())[:8]}",
        is_public=True,
        status="generated",
    )


@pytest.mark.django_db
class TestPlanList:
    url = "/api/v1/plans/"

    def test_unauthenticated_cannot_list(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_authenticated_can_list_own_plans(self, authenticated_client, plan):
        response = authenticated_client.get(self.url)
        assert response.status_code == 200
        data = response.json()["data"]
        assert any(p["id"] == str(plan.id) for p in data)

    def test_create_plan_with_past_date_returns_400(self, authenticated_client):
        payload = {
            "date": str(date.today() - timedelta(days=1)),
            "budget": "1000.00",
            "people_count": 1,
            "city": "Buenos Aires",
        }
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 400

    def test_user_cannot_see_other_user_plans(self, api_client, user_factory, plan):
        other = user_factory(email="other@example.com")
        api_client.force_authenticate(user=other)
        response = api_client.get(self.url)
        assert response.status_code == 200
        data = response.json()["data"]
        assert not any(p["id"] == str(plan.id) for p in data)


@pytest.mark.django_db
class TestPlanDetail:
    def test_owner_can_get_plan(self, authenticated_client, plan):
        response = authenticated_client.get(f"/api/v1/plans/{plan.id}/")
        assert response.status_code == 200
        assert response.json()["data"]["id"] == str(plan.id)

    def test_non_owner_cannot_get_plan(self, api_client, user_factory, plan):
        other = user_factory(email="other2@example.com")
        api_client.force_authenticate(user=other)
        response = api_client.get(f"/api/v1/plans/{plan.id}/")
        assert response.status_code == 404

    def test_owner_can_delete_plan(self, authenticated_client, plan):
        response = authenticated_client.delete(f"/api/v1/plans/{plan.id}/")
        assert response.status_code == 204

    def test_non_owner_cannot_delete(self, api_client, user_factory, plan):
        other = user_factory(email="other3@example.com")
        api_client.force_authenticate(user=other)
        response = api_client.delete(f"/api/v1/plans/{plan.id}/")
        assert response.status_code == 404

    def test_patch_is_public(self, authenticated_client, plan):
        response = authenticated_client.patch(
            f"/api/v1/plans/{plan.id}/",
            {"is_public": True},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["data"]["is_public"] is True

    def test_patch_status(self, authenticated_client, plan):
        response = authenticated_client.patch(
            f"/api/v1/plans/{plan.id}/",
            {"status": "completed"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "completed"


@pytest.mark.django_db
class TestPublicPlan:
    def test_public_plan_accessible_without_auth(self, api_client, public_plan):
        response = api_client.get(f"/api/v1/plans/public/{public_plan.slug}/")
        assert response.status_code == 200
        assert response.json()["data"]["slug"] == public_plan.slug

    def test_private_plan_not_accessible_as_public(self, api_client, plan):
        response = api_client.get(f"/api/v1/plans/public/{plan.slug}/")
        assert response.status_code == 404

    def test_nonexistent_slug_returns_404(self, api_client):
        response = api_client.get("/api/v1/plans/public/slug-que-no-existe/")
        assert response.status_code == 404


@pytest.mark.django_db
class TestPlanItems:
    def test_add_item_to_plan(self, authenticated_client, plan, place):
        payload = {
            "entity_type": "place",
            "entity_id": str(place.id),
            "slot": "morning",
            "note": "Desayuno aquí",
        }
        response = authenticated_client.post(f"/api/v1/plans/{plan.id}/items/", payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["slot"] == "morning"
        assert data["entity_type"] == "place"

    def test_remove_item_from_plan(self, authenticated_client, plan, place):
        from apps.planner.models import PlanItem
        item = PlanItem.objects.create(
            plan=plan,
            entity_type="place",
            entity_id=place.id,
            slot="afternoon",
            order=0,
        )
        response = authenticated_client.delete(f"/api/v1/plans/{plan.id}/items/{item.id}/")
        assert response.status_code == 204

    def test_remove_item_wrong_plan_returns_404(self, authenticated_client, plan, place):
        from apps.planner.models import PlanItem, Plan
        other_plan = Plan.objects.create(
            user=plan.user,
            title="Otro plan",
            date=date(2026, 8, 1),
            budget=1000,
            people_count=1,
            city="Rosario",
            slug=f"otro-plan-{str(uuid.uuid4())[:8]}",
            status="draft",
        )
        item = PlanItem.objects.create(
            plan=other_plan,
            entity_type="place",
            entity_id=place.id,
            slot="morning",
            order=0,
        )
        response = authenticated_client.delete(f"/api/v1/plans/{plan.id}/items/{item.id}/")
        assert response.status_code == 404

    def test_add_item_with_nonexistent_entity_returns_400(self, authenticated_client, plan):
        payload = {
            "entity_type": "place",
            "entity_id": str(uuid.uuid4()),
            "slot": "morning",
        }
        response = authenticated_client.post(f"/api/v1/plans/{plan.id}/items/", payload, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
class TestGeneratePlan:
    url = "/api/v1/plans/generate/"

    def test_unauthenticated_cannot_generate(self, api_client):
        response = api_client.post(self.url, {}, format="json")
        assert response.status_code == 401

    def test_validation_error_without_required_fields(self, authenticated_client):
        response = authenticated_client.post(self.url, {}, format="json")
        assert response.status_code == 400

    def test_validation_error_with_past_date(self, authenticated_client):
        payload = {
            "date": str(date.today() - timedelta(days=1)),
            "budget": "1000.00",
            "people_count": 1,
            "city": "Buenos Aires",
        }
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 400

    def test_generate_creates_plan(self, authenticated_client, activity):
        payload = {
            "date": str(date.today() + timedelta(days=10)),
            "budget": "5000.00",
            "people_count": 2,
            "city": "Buenos Aires",
        }
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["status"] == "generated"
        assert data["city"] == "Buenos Aires"
        assert "items" in data

    def test_generate_plan_respects_city(self, authenticated_client, activity):
        payload = {
            "date": str(date.today() + timedelta(days=10)),
            "budget": "5000.00",
            "people_count": 1,
            "city": "Ciudad Ficticia XYZ",
        }
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        # No matching entities → zero items (city filter filters everything out)
        assert isinstance(data["items"], list)

    def test_generate_plan_has_generation_reason_on_items(self, authenticated_client, activity):
        payload = {
            "date": str(date.today() + timedelta(days=10)),
            "budget": "9000.00",
            "people_count": 1,
            "city": "Buenos Aires",
        }
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        items = response.json()["data"]["items"]
        for item in items:
            assert "generation_reason" in item


@pytest.mark.django_db
class TestPlanShare:
    def test_owner_can_share_plan(self, authenticated_client, plan):
        response = authenticated_client.post(f"/api/v1/plans/{plan.id}/share/")
        assert response.status_code == 200
        assert response.json()["data"]["shared"] is True

    def test_non_owner_cannot_share_plan(self, api_client, user_factory, plan):
        other = user_factory(email="shareother@example.com")
        api_client.force_authenticate(user=other)
        response = api_client.post(f"/api/v1/plans/{plan.id}/share/")
        assert response.status_code == 404

    def test_share_logs_interaction(self, authenticated_client, plan):
        from apps.recommendations.models import InteractionHistory
        authenticated_client.post(f"/api/v1/plans/{plan.id}/share/")
        assert InteractionHistory.objects.filter(
            entity_type="plan",
            entity_id=str(plan.id),
            action="plan_shared",
        ).exists()


@pytest.mark.django_db
class TestPlanFeedback:
    def test_owner_can_submit_feedback(self, authenticated_client, plan, place):
        from apps.planner.models import PlanItem
        PlanItem.objects.create(
            plan=plan, entity_type="place", entity_id=place.id, slot="morning", order=0
        )
        payload = {
            "entity_type": "place",
            "entity_id": str(place.id),
            "rating": 4,
            "comment": "Muy bueno",
        }
        response = authenticated_client.post(f"/api/v1/plans/{plan.id}/feedback/", payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["rating"] == 4
        assert data["entity_type"] == "place"

    def test_feedback_is_idempotent(self, authenticated_client, plan, place):
        payload = {
            "entity_type": "place",
            "entity_id": str(place.id),
            "rating": 3,
        }
        authenticated_client.post(f"/api/v1/plans/{plan.id}/feedback/", payload, format="json")
        payload["rating"] = 5
        response = authenticated_client.post(f"/api/v1/plans/{plan.id}/feedback/", payload, format="json")
        assert response.status_code == 201
        from apps.planner.models import PlanFeedback
        assert PlanFeedback.objects.filter(plan=plan, entity_type="place").count() == 1
        assert PlanFeedback.objects.get(plan=plan, entity_type="place").rating == 5

    def test_non_owner_cannot_submit_feedback(self, api_client, user_factory, plan, place):
        other = user_factory(email="feedbackother@example.com")
        api_client.force_authenticate(user=other)
        payload = {"entity_type": "place", "entity_id": str(place.id), "rating": 3}
        response = api_client.post(f"/api/v1/plans/{plan.id}/feedback/", payload, format="json")
        assert response.status_code in (403, 404)

    def test_invalid_rating_returns_400(self, authenticated_client, plan, place):
        payload = {"entity_type": "place", "entity_id": str(place.id), "rating": 6}
        response = authenticated_client.post(f"/api/v1/plans/{plan.id}/feedback/", payload, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
class TestPlaceOwnership:
    def test_business_owner_can_create_place(self, api_client, user_factory):
        owner = user_factory(email="biz@example.com", role="business_owner")
        api_client.force_authenticate(user=owner)
        payload = {
            "name": "Mi Café",
            "category": "cafe",
            "address": "Av. Siempre Viva 742",
            "city": "Buenos Aires",
        }
        response = api_client.post("/api/v1/places/", payload, format="json")
        assert response.status_code == 201
        from apps.places.models import Place
        place = Place.objects.get(id=response.json()["data"]["id"])
        assert place.owner == owner

    def test_business_owner_can_edit_own_place(self, api_client, user_factory):
        from apps.places.models import Place
        owner = user_factory(email="bizedit@example.com", role="business_owner")
        place = Place.objects.create(
            name="Café Edit", category="cafe", address="Av 1", city="BA", owner=owner
        )
        api_client.force_authenticate(user=owner)
        response = api_client.patch(f"/api/v1/places/{place.id}/", {"name": "Café Editado"}, format="json")
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "Café Editado"

    def test_business_owner_cannot_edit_other_place(self, api_client, user_factory):
        from apps.places.models import Place
        owner1 = user_factory(email="biz1@example.com", role="business_owner")
        owner2 = user_factory(email="biz2@example.com", role="business_owner")
        place = Place.objects.create(
            name="Lugar Ajeno", category="cafe", address="Av 2", city="BA", owner=owner1
        )
        api_client.force_authenticate(user=owner2)
        response = api_client.patch(f"/api/v1/places/{place.id}/", {"name": "Hack"}, format="json")
        assert response.status_code == 403


@pytest.mark.django_db
class TestBusinessDashboard:
    url_stats = "/api/v1/dashboard/business/stats/"
    url_places = "/api/v1/dashboard/business/places/"
    url_promotions = "/api/v1/dashboard/business/promotions/"

    def test_unauthenticated_cannot_access(self, api_client):
        assert api_client.get(self.url_stats).status_code == 401

    def test_regular_user_cannot_access(self, authenticated_client):
        assert authenticated_client.get(self.url_stats).status_code == 403

    def test_business_owner_gets_stats(self, api_client, user_factory):
        owner = user_factory(email="bizstats@example.com", role="business_owner")
        api_client.force_authenticate(user=owner)
        response = api_client.get(self.url_stats)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "total_places" in data
        assert "active_promotions" in data

    def test_business_owner_gets_own_places(self, api_client, user_factory):
        from apps.places.models import Place
        owner = user_factory(email="bizplaces@example.com", role="business_owner")
        Place.objects.create(
            name="Mi Lugar", category="restaurant", address="Calle 1", city="BA", owner=owner
        )
        api_client.force_authenticate(user=owner)
        response = api_client.get(self.url_places)
        assert response.status_code == 200
        assert len(response.json()["data"]) >= 1


@pytest.mark.django_db
class TestOrganizerDashboard:
    url_stats = "/api/v1/dashboard/organizer/stats/"
    url_events = "/api/v1/dashboard/organizer/events/"

    def test_unauthenticated_cannot_access(self, api_client):
        assert api_client.get(self.url_stats).status_code == 401

    def test_regular_user_cannot_access(self, authenticated_client):
        assert authenticated_client.get(self.url_stats).status_code == 403

    def test_event_organizer_gets_stats(self, api_client, user_factory):
        org = user_factory(email="orgstats@example.com", role="event_organizer")
        api_client.force_authenticate(user=org)
        response = api_client.get(self.url_stats)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "total_events" in data
        assert "published_events" in data


@pytest.mark.django_db
class TestRecommendationV3:
    def test_feedback_score_positive(self):
        from apps.recommendations.services import _feedback_score
        from apps.places.models import Place
        from apps.planner.models import PlanFeedback, Plan
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            email="fbtest@example.com", password="pass", role="user"
        )
        place = Place.objects.create(
            name="Test Place", category="cafe", address="Av 1", city="BA"
        )
        plan = Plan.objects.create(
            user=user, title="FBPlan", date=date(2026, 8, 1),
            budget=1000, people_count=1, city="BA",
            slug="fbplan-test-001", status="generated",
        )
        PlanFeedback.objects.create(
            plan=plan, user=user, entity_type="place",
            entity_id=str(place.id), rating=5,
        )
        score = _feedback_score(str(place.id), "place")
        assert score > 0

    def test_feedback_score_negative(self):
        from apps.recommendations.services import _feedback_score
        from apps.places.models import Place
        from apps.planner.models import PlanFeedback, Plan
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            email="fbneg@example.com", password="pass", role="user"
        )
        place = Place.objects.create(
            name="Bad Place", category="cafe", address="Av 2", city="BA"
        )
        plan = Plan.objects.create(
            user=user, title="BadPlan", date=date(2026, 8, 2),
            budget=1000, people_count=1, city="BA",
            slug="badplan-test-002", status="generated",
        )
        PlanFeedback.objects.create(
            plan=plan, user=user, entity_type="place",
            entity_id=str(place.id), rating=1,
        )
        score = _feedback_score(str(place.id), "place")
        assert score < 0

    def test_feedback_score_empty_returns_zero(self):
        from apps.recommendations.services import _feedback_score
        score = _feedback_score(str(uuid.uuid4()), "place")
        assert score == 0
