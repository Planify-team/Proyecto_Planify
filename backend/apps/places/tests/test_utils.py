from datetime import datetime
from django.test import TestCase

from apps.places.utils import OpeningHoursParser


def _dt(weekday: int, hour: int, minute: int = 0) -> datetime:
    """Return a datetime on the given ISO weekday (0=Mon) at the given time."""
    # 2026-06-15 is a Monday (weekday 0)
    base = datetime(2026, 6, 15, 0, 0)
    from datetime import timedelta
    return base + timedelta(days=weekday, hours=hour, minutes=minute)


class OpeningHoursParser24_7Test(TestCase):
    def test_always_open(self):
        self.assertTrue(OpeningHoursParser.is_open("24/7", _dt(0, 9)))
        self.assertTrue(OpeningHoursParser.is_open("24/7", _dt(6, 23)))


class OpeningHoursParserMoFrTest(TestCase):
    def test_open_on_weekday_during_hours(self):
        # Tuesday 14:00
        self.assertTrue(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(1, 14)))

    def test_open_on_monday(self):
        self.assertTrue(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(0, 10)))

    def test_open_on_friday(self):
        self.assertTrue(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(4, 18)))

    def test_closed_on_sunday(self):
        self.assertFalse(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(6, 14)))

    def test_closed_on_saturday(self):
        self.assertFalse(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(5, 14)))

    def test_closed_before_opening(self):
        self.assertFalse(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(2, 8, 59)))

    def test_closed_after_closing(self):
        self.assertFalse(OpeningHoursParser.is_open("Mo-Fr 09:00-20:00", _dt(2, 20, 1)))


class OpeningHoursParserMultiRuleTest(TestCase):
    def test_saturday_rule_applies(self):
        hours = "Mo-Fr 09:00-20:00; Sa 10:00-15:00"
        self.assertTrue(OpeningHoursParser.is_open(hours, _dt(5, 12)))

    def test_saturday_outside_range(self):
        hours = "Mo-Fr 09:00-20:00; Sa 10:00-15:00"
        self.assertFalse(OpeningHoursParser.is_open(hours, _dt(5, 16)))


class OpeningHoursParserEdgeCasesTest(TestCase):
    def test_empty_string_returns_none(self):
        self.assertIsNone(OpeningHoursParser.is_open(""))

    def test_unrecognized_format_returns_none(self):
        self.assertIsNone(OpeningHoursParser.is_open("PH off"))
        self.assertIsNone(OpeningHoursParser.is_open("by appointment only"))

    def test_no_exception_on_garbage(self):
        result = OpeningHoursParser.is_open("!@#$%^&*()")
        self.assertIsNone(result)

    def test_mo_su_all_days(self):
        self.assertTrue(OpeningHoursParser.is_open("Mo-Su 10:00-22:00", _dt(6, 15)))
        self.assertTrue(OpeningHoursParser.is_open("Mo-Su 10:00-22:00", _dt(0, 10)))
