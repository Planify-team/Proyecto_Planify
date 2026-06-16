"""
Tests for GCBAProvider — covers CSV parsing, field mapping and deduplication.
The provider now uses a direct CDN CSV download instead of the CKAN API.
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase

from apps.integrations.providers.gcba import GCBAProvider, _normalize_url, _normalize_name


def _make_csv_row(**kwargs) -> dict:
    """Build a fake CSV row with sensible BA defaults."""
    defaults = {
        "fid": "42",
        "FUNCION_PRINCIPAL": "CENTRO CULTURAL",
        "SUBCATEGORIA": "",
        "ESTABLECIMIENTO": "CENTRO CULTURAL RECOLETA",
        "FUNCION_SECUNDARIA": "",
        "PROGRAMACION": "",
        "SUCURSAL": "",
        "SALA": "",
        "CALLE": "JUNIN",
        "ALTURA": "1930",
        "BARRIO": "RECOLETA",
        "COMUNA": "2",
        "DIRECCION": "JUNIN 1930, CABA",
        "LONGITUD": "-58.3931",
        "LATITUD": "-34.5872",
        "TELEFONO": "4803-1041",
        "MAIL": "",
        "WEB": "https://centroculturalrecoleta.org",
        "": "",
        "FACEBOOK": "",
        "TWITTER": "",
        "INSTAGRAM": "",
        "CAMARA_1": "",
        "CAMARA_2": "",
        "REDES": "",
        "PUNTO_DE_CULTURA": "",
        "OTRAS_REDES": "",
        "CANTIDAD_SALAS": "",
        "CAPACIDAD_TOTAL": "",
        "TAG": "",
    }
    defaults.update(kwargs)
    return defaults


class GCBAProviderParseRecordTests(TestCase):
    def setUp(self):
        self.provider = GCBAProvider()

    def test_parses_basic_record(self):
        row = _make_csv_row()
        result = self.provider.parse_record(row)
        self.assertIsNotNone(result)
        self.assertEqual(result["category"], "Cultura")
        self.assertEqual(result["source"], "gcba")
        self.assertEqual(result["city"], "Buenos Aires")

    def test_title_cases_all_caps_name(self):
        row = _make_csv_row(ESTABLECIMIENTO="CENTRO CULTURAL RECOLETA")
        result = self.provider.parse_record(row)
        self.assertEqual(result["name"], "Centro Cultural Recoleta")

    def test_returns_none_for_missing_name(self):
        row = _make_csv_row(ESTABLECIMIENTO="")
        result = self.provider.parse_record(row)
        self.assertIsNone(result)

    def test_returns_none_for_unknown_funcion(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="LIBRERIA")
        result = self.provider.parse_record(row)
        self.assertIsNone(result)

    def test_returns_none_for_bar_funcion(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="BAR")
        result = self.provider.parse_record(row)
        self.assertIsNone(result)

    def test_parses_valid_coordinates(self):
        row = _make_csv_row(LATITUD="-34.5872", LONGITUD="-58.3931")
        result = self.provider.parse_record(row)
        self.assertAlmostEqual(float(result["latitude"]), -34.5872, places=4)
        self.assertAlmostEqual(float(result["longitude"]), -58.3931, places=4)

    def test_rejects_coordinates_outside_ba_bounds(self):
        row = _make_csv_row(LATITUD="-10.0", LONGITUD="-58.3931")
        result = self.provider.parse_record(row)
        self.assertIsNone(result["latitude"])

    def test_rejects_zero_coordinates(self):
        row = _make_csv_row(LATITUD="0", LONGITUD="0")
        result = self.provider.parse_record(row)
        self.assertIsNone(result["latitude"])

    def test_handles_malformed_coordinates(self):
        row = _make_csv_row(LATITUD="no-es-numero", LONGITUD="tampoco")
        result = self.provider.parse_record(row)
        self.assertIsNone(result["latitude"])
        self.assertIsNone(result["longitude"])

    def test_builds_stable_external_id_from_fid(self):
        row = _make_csv_row(fid="99")
        result = self.provider.parse_record(row)
        self.assertEqual(result["external_id"], "gcba:espacios-culturales:99")

    def test_external_id_falls_back_to_name_if_no_fid(self):
        row = _make_csv_row(fid="", ESTABLECIMIENTO="TEATRO COLON")
        result = self.provider.parse_record(row)
        self.assertIn("gcba:espacios-culturales:", result["external_id"])

    def test_includes_barrio_in_address_if_not_already_present(self):
        row = _make_csv_row(DIRECCION="JUNIN 1930, CABA", BARRIO="RECOLETA")
        result = self.provider.parse_record(row)
        self.assertIn("Recoleta", result["address"])

    def test_maps_museo_category(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="MUSEO")
        result = self.provider.parse_record(row)
        self.assertEqual(result["category"], "Museo")
        self.assertEqual(result["activity_type"], "museum")

    def test_maps_teatro_category(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="SALA DE TEATRO")
        result = self.provider.parse_record(row)
        self.assertEqual(result["category"], "Cultura")
        self.assertEqual(result["activity_type"], "concert")

    def test_maps_club_musica_category(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="CLUB DE MUSICA EN VIVO")
        result = self.provider.parse_record(row)
        self.assertEqual(result["category"], "Entretenimiento")
        self.assertEqual(result["activity_type"], "concert")
        self.assertEqual(result["score_base"], 78)

    def test_centro_cultural_is_free(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="CENTRO CULTURAL")
        result = self.provider.parse_record(row)
        self.assertTrue(result["is_free"])

    def test_museo_is_free_none(self):
        row = _make_csv_row(FUNCION_PRINCIPAL="MUSEO")
        result = self.provider.parse_record(row)
        self.assertIsNone(result["is_free"])


class NormalizeUrlTests(TestCase):
    def test_keeps_https_url_intact(self):
        self.assertEqual(_normalize_url("https://example.com"), "https://example.com")

    def test_adds_https_to_bare_domain(self):
        self.assertEqual(_normalize_url("WWW.EXAMPLE.COM"), "https://WWW.EXAMPLE.COM")

    def test_empty_string_returns_empty(self):
        self.assertEqual(_normalize_url(""), "")

    def test_strips_whitespace(self):
        self.assertEqual(_normalize_url("  https://example.com  "), "https://example.com")

    def test_truncates_to_200(self):
        long_url = "https://example.com/" + "x" * 300
        self.assertLessEqual(len(_normalize_url(long_url)), 200)


class NormalizeNameTests(TestCase):
    def test_title_cases_all_caps(self):
        self.assertEqual(_normalize_name("TEATRO COLON"), "Teatro Colon")

    def test_preserves_mixed_case(self):
        self.assertEqual(_normalize_name("Teatro Colón"), "Teatro Colón")

    def test_handles_empty_string(self):
        self.assertEqual(_normalize_name(""), "")


class GCBAFetchCSVTests(TestCase):
    def setUp(self):
        self.provider = GCBAProvider()

    @patch("apps.integrations.providers.gcba.requests.get")
    def test_returns_parsed_rows_on_success(self, mock_get):
        csv_content = (
            "fid,FUNCION_PRINCIPAL,SUBCATEGORIA,ESTABLECIMIENTO,FUNCION_SECUNDARIA,"
            "PROGRAMACION,SUCURSAL,SALA,CALLE,ALTURA,BARRIO,COMUNA,DIRECCION,"
            "LONGITUD,LATITUD,TELEFONO,MAIL,WEB,,FACEBOOK,TWITTER,INSTAGRAM,"
            "CAMARA_1,CAMARA_2,REDES,PUNTO_DE_CULTURA,OTRAS_REDES,CANTIDAD_SALAS,"
            "CAPACIDAD_TOTAL,TAG\n"
            "1,MUSEO,,MALBA,,,,,,,,,"
            "AV. FIGUEROA ALCORTA 3415 CABA,"
            "-58.4098,-34.5761,4808-6500,,https://malba.org.ar,,,,,,,,,,,,\n"
        )
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.content = csv_content.encode("utf-8")
        mock_get.return_value = mock_resp

        rows = self.provider.fetch_csv()
        self.assertEqual(len(rows), 1)

    @patch("apps.integrations.providers.gcba.requests.get")
    def test_returns_empty_on_network_error(self, mock_get):
        import requests as req_lib
        mock_get.side_effect = [
            req_lib.exceptions.ConnectionError("timeout"),
            req_lib.exceptions.ConnectionError("timeout"),
        ]
        with patch("apps.integrations.providers.gcba.time.sleep"):
            rows = self.provider.fetch_csv()
        self.assertEqual(rows, [])

    @patch("apps.integrations.providers.gcba.requests.get")
    def test_fetch_and_parse_filters_unwanted_categories(self, mock_get):
        csv_content = (
            "fid,FUNCION_PRINCIPAL,SUBCATEGORIA,ESTABLECIMIENTO,FUNCION_SECUNDARIA,"
            "PROGRAMACION,SUCURSAL,SALA,CALLE,ALTURA,BARRIO,COMUNA,DIRECCION,"
            "LONGITUD,LATITUD,TELEFONO,MAIL,WEB,,FACEBOOK,TWITTER,INSTAGRAM,"
            "CAMARA_1,CAMARA_2,REDES,PUNTO_DE_CULTURA,OTRAS_REDES,CANTIDAD_SALAS,"
            "CAPACIDAD_TOTAL,TAG\n"
            "1,MUSEO,,MALBA,,,,,,,,,AV. FIGUEROA ALCORTA,-58.41,-34.57,,,,,,,,,,,,,,\n"
            "2,LIBRERIA,,EL ATENEO,,,,,,,,,SANTA FE,-58.39,-34.59,,,,,,,,,,,,,,\n"
            "3,BAR,,CAFE TORTONI,,,,,,,,,AV. DE MAYO,-58.38,-34.61,,,,,,,,,,,,,,\n"
        )
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.content = csv_content.encode("utf-8")
        mock_get.return_value = mock_resp

        results = self.provider.fetch_and_parse()
        # Only MUSEO should pass (LIBRERIA and BAR are filtered out)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["category"], "Museo")


class GCBADedupTests(TestCase):
    def test_deduplication_by_external_id(self):
        from apps.activities.models import Activity
        from apps.integrations.providers.gcba import GCBAProvider

        provider = GCBAProvider()
        row = _make_csv_row(fid="777", FUNCION_PRINCIPAL="MUSEO", ESTABLECIMIENTO="MUSEO TEST")
        parsed = provider.parse_record(row)
        self.assertIsNotNone(parsed)

        external_id = parsed.pop("external_id")
        obj1, created1 = Activity.objects.update_or_create(
            external_id=external_id, defaults=parsed
        )
        self.assertTrue(created1)

        # Re-import with updated address
        parsed["address"] = "NUEVA DIRECCION 123"
        obj2, created2 = Activity.objects.update_or_create(
            external_id=external_id, defaults=parsed
        )
        self.assertFalse(created2)
        self.assertEqual(obj1.pk, obj2.pk)
        obj2.refresh_from_db()
        self.assertEqual(obj2.address, "NUEVA DIRECCION 123")
