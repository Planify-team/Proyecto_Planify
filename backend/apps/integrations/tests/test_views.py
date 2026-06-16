from unittest.mock import patch
import pytest
from rest_framework.test import APIClient
from rest_framework import status


@pytest.fixture
def auth_client(user_factory):
    user = user_factory(email="weather_test@example.com")
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestWeatherCurrentView:
    url = "/api/v1/weather/current/"

    def test_requires_authentication(self, api_client):
        resp = api_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_400_when_missing_params(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_for_invalid_lat(self, auth_client):
        resp = auth_client.get(self.url, {"lat": "notanumber", "lon": -58.4})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_for_out_of_range_lat(self, auth_client):
        resp = auth_client.get(self.url, {"lat": 200, "lon": -58.4})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("apps.integrations.providers.openweather.OpenWeatherProvider.get_current_weather")
    def test_returns_weather_data(self, mock_weather, auth_client):
        mock_weather.return_value = {
            "temperature": 18.0,
            "feels_like": 16.0,
            "condition": "Clear",
            "humidity": 50,
            "wind_speed": 3.0,
            "clouds": 10,
            "is_outdoor_friendly": True,
        }
        resp = auth_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["success"] is True
        assert resp.data["data"]["temperature"] == 18.0

    @patch("apps.integrations.providers.openweather.OpenWeatherProvider.get_current_weather")
    def test_returns_null_data_on_fallback(self, mock_weather, auth_client):
        mock_weather.return_value = None
        resp = auth_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"] is None


@pytest.mark.django_db
class TestExternalPlacesView:
    url = "/api/v1/external/places/"

    def test_requires_authentication(self, api_client):
        resp = api_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_400_when_missing_params(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("apps.integrations.views.get_external_places")
    def test_returns_empty_list_when_no_results(self, mock_places, auth_client):
        mock_places.return_value = []
        resp = auth_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"] == []

    def test_search_requires_query(self, auth_client):
        resp = auth_client.get("/api/v1/external/places/search/", {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestGeocodingView:
    url = "/api/v1/geocode/"

    def test_requires_authentication(self, api_client):
        resp = api_client.get(self.url, {"q": "Buenos Aires"})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_400_when_missing_query(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("apps.integrations.providers.nominatim.NominatimProvider.geocode")
    def test_returns_geocoded_result(self, mock_geocode, auth_client):
        mock_geocode.return_value = {
            "lat": -34.6037,
            "lon": -58.3816,
            "display_name": "Buenos Aires, Argentina",
            "city": "Buenos Aires",
            "country": "Argentina",
            "country_code": "ar",
        }
        resp = auth_client.get(self.url, {"q": "Buenos Aires"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["success"] is True
        assert resp.data["data"]["city"] == "Buenos Aires"
        assert resp.data["data"]["lat"] == pytest.approx(-34.6037)

    @patch("apps.integrations.providers.nominatim.NominatimProvider.geocode")
    def test_returns_404_when_not_found(self, mock_geocode, auth_client):
        mock_geocode.return_value = None
        resp = auth_client.get(self.url, {"q": "xyzabcnotaplace123"})
        assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestWeatherForecastView:
    url = "/api/v1/weather/forecast/"

    MOCK_FORECAST = [
        {
            "date": "2026-06-17",
            "day_name": "Miércoles",
            "condition": "Clear",
            "description": "cielo despejado",
            "temp_min": 10.0,
            "temp_max": 22.0,
            "precipitation_mm": 0.0,
            "is_outdoor_friendly": True,
        },
        {
            "date": "2026-06-18",
            "day_name": "Jueves",
            "condition": "Rain",
            "description": "lluvia moderada",
            "temp_min": 8.0,
            "temp_max": 14.0,
            "precipitation_mm": 5.2,
            "is_outdoor_friendly": False,
        },
    ]

    def test_requires_authentication(self, api_client):
        resp = api_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_400_when_missing_params(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_returns_400_for_invalid_lat(self, auth_client):
        resp = auth_client.get(self.url, {"lat": "notanumber", "lon": -58.4})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("apps.integrations.providers.openweather.OpenWeatherProvider.get_forecast")
    def test_returns_forecast_list(self, mock_forecast, auth_client):
        mock_forecast.return_value = self.MOCK_FORECAST
        resp = auth_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["success"] is True
        data = resp.data["data"]
        assert len(data) == 2
        assert data[0]["condition"] == "Clear"
        assert data[0]["is_outdoor_friendly"] is True
        assert "date" in data[0]
        assert "temp_min" in data[0]
        assert "temp_max" in data[0]

    @patch("apps.integrations.providers.openweather.OpenWeatherProvider.get_forecast")
    def test_returns_503_when_provider_fails(self, mock_forecast, auth_client):
        mock_forecast.return_value = None
        resp = auth_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    @patch("apps.integrations.providers.openweather.requests.get")
    def test_forecast_caches_result(self, mock_get, auth_client):
        from django.core.cache import cache
        from unittest.mock import MagicMock
        import time
        cache.clear()
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "list": [
                {
                    "dt": 1750118400,
                    "main": {"temp": 20.0, "feels_like": 18.0, "humidity": 50},
                    "weather": [{"main": "Clear", "description": "clear sky"}],
                },
            ]
        }
        mock_get.return_value = mock_resp
        with __import__("django.test.utils", fromlist=["override_settings"]).override_settings(OPENWEATHER_API_KEY="test-key"):
            auth_client.get(self.url, {"lat": -34.60, "lon": -58.40})
            auth_client.get(self.url, {"lat": -34.60, "lon": -58.40})
        assert mock_get.call_count == 1


@pytest.mark.django_db
class TestReverseGeocodingView:
    url = "/api/v1/geocode/reverse/"

    def test_requires_authentication(self, api_client):
        resp = api_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_400_when_missing_params(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @patch("apps.integrations.providers.nominatim.NominatimProvider.reverse_geocode")
    def test_returns_reverse_geocoded_result(self, mock_reverse, auth_client):
        mock_reverse.return_value = {
            "lat": -34.6037,
            "lon": -58.3816,
            "display_name": "Buenos Aires, Argentina",
            "city": "Buenos Aires",
            "country": "Argentina",
            "country_code": "ar",
        }
        resp = auth_client.get(self.url, {"lat": -34.6, "lon": -58.4})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["city"] == "Buenos Aires"
