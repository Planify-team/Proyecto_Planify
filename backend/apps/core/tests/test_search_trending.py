import pytest


@pytest.fixture
def place(db):
    from apps.places.models import Place
    return Place.objects.create(
        name="Café Tortoni",
        category="cafe",
        address="Av. de Mayo 829",
        city="Buenos Aires",
        is_active=True,
    )


@pytest.fixture
def activity(db):
    from apps.activities.models import Activity
    return Activity.objects.create(
        name="Tango show",
        category="música",
        activity_type="concert",
        indoor=True,
        score_base=80,
        is_active=True,
    )


@pytest.fixture
def published_event(db, place):
    from apps.events.models import Event, EventStatus
    from django.utils import timezone
    from datetime import timedelta
    return Event.objects.create(
        title="Festival Buenos Aires",
        category="festival",
        start_date=timezone.now() + timedelta(days=5),
        end_date=timezone.now() + timedelta(days=6),
        status=EventStatus.PUBLISHED,
        place=place,
        price=0,
    )


@pytest.mark.django_db
class TestSearchEndpoint:
    url = "/api/v1/search/"

    def test_empty_query_returns_empty(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 200
        data = response.json()["data"]
        assert data == {"places": [], "activities": [], "events": []}

    def test_finds_place_by_name(self, api_client, place):
        response = api_client.get(self.url, {"q": "tortoni"})
        assert response.status_code == 200
        places = response.json()["data"]["places"]
        assert any(p["name"] == "Café Tortoni" for p in places)

    def test_finds_activity_by_name(self, api_client, activity):
        response = api_client.get(self.url, {"q": "tango"})
        assert response.status_code == 200
        activities = response.json()["data"]["activities"]
        assert any(a["name"] == "Tango show" for a in activities)

    def test_finds_event_by_title(self, api_client, published_event):
        response = api_client.get(self.url, {"q": "festival"})
        assert response.status_code == 200
        events = response.json()["data"]["events"]
        assert any(e["title"] == "Festival Buenos Aires" for e in events)

    def test_no_match_returns_empty_lists(self, api_client, place):
        response = api_client.get(self.url, {"q": "xyznonexistent"})
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["places"] == []
        assert data["activities"] == []
        assert data["events"] == []

    def test_search_is_public(self, api_client, place):
        response = api_client.get(self.url, {"q": "café"})
        assert response.status_code not in (401, 403)


@pytest.mark.django_db
class TestTrendingEndpoint:
    url = "/api/v1/trending/"

    def test_returns_200(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 200

    def test_response_structure(self, api_client):
        response = api_client.get(self.url)
        data = response.json()["data"]
        assert "places" in data
        assert "activities" in data
        assert "events" in data

    def test_is_public(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code not in (401, 403)

    def test_trending_counts_favorites(self, api_client, place, regular_user):
        from apps.favorites.models import Favorite
        Favorite.objects.create(user=regular_user, place=place)
        response = api_client.get(self.url)
        assert response.status_code == 200
        places = response.json()["data"]["places"]
        assert any(str(p["id"]) == str(place.id) for p in places)
