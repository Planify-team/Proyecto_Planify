from unittest.mock import patch, MagicMock
from django.test import TestCase

from apps.integrations.providers.gcba import GCBAProvider, DATASETS


def _make_record(**kwargs):
    defaults = {
        "_id": "42",
        "nombre": "Centro Cultural Recoleta",
        "domicilio": "Junín 1930",
        "barrio": "Recoleta",
        "lat": "-34.5872",
        "long": "-58.3931",
        "descripcion": "Espacio cultural público en Recoleta.",
        "web": "https://centroculturalrecoleta.org",
    }
    defaults.update(kwargs)
    return defaults


class GCBAProviderParseRecordTests(TestCase):
    def setUp(self):
        self.provider = GCBAProvider()
        self.config = DATASETS["centros_culturales"]

    def test_parses_basic_record(self):
        record = _make_record()
        result = self.provider.parse_record(record, self.config)
        self.assertIsNotNone(result)
        self.assertEqual(result["name"], "Centro Cultural Recoleta")
        self.assertEqual(result["category"], "Cultura")
        self.assertEqual(result["source"], "gcba")
        self.assertEqual(result["city"], "Buenos Aires")

    def test_returns_none_for_missing_name(self):
        record = _make_record(nombre="")
        result = self.provider.parse_record(record, self.config)
        self.assertIsNone(result)

    def test_returns_none_for_whitespace_name(self):
        record = _make_record(nombre="   ")
        result = self.provider.parse_record(record, self.config)
        self.assertIsNone(result)

    def test_builds_address_from_domicilio_and_barrio(self):
        record = _make_record(domicilio="Junín 1930", barrio="Recoleta")
        result = self.provider.parse_record(record, self.config)
        self.assertEqual(result["address"], "Junín 1930, Recoleta")

    def test_handles_missing_barrio(self):
        record = _make_record(barrio="")
        result = self.provider.parse_record(record, self.config)
        self.assertEqual(result["address"], "Junín 1930")

    def test_parses_valid_coordinates(self):
        record = _make_record(lat="-34.5872", long="-58.3931")
        result = self.provider.parse_record(record, self.config)
        self.assertAlmostEqual(result["latitude"], -34.5872, places=4)
        self.assertAlmostEqual(result["longitude"], -58.3931, places=4)

    def test_handles_malformed_coordinates(self):
        record = _make_record(lat="no-es-un-numero", long="tampoco")
        result = self.provider.parse_record(record, self.config)
        # Should not raise — coordinates come back as None
        self.assertIsNone(result["latitude"])
        self.assertIsNone(result["longitude"])

    def test_handles_zero_coordinates(self):
        record = _make_record(lat="0", long="0")
        result = self.provider.parse_record(record, self.config)
        # Zero coords treated as None (invalid for BA)
        self.assertIsNone(result["latitude"])

    def test_builds_stable_external_id(self):
        record = _make_record()
        result = self.provider.parse_record(record, self.config)
        self.assertTrue(result["external_id"].startswith("gcba:"))
        self.assertIn("42", result["external_id"])

    def test_external_id_uses_name_as_fallback(self):
        record = _make_record()
        del record["_id"]
        result = self.provider.parse_record(record, self.config)
        self.assertIsNotNone(result)
        self.assertIn("gcba:", result["external_id"])

    def test_truncates_long_external_url(self):
        long_url = "https://example.com/" + "x" * 300
        record = _make_record(web=long_url)
        result = self.provider.parse_record(record, self.config)
        self.assertLessEqual(len(result["external_url"]), 200)


class GCBAFetchDatasetTests(TestCase):
    def setUp(self):
        self.provider = GCBAProvider()

    @patch("apps.integrations.providers.gcba.requests.get")
    def test_returns_records_on_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "success": True,
            "result": {"records": [_make_record()]},
        }
        mock_get.return_value = mock_resp
        records = self.provider.fetch_dataset("centros_culturales", limit=10)
        self.assertEqual(len(records), 1)

    @patch("apps.integrations.providers.gcba.requests.get")
    def test_returns_empty_on_api_failure(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {"success": False, "result": {}}
        mock_get.return_value = mock_resp
        records = self.provider.fetch_dataset("centros_culturales")
        self.assertEqual(records, [])

    @patch("apps.integrations.providers.gcba.requests.get")
    def test_retries_on_network_error(self, mock_get):
        import requests as req_lib
        mock_get.side_effect = [
            req_lib.exceptions.ConnectionError("timeout"),
            req_lib.exceptions.ConnectionError("timeout"),
        ]
        with patch("apps.integrations.providers.gcba.time.sleep"):
            records = self.provider.fetch_dataset("centros_culturales")
        self.assertEqual(records, [])

    def test_raises_for_unknown_dataset(self):
        with self.assertRaises(ValueError):
            self.provider.fetch_dataset("no_existe")


class GCBADedupTests(TestCase):
    """Integration test: update_or_create deduplicates by external_id."""

    def test_deduplication(self):
        from apps.activities.models import Activity

        provider = GCBAProvider()
        config = DATASETS["centros_culturales"]
        record = _make_record()

        parsed = provider.parse_record(record, config)
        self.assertIsNotNone(parsed)

        external_id = parsed.pop("external_id")

        # First import
        obj1, created1 = Activity.objects.update_or_create(
            external_id=external_id, defaults=parsed
        )
        self.assertTrue(created1)

        # Re-import with updated description
        parsed["description"] = "Descripción actualizada."
        obj2, created2 = Activity.objects.update_or_create(
            external_id=external_id, defaults=parsed
        )
        self.assertFalse(created2)
        self.assertEqual(obj1.pk, obj2.pk)
        obj2.refresh_from_db()
        self.assertEqual(obj2.description, "Descripción actualizada.")
