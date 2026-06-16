import re
from datetime import datetime


DAY_ABBR = {"Mo": 0, "Tu": 1, "We": 2, "Th": 3, "Fr": 4, "Sa": 5, "Su": 6}


def _parse_time(s: str) -> tuple[int, int] | None:
    m = re.match(r"^(\d{1,2}):(\d{2})$", s.strip())
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


def _day_range(start: str, end: str) -> set[int]:
    s, e = DAY_ABBR.get(start), DAY_ABBR.get(end)
    if s is None or e is None:
        return set()
    if s <= e:
        return set(range(s, e + 1))
    return set(range(s, 7)) | set(range(0, e + 1))


def _rule_matches(rule: str, now: datetime) -> bool | None:
    rule = rule.strip()
    if rule == "24/7":
        return True

    m = re.match(
        r"^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$",
        rule,
    )
    if not m:
        return None

    day_start, day_end, time_open, time_close = m.group(1), m.group(2), m.group(3), m.group(4)
    days = _day_range(day_start, day_end) if day_end else {DAY_ABBR.get(day_start)}
    if not days or None in days:
        return None

    current_day = now.weekday()
    if current_day not in days:
        return False

    open_t = _parse_time(time_open)
    close_t = _parse_time(time_close)
    if open_t is None or close_t is None:
        return None

    current_minutes = now.hour * 60 + now.minute
    open_minutes = open_t[0] * 60 + open_t[1]
    close_minutes = close_t[0] * 60 + close_t[1]

    if close_minutes <= open_minutes:
        return current_minutes >= open_minutes or current_minutes < close_minutes
    return open_minutes <= current_minutes < close_minutes


class OpeningHoursParser:
    @staticmethod
    def is_open(opening_hours: str, now: datetime | None = None) -> bool | None:
        if not opening_hours:
            return None
        if now is None:
            now = datetime.now()
        try:
            rules = [r.strip() for r in opening_hours.split(";") if r.strip()]
            result = None
            for rule in rules:
                match = _rule_matches(rule, now)
                if match is True:
                    return True
                if match is False:
                    result = False
            return result
        except Exception:
            return None
