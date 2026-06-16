# ADR-017: Pronóstico de 5 Días con OpenWeather

**Estado:** Aprobado  
**Fecha:** 2026-06-16  
**Sprint:** 10

---

## Contexto

Planify ya tenía clima actual (`GET /api/v1/weather/current/`) pero no pronóstico. El usuario que quiere planear una salida del sábado necesita saber si va a llover ese día, no si llueve ahora.

---

## Decisiones

### 1. Usar el endpoint `/forecast` de OpenWeather Free (no One Call API)

**Decisión:** `GET https://api.openweathermap.org/data/2.5/forecast?cnt=40` — pronóstico cada 3 horas × 5 días = 40 registros.

**Alternativas descartadas:**
- One Call API 3.0: requiere suscripción de pago.
- Open-Meteo (gratuito, sin key): buena opción pero agregar una dependencia nueva cuando ya tenemos OpenWeather activo y funcionando viola el principio de no agregar complejidad innecesaria.

**Motivo:** El endpoint `/forecast` está incluido en el plan gratuito de OpenWeather. Ya tenemos la API key configurada y el provider funcionando.

---

### 2. Agrupar por día en el backend (no enviar raw al frontend)

**Decisión:** El backend procesa los 40 registros de 3h y devuelve exactamente 5 dicts (uno por día) con `temp_min`, `temp_max`, `condition` (moda), `description` (mediodía), `precipitation_mm`, `is_outdoor_friendly`.

**Alternativas descartadas:**
- Enviar los 40 registros raw al frontend y que el frontend agrupe: viola el principio de que el backend es el source of truth; fuerza lógica de negocio en el frontend.

**Motivo:** El backend es el único lugar donde debe vivir la lógica de procesamiento de datos.

---

### 3. Caché de 3 horas en Redis

**Decisión:** `FORECAST_CACHE_TTL = 10800` (3 horas).

**Motivo:** El pronóstico cambia más frecuentemente que el clima actual (15 min), pero sigue siendo estable por horas. 3h es el TTL recomendado por OpenWeather para el endpoint `/forecast`.

---

### 4. Permiso `IsAuthenticated`

**Decisión:** El endpoint requiere autenticación.

**Motivo:** Consistente con `/weather/current/`. Evita abuso del API key por usuarios anónimos.

---

## Endpoint

```
GET /api/v1/weather/forecast/?lat={lat}&lon={lon}
```

Respuesta: lista de 5 objetos `ForecastDay`.

---

## Consecuencias

- El usuario puede ver el pronóstico de la semana desde `PlannerPage` y `PlanDetailPage`.
- Las llamadas a OpenWeather para `/forecast` se cachean en Redis por 3h — el límite de 60 requests/min del plan gratuito no se verá afectado en uso normal.
- Si la API key no está configurada o el servicio falla, el endpoint devuelve 503.
