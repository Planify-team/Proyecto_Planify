from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.cache import cache

from apps.integrations.providers.overpass import OverpassProvider, _parse_bool_tag
from apps.integrations.services import _auto_description


OSM_ELEMENT = {
    "type": "node",
    "id": 12345,
    "lat": -34.606,
    "lon": -58.435,
    "tags": {
        "name": "Parque Centenario",
        "amenity": "park",
        "addr:city": "Buenos Aires",
    },
}

OSM_WAY_ELEMENT = {
    "type": "way",
    "id": 99999,
    "center": {"lat": -34.61, "lon": -58.44},
    "tags": {
        "name": "Bar San Telmo",
        "amenity": "bar",
        "addr:street": "Defensa",
        "addr:housenumber": "123",
        "addr:city": "Buenos Aires",
        "phone": "+54 11 1234-5678",
        "website": "https://example.com",
    },
}


def _mock_response(elements=None):
    mock = MagicMock()
    mock.raise_for_status = MagicMock()
    mock.json.return_value = {"elements": elements if elements is not None else [OSM_ELEMENT]}
    return mock


class OverpassProviderTests(TestCase):
    def setUp(self):
        cache.clear()
        self.provider = OverpassProvider()

    def tearDown(self):
        cache.clear()

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_search_nearby_returns_results(self, mock_post):
        mock_post.return_value = _mock_response()
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Parque Centenario")
        self.assertEqual(results[0]["source"], "osm")
        self.assertIn("osm:node:12345", results[0]["external_id"])

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_caches_results(self, mock_post):
        mock_post.return_value = _mock_response()
        self.provider.search_nearby(-34.60, -58.40)
        self.provider.search_nearby(-34.60, -58.40)
        self.assertEqual(mock_post.call_count, 1)

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_fallback_on_api_error(self, mock_post):
        mock_post.side_effect = Exception("timeout")
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(results, [])

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_skips_elements_without_name(self, mock_post):
        mock_post.return_value = _mock_response([
            {"type": "node", "id": 1, "lat": -34.6, "lon": -58.4, "tags": {}},
        ])
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(results, [])

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_parses_node_with_phone_and_website(self, mock_get):
        node = {
            "type": "node", "id": 99999,
            "lat": -34.61, "lon": -58.44,
            "tags": {
                "name": "Bar San Telmo", "amenity": "bar",
                "addr:street": "Defensa", "addr:housenumber": "123",
                "addr:city": "Buenos Aires",
                "phone": "+54 11 1234-5678", "website": "https://example.com",
            },
        }
        mock_get.return_value = _mock_response([node])
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Bar San Telmo")
        self.assertEqual(results[0]["phone"], "+54 11 1234-5678")
        self.assertEqual(results[0]["website"], "https://example.com")
        self.assertAlmostEqual(results[0]["latitude"], -34.61)

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_deduplicates_elements(self, mock_post):
        mock_post.return_value = _mock_response([OSM_ELEMENT, OSM_ELEMENT])
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(len(results), 1)

    def test_resolve_category_amenity(self):
        self.assertEqual(self.provider._resolve_category({"amenity": "restaurant"}), "Gastronomía")
        self.assertEqual(self.provider._resolve_category({"amenity": "bar"}), "Bar")
        self.assertEqual(self.provider._resolve_category({"amenity": "museum"}), "Museo")

    def test_resolve_category_leisure(self):
        self.assertEqual(self.provider._resolve_category({"leisure": "park"}), "Parque")
        self.assertEqual(self.provider._resolve_category({"leisure": "fitness_centre"}), "Deporte")

    def test_resolve_category_unknown(self):
        self.assertEqual(self.provider._resolve_category({"amenity": "unknown_xyz"}), "Lugar")

    def test_build_address_with_street_and_number(self):
        tags = {"addr:street": "Corrientes", "addr:housenumber": "1234", "addr:city": "Buenos Aires"}
        address = self.provider._build_address(tags)
        self.assertIn("Corrientes 1234", address)
        self.assertIn("Buenos Aires", address)

    def test_build_address_empty_when_no_data(self):
        self.assertEqual(self.provider._build_address({}), "")

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_search_by_query_falls_back_to_nearby(self, mock_post):
        mock_post.return_value = _mock_response()
        results = self.provider.search_by_query("bar", -34.6, -58.4)
        self.assertTrue(mock_post.called)
        self.assertEqual(len(results), 1)

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_type_filter_uses_specific_tag(self, mock_get):
        mock_get.return_value = _mock_response([])
        self.provider.search_nearby(-34.6, -58.4, place_type="restaurant")
        call_kwargs = mock_get.call_args[1]
        query_sent = call_kwargs.get("params", {}).get("data", "")
        self.assertIn("restaurant", query_sent)

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_captures_opening_hours(self, mock_get):
        node = {
            "type": "node", "id": 111,
            "lat": -34.6, "lon": -58.4,
            "tags": {"name": "Bar Test", "amenity": "bar", "opening_hours": "Mo-Fr 09:00-22:00"},
        }
        mock_get.return_value = _mock_response([node])
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(results[0]["opening_hours"], "Mo-Fr 09:00-22:00")

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_captures_cuisine(self, mock_get):
        node = {
            "type": "node", "id": 222,
            "lat": -34.6, "lon": -58.4,
            "tags": {"name": "Pizza Place", "amenity": "restaurant", "cuisine": "pizza"},
        }
        mock_get.return_value = _mock_response([node])
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertEqual(results[0]["cuisine"], "pizza")

    @patch("apps.integrations.providers.overpass.requests.get")
    def test_captures_outdoor_seating(self, mock_get):
        node = {
            "type": "node", "id": 333,
            "lat": -34.6, "lon": -58.4,
            "tags": {"name": "Café Terraza", "amenity": "cafe", "outdoor_seating": "yes"},
        }
        mock_get.return_value = _mock_response([node])
        results = self.provider.search_nearby(-34.6, -58.4)
        self.assertTrue(results[0]["outdoor_seating"])


