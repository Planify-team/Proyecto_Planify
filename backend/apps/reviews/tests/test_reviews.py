import uuid
import pytest


@pytest.fixture
def place(db):
    from apps.places.models import Place
    return Place.objects.create(
        name="Café Tortoni",
        category="cafe",
        address="Av. de Mayo 829",
        city="Buenos Aires",
    )


@pytest.fixture
def review_payload(place):
    return {
        "entity_type": "place",
        "entity_id": str(place.id),
        "stars": 4,
        "text": "Muy bueno",
    }


@pytest.mark.django_db
class TestReviewCreate:
    url = "/api/v1/reviews/"

    def test_unauthenticated_cannot_create(self, api_client, review_payload):
        response = api_client.post(self.url, review_payload, format="json")
        assert response.status_code == 401

    def test_authenticated_can_create(self, authenticated_client, review_payload):
        response = authenticated_client.post(self.url, review_payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["stars"] == 4
        assert data["text"] == "Muy bueno"

    def test_duplicate_is_upsert(self, authenticated_client, review_payload):
        authenticated_client.post(self.url, review_payload, format="json")
        review_payload["stars"] = 5
        response = authenticated_client.post(self.url, review_payload, format="json")
        assert response.status_code == 201
        assert response.json()["data"]["stars"] == 5

    def test_stars_validation(self, authenticated_client, place):
        payload = {"entity_type": "place", "entity_id": str(place.id), "stars": 6}
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 400

    def test_invalid_entity_type(self, authenticated_client, place):
        payload = {"entity_type": "venue", "entity_id": str(place.id), "stars": 3}
        response = authenticated_client.post(self.url, payload, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
class TestReviewList:
    def _url(self, entity_type, entity_id):
        return f"/api/v1/reviews/{entity_type}/{entity_id}/"

    def test_unauthenticated_can_list(self, api_client, place):
        url = self._url("place", place.id)
        response = api_client.get(url)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "reviews" in data
        assert "rating" in data

    def test_list_shows_review(self, authenticated_client, review_payload, place):
        authenticated_client.post("/api/v1/reviews/", review_payload, format="json")
        response = authenticated_client.get(self._url("place", place.id))
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data["reviews"]) == 1
        assert data["rating"]["average"] == 4.0
        assert data["rating"]["count"] == 1

    def test_my_review_shown_when_authenticated(self, authenticated_client, review_payload, place):
        authenticated_client.post("/api/v1/reviews/", review_payload, format="json")
        response = authenticated_client.get(self._url("place", place.id))
        assert response.json()["data"]["my_review"] is not None

    def test_invalid_entity_type_returns_400(self, api_client, place):
        response = api_client.get(self._url("venue", place.id))
        assert response.status_code == 400


@pytest.mark.django_db
class TestReviewDelete:
    def _url(self, entity_type, entity_id):
        return f"/api/v1/reviews/{entity_type}/{entity_id}/delete/"

    def test_user_can_delete_own_review(self, authenticated_client, review_payload, place):
        authenticated_client.post("/api/v1/reviews/", review_payload, format="json")
        response = authenticated_client.delete(self._url("place", place.id))
        assert response.status_code == 204

    def test_delete_nonexistent_review_404(self, authenticated_client, place):
        response = authenticated_client.delete(self._url("place", place.id))
        assert response.status_code == 404

    def test_unauthenticated_cannot_delete(self, api_client, place):
        response = api_client.delete(self._url("place", place.id))
        assert response.status_code == 401
