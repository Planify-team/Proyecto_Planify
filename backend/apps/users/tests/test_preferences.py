import pytest
from apps.users.models import UserPreference


@pytest.fixture
def pref_payload():
    return {"category": "music", "value": "jazz", "weight": 3}


@pytest.mark.django_db
class TestPreferenceList:
    url = "/api/v1/users/me/preferences/"

    def test_unauthenticated_denied(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_get_empty_list(self, authenticated_client):
        response = authenticated_client.get(self.url)
        assert response.status_code == 200
        assert response.json()["data"] == []

    def test_create_preference(self, authenticated_client, pref_payload):
        response = authenticated_client.post(self.url, [pref_payload], format="json")
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) == 1
        assert data[0]["category"] == "music"

    def test_create_idempotent(self, authenticated_client, pref_payload):
        authenticated_client.post(self.url, [pref_payload], format="json")
        authenticated_client.post(self.url, [pref_payload], format="json")
        assert UserPreference.objects.count() == 1

    def test_user_isolation(self, authenticated_client, admin_client, pref_payload):
        authenticated_client.post(self.url, [pref_payload], format="json")
        response = admin_client.get(self.url)
        assert response.json()["data"] == []


@pytest.mark.django_db
class TestPreferenceDetail:
    list_url = "/api/v1/users/me/preferences/"

    def _create_pref(self, client):
        payload = [{"category": "cinema", "value": "drama", "weight": 2}]
        r = client.post(self.list_url, payload, format="json")
        return r.json()["data"][0]["id"]

    def test_patch_preference(self, authenticated_client):
        pk = self._create_pref(authenticated_client)
        url = f"{self.list_url}{pk}/"
        response = authenticated_client.patch(url, {"weight": 5}, format="json")
        assert response.status_code == 200
        assert response.json()["data"]["weight"] == 5

    def test_delete_preference(self, authenticated_client, regular_user):
        pk = self._create_pref(authenticated_client)
        url = f"{self.list_url}{pk}/"
        response = authenticated_client.delete(url)
        assert response.status_code == 204
        assert not UserPreference.objects.filter(id=pk).exists()

    def test_cannot_access_other_user_pref(self, authenticated_client, admin_client):
        pk = self._create_pref(authenticated_client)
        url = f"{self.list_url}{pk}/"
        response = admin_client.patch(url, {"weight": 10}, format="json")
        assert response.status_code == 404

    def test_audit_log_on_delete(self, authenticated_client, regular_user):
        from apps.audit.models import AuditLog
        pk = self._create_pref(authenticated_client)
        authenticated_client.delete(f"{self.list_url}{pk}/")
        assert AuditLog.objects.filter(user=regular_user, action="delete", entity_type="user_preference").exists()