class ParseBoolTagTests(TestCase):
    def test_yes_returns_true(self):
        self.assertTrue(_parse_bool_tag("yes"))
        self.assertTrue(_parse_bool_tag("true"))
        self.assertTrue(_parse_bool_tag("1"))

    def test_no_returns_false(self):
        self.assertFalse(_parse_bool_tag("no"))
        self.assertFalse(_parse_bool_tag("false"))
        self.assertFalse(_parse_bool_tag("0"))

    def test_none_returns_none(self):
        self.assertIsNone(_parse_bool_tag(None))
        self.assertIsNone(_parse_bool_tag(""))
        self.assertIsNone(_parse_bool_tag("unknown"))


class AutoDescriptionTests(TestCase):
    def test_cuisine_pizza(self):
        desc = _auto_description({"category": "Gastronomía", "cuisine": "pizza", "city": "Buenos Aires"})
        self.assertIn("Pizzería", desc)
        self.assertIn("Buenos Aires", desc)

    def test_park_category(self):
        desc = _auto_description({"category": "Parque", "city": "Rosario"})
        self.assertIn("verde", desc)
        self.assertIn("Rosario", desc)

    def test_free_museum(self):
        desc = _auto_description({"category": "Museo", "fee": False, "city": "CABA"})
        self.assertIn("gratuita", desc)

    def test_outdoor_seating(self):
        desc = _auto_description({"category": "Café", "outdoor_seating": True, "city": "Mendoza"})
        self.assertIn("terraza", desc)

    def test_fallback_category_and_city(self):
        desc = _auto_description({"category": "Cine", "city": "Córdoba"})
        self.assertIn("Cine", desc)
        self.assertIn("Córdoba", desc)

    def test_empty_city_no_crash(self):
        desc = _auto_description({"category": "Bar", "city": ""})
        self.assertIn("Bar", desc)
