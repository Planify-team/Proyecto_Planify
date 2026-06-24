import logging
from collections import Counter
from datetime import datetime, timezone as dt_timezone

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

BAD_CONDITIONS = {"Rain", "Drizzle", "Thunderstorm", "Snow", "Fog", "Mist", "Haze"}
CACHE_TTL = 900  # 15 minutes
FORECAST_CACHE_TTL = 10800  # 3 hours

DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


class OpenWeatherProvider:
    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
    TIMEOUT = 10

    def get_current_weather(self, latitude: float, longitude: float) -> dict | None:
        lat_r = round(latitude, 2)
        lon_r = round(longitude, 2)
        cache_key = f"weather:{lat_r}:{lon_r}"

        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        api_key = getattr(settings, "OPENWEATHER_API_KEY", "")
        if not api_key:
            return None

        try:
            resp = requests.get(
                self.BASE_URL,
                params={"lat": lat_r, "lon": lon_r, "appid": api_key, "units": "metric"},
                timeout=self.TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()

            condition = data["weather"][0]["main"]
            temp = data["main"]["temp"]
            result = {
                "temperature": round(temp, 1),
                "feels_like": round(data["main"]["feels_like"], 1),
                "condition": condition,
                "humidity": data["main"]["humidity"],
                "wind_speed": round(data["wind"]["speed"], 1),
                "clouds": data.get("clouds", {}).get("all", 0),
                "is_outdoor_friendly": condition not in BAD_CONDITIONS and temp >= 10,
            }
            cache.set(cache_key, result, CACHE_TTL)
            return result

        except Exception as exc:
            logger.warning("OpenWeatherProvider error [%s,%s]: %s", lat_r, lon_r, exc)
            return None


    def get_forecast(self, latitude: float, longitude: float) -> list[dict] | None:
        lat_r = round(latitude, 2)
        lon_r = round(longitude, 2)
        cache_key = f"forecast:{lat_r}:{lon_r}"

        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        api_key = getattr(settings, "OPENWEATHER_API_KEY", "")
        if not api_key:
            return None

        try:
            resp = requests.get(
                self.FORECAST_URL,
                params={"lat": lat_r, "lon": lon_r, "appid": api_key, "units": "metric", "cnt": 40},
                timeout=self.TIMEOUT,
            )
            resp.raise_for_status()
            items = resp.json().get("list", [])

            by_day: dict[str, list] = {}
            for item in items:
                dt = datetime.fromtimestamp(item["dt"], tz=dt_timezone.utc)
                day_str = dt.strftime("%Y-%m-%d")
                by_day.setdefault(day_str, []).append(item)

            result = []
            for day_str, entries in sorted(by_day.items()):
                temps = [e["main"]["temp"] for e in entries]
                conditions = [e["weather"][0]["main"] for e in entries]
                condition = Counter(conditions).most_common(1)[0][0]

                noon_entry = min(entries, key=lambda e: abs(
                    datetime.fromtimestamp(e["dt"], tz=dt_timezone.utc).hour - 12
                ))
                description = noon_entry["weather"][0].get("description", "")
                precip = sum(e.get("rain", {}).get("3h", 0) for e in entries)

                day_obj = datetime.strptime(day_str, "%Y-%m-%d")
                result.append({
                    "date": day_str,
                    "day_name": DAY_NAMES_ES[day_obj.weekday()],
                    "condition": condition,
                    "description": description,
                    "temp_min": round(min(temps), 1),
                    "temp_max": round(max(temps), 1),
                    "precipitation_mm": round(precip, 1),
                    "is_outdoor_friendly": condition not in BAD_CONDITIONS and max(temps) >= 12,
                })

            result = result[:5]
            cache.set(cache_key, result, FORECAST_CACHE_TTL)
            return result

        except Exception as exc:
            logger.warning("OpenWeatherProvider.get_forecast error [%s,%s]: %s", lat_r, lon_r, exc)
            return None


openweather_provider = OpenWeatherProvider()
