# SPRINT_10.md

# Sprint 10 — Datos Ricos y Contexto Climático

## Estado

```txt
SPRINT_10_STATUS: PLANNED
```

---

## 1. Objetivo del Sprint

Convertir los lugares de Planify en entidades con contexto real, no solo nombres y coordenadas.

Hasta Sprint 9, un lugar de OpenStreetMap en Planify tenía: nombre, categoría, dirección y coordenadas. Eso es suficiente para mostrarlo en un mapa pero no para que el usuario tome una decisión. Sprint 10 responde a la pregunta: ¿qué información necesita un usuario para elegir ir a un lugar?

Al terminar este sprint, un usuario puede:

- Ver si un lugar está **abierto ahora mismo** (horario de apertura real de OSM).
- Leer una **descripción útil** del lugar — qué tipo de cocina sirve, si tiene terraza, si la entrada es paga.
- Planear una salida del fin de semana mirando el **pronóstico de 5 días** directamente en la app antes de generar su plan.
- Filtrar lugares por si tienen **terraza exterior**, **entrada libre** o **acceso para sillas de ruedas**.
- Ver el pronóstico del día del plan en la **página de detalle del plan**, no solo el clima actual.

---

## 2. Alcance

### Incluido

- Migración de `Place` con campos nuevos: `opening_hours`, `cuisine`, `fee`, `outdoor_seating`, `wheelchair`, `internet_access`.
- `description` de `Place` enriquecido: se captura de OSM cuando existe y se auto-genera como fallback inteligente.
- `OverpassProvider` actualizado para capturar y almacenar todos los tags nuevos.
- Endpoint de pronóstico del tiempo: `GET /api/v1/weather/forecast/?lat=&lon=`.
- Propiedad calculada `is_open_now` en el serializer de Place (sin dependencia de librerías externas).
- Filtros nuevos en `GET /api/v1/places/`: `outdoor_seating`, `fee`, `wheelchair`, `cuisine`.
- Frontend: `PlaceCard` y `PlaceDetailPage` actualizados con los nuevos datos.
- Frontend: `WeatherForecastWidget` — 5 días como cards horizontales.
- Frontend: pronóstico visible en `PlannerPage` (antes de generar el plan) y en `PlanDetailPage`.
- Frontend: filtros nuevos en `ExplorePage`.
- Tests backend y frontend para todos los cambios.
- ADR-016, ADR-017 y documentación actualizada.

### Excluido

- Parser completo de formato OSM `opening_hours` (e.g. "Mo-Fr 09:00-20:00; PH off") — se muestra la cadena cruda de OSM y `is_open_now` se calcula solo para el formato simple. Parser completo con librería especializada queda para Sprint 11.
- Reservas online o integración con sistemas de turnos.
- Fotos de lugares desde OSM/Wikimedia (requiere API separada de Wikimedia Commons).
- Notificaciones push cuando un lugar favorito está abierto.
- Importar pronóstico en el motor de recomendaciones V3 (ya usa clima actual — extenderlo a pronóstico es Sprint 11).

---

## 3. Módulos a implementar

| Módulo | Prioridad |
|---|---|
| Migración Place — campos nuevos | Alta |
| Overpass actualizado — captura tags enriquecidos | Alta |
| Serializer + filtros nuevos en places API | Alta |
| Endpoint forecast 5 días (OpenWeather) | Alta |
| is_open_now calculado en serializer | Media |
| Description auto-generada como fallback | Media |
| Frontend: PlaceCard y PlaceDetailPage enriquecidos | Alta |
| Frontend: WeatherForecastWidget | Alta |
| Frontend: PlannerPage + PlanDetailPage con pronóstico | Media |
| Frontend: filtros nuevos en ExplorePage | Media |
| Tests backend + frontend | Alta |
| ADRs + docs | Alta |

---

## 4. Bloque 1 — Migración de Place con campos enriquecidos

### Objetivo

Darle al modelo `Place` la capacidad de almacenar la información real que OSM ya tiene pero que nunca capturamos.

---

### Campos nuevos en `apps/places/models.py`

```txt
opening_hours     CharField(max_length=500, blank=True, default="")
  — string crudo de OSM: "Mo-Fr 09:00-20:00; Sa 10:00-15:00"

cuisine           CharField(max_length=200, blank=True, default="")
  — tipo de cocina para restaurantes: "pizza", "argentinian", "sushi"
  — puede ser múltiple separado por ";": "italian;pizza"

fee               BooleanField(null=True, blank=True)
  — True: entrada paga / False: gratis / None: desconocido

outdoor_seating   BooleanField(null=True, blank=True)
  — True: tiene terraza o mesas afuera / False: solo interior / None: desconocido

wheelchair        CharField(max_length=20, blank=True, default="")
  — "yes" | "limited" | "no" | "" (desconocido)

internet_access   BooleanField(null=True, blank=True)
  — True: tiene wifi / False: no / None: desconocido
```

`description` ya existe en el modelo (`TextField`, `blank=True`). En Sprint 10 se comienza a poblar desde OSM y con fallback auto-generado.

---

### Migración

```txt
python manage.py makemigrations places --name="place_enriched_fields"
python manage.py migrate
```

Los campos son todos opcionales (`blank=True`, `null=True` donde corresponde). No rompen datos existentes.

---

## 5. Bloque 2 — Overpass actualizado: captura de tags enriquecidos

### Objetivo

Aprovechar toda la información que OSM ya tiene en cada nodo. La mayoría de los restaurantes, bares y atracciones turísticas de Buenos Aires en OSM tienen al menos `opening_hours` y `cuisine` cargados.

---

### Cambios en `providers/overpass.py`

Actualizar `_parse_elements()` para extraer los nuevos tags:

```txt
opening_hours  → tags.get("opening_hours", "")
cuisine        → tags.get("cuisine", "")
fee            → _parse_bool_tag(tags.get("fee"))
outdoor_seating → _parse_bool_tag(tags.get("outdoor_seating"))
wheelchair     → tags.get("wheelchair", "")
internet_access → _parse_bool_tag(tags.get("internet_access") or tags.get("wifi"))
description    → tags.get("description") or tags.get("note") or ""
```

Nueva función helper:

```python
def _parse_bool_tag(value: str | None) -> bool | None:
    if value in ("yes", "true", "1"):
        return True
    if value in ("no", "false", "0"):
        return False
    return None
```

---

### Cambios en `services.py`

Actualizar `_upsert_places()` para persistir los nuevos campos:

```txt
defaults = {
    ...campos existentes...,
    "opening_hours": item.get("opening_hours", ""),
    "cuisine": item.get("cuisine", ""),
    "fee": item.get("fee"),
    "outdoor_seating": item.get("outdoor_seating"),
    "wheelchair": item.get("wheelchair", ""),
    "internet_access": item.get("internet_access"),
    "description": item.get("description", "") or _auto_description(item),
}
```

Nueva función `_auto_description(item: dict) -> str`:

```txt
Si el item no tiene description de OSM, generar una desde los datos disponibles:

Ejemplos:
  cuisine="pizza"             → "Pizzería en {city}"
  cuisine="sushi"             → "Restaurante de sushi en {city}"
  outdoor_seating=True        → "{categoria} con terraza exterior"
  category="Parque"           → "Espacio verde en {city}"
  fee=False, category="Museo" → "Museo de entrada gratuita"
  fee=True,  category="Cine"  → "Cine en {city}"

Fallback final:
  "{category} en {city}"       — siempre tiene city porque lo capturamos de addr:city
```

---

## 6. Bloque 3 — Serializer y filtros enriquecidos

### Objetivo

Exponer los nuevos campos en la API y permitir filtrarlos desde el frontend.

---

### Cambios en `apps/places/serializers.py`

Agregar al `PlaceSerializer`:

```txt
opening_hours     — string, puede ser ""
cuisine           — string, puede ser ""
fee               — bool | null
outdoor_seating   — bool | null
wheelchair        — string ("yes" | "limited" | "no" | "")
internet_access   — bool | null
is_open_now       — bool | null (campo calculado, no almacenado)
```

#### Cálculo de `is_open_now`

Campo de solo lectura calculado en el serializer:

```python
def get_is_open_now(self, obj) -> bool | None:
    if not obj.opening_hours:
        return None
    return OpeningHoursParser.is_open(obj.opening_hours)
```

`OpeningHoursParser` — clase nueva en `apps/places/utils.py`:

```txt
Soporta los formatos más comunes de OSM:
  "24/7"                            → siempre abierto
  "Mo-Fr 09:00-20:00"               → lunes a viernes
  "Mo-Fr 09:00-20:00; Sa 10:00-15:00" → múltiples reglas
  "Mo-Su 10:00-22:00"               → todos los días

No soporta (retorna None en lugar de fallar):
  Formatos con feriados (PH, SH)
  Formatos con semanas específicas
  Formatos con condiciones especiales

Siempre captura excepción y retorna None si el formato no es reconocido.
```

---

### Cambios en `apps/places/views.py`

Nuevos filtros en `PlaceViewSet.get_queryset()`:

```txt
?outdoor_seating=true     → filter(outdoor_seating=True)
?outdoor_seating=false    → filter(outdoor_seating=False)
?fee=false                → filter(fee=False)
?fee=true                 → filter(fee=True)
?wheelchair=yes           → filter(wheelchair="yes")
?wheelchair=limited       → filter(wheelchair__in=["yes","limited"])
?cuisine=pizza            → filter(cuisine__icontains="pizza")
?open_now=true            → filter en Python post-query (no se puede hacer en SQL sin lógica de horario)
```

---

## 7. Bloque 4 — Pronóstico de 5 días (OpenWeather)

### Objetivo

El usuario quiere saber si va a llover el sábado antes de armar su plan. La app tiene el clima actual pero no el pronóstico. Este bloque agrega los próximos 5 días con la misma API que ya tenemos activa.

---

### Backend

Nuevo método en `providers/openweather.py`:

```python
def get_forecast(self, lat: float, lon: float) -> list[dict] | None:
```

Endpoint de OpenWeather a usar:

```txt
GET https://api.openweathermap.org/data/2.5/forecast
  ?lat={lat}&lon={lon}&appid={key}&units=metric&cnt=40
```

La API devuelve pronóstico en intervalos de 3 horas (8 por día × 5 días = 40 puntos).

Procesamiento:

```txt
Agrupar por fecha (day)
Por cada día calcular:
  temp_min     → mínimo de todos los registros del día
  temp_max     → máximo de todos los registros del día
  condition    → condición más frecuente del día (moda)
  description  → descripción del registro del mediodía (12:00)
  is_outdoor_friendly → True si condition not in BAD_CONDITIONS AND temp_max >= 12
  precipitation_mm → suma de lluvia del día (rain.3h)

Retornar lista de 5 dicts ordenados por fecha
```

Caché Redis: 3 horas (el pronóstico cambia con más frecuencia que el clima actual).

---

### Nuevo endpoint

```txt
GET /api/v1/weather/forecast/
```

Parámetros requeridos:

```txt
?lat={float}
?lon={float}
```

Respuesta:

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-06-17",
      "day_name": "Martes",
      "condition": "Clear",
      "description": "cielo despejado",
      "temp_min": 11.2,
      "temp_max": 21.5,
      "precipitation_mm": 0.0,
      "is_outdoor_friendly": true
    },
    { "date": "2026-06-18", ... },
    { "date": "2026-06-19", ... },
    { "date": "2026-06-20", ... },
    { "date": "2026-06-21", ... }
  ]
}
```

Permiso: `IsAuthenticated`

---

### Agregar URL

```txt
GET /api/v1/weather/forecast/  →  WeatherForecastView
```

En `weather_urlpatterns` de `integrations/urls.py`.

---

## 8. Bloque 5 — Frontend enriquecido

### Objetivo

Mostrar al usuario toda la información nueva de manera clara y accionable.

---

### 8.1 Tipo `Place` actualizado (`types/index.ts`)

```typescript
interface Place {
  // ...campos existentes...
  opening_hours: string
  cuisine: string
  fee: boolean | null
  outdoor_seating: boolean | null
  wheelchair: string
  internet_access: boolean | null
  is_open_now: boolean | null
  description: string  // ya existía, ahora siempre tiene valor
}
```

---

### 8.2 `PlaceCard` actualizado

Agregar debajo del nombre y categoría:

```txt
Fila de badges visuales:
  — "Abierto ahora" (verde) / "Cerrado" (rojo) si is_open_now no es null
  — "Con terraza" si outdoor_seating === true
  — "Entrada libre" si fee === false
  — "Wifi" si internet_access === true

Si cuisine está definida:
  — mostrar debajo de la categoría: "Cocina italiana · Con terraza"
```

---

### 8.3 `PlaceDetailPage` actualizado

Sección nueva "Información del lugar":

```txt
Horario:    {opening_hours raw string}  o  "Sin información de horario"
Tipo:       {cuisine}                  (solo para Gastronomía)
Entrada:    Gratuita / Paga / —
Terraza:    Sí / No / —
Wifi:       Disponible / No / —
Acceso:     Apto / Limitado / No apto / —   (wheelchair)
```

Descripción visible como párrafo introductorio arriba de la sección de reseñas.

---

### 8.4 `WeatherForecastWidget` (nuevo componente)

```txt
Ubicación: src/components/ui/WeatherForecastWidget.tsx

Diseño: 5 cards horizontales (scroll en mobile)
Por card:
  — Día abreviado: "Mar", "Mié", "Jue"...
  — Ícono de condición (sol, nube, lluvia, etc.) — usando emoji o lucide-react
  — Temperatura máxima y mínima
  — Badge "Ideal para salir" (verde) o "Mejor adentro" (gris) según is_outdoor_friendly

Props:
  forecast: ForecastDay[]
  isLoading: boolean
```

---

### 8.5 `PlannerPage` con pronóstico

```txt
Posición: entre el WeatherWidget (clima actual) y el formulario de generación

Lógica:
  — Si el usuario tiene ubicación activa → mostrar pronóstico
  — El usuario puede ver de un vistazo qué días de la semana son buenos para salir
  — Al elegir fecha en el formulario → resaltar el día en el forecast widget
```

Nuevo hook: `useForecast(coords: { lat, lon } | null)`

---

### 8.6 `PlanDetailPage` con pronóstico

```txt
Mostrar forecast del día del plan como card colapsable:
  "El {fecha del plan} se espera: {condition}, {temp_max}° / {temp_min}°"
  Badge: "Ideal para salir" o "Llevá paraguas"

Solo mostrar si el plan.date >= hoy (no tiene sentido para planes pasados)
```

---

### 8.7 Filtros nuevos en `ExplorePage`

En el panel de filtros de "Lugares":

```txt
Checkbox "Solo con terraza"      → outdoor_seating=true
Checkbox "Entrada gratuita"      → fee=false
Checkbox "Acceso en silla"       → wheelchair=yes o limited
Input    "Tipo de cocina"        → cuisine=pizza
```

---

## 9. Testing obligatorio

### Backend

```txt
apps/places/tests/test_places.py (extensión)
  — PlaceSerializer incluye is_open_now como null si no tiene opening_hours
  — PlaceSerializer incluye is_open_now=True para "24/7"
  — PlaceSerializer incluye is_open_now calculado para "Mo-Fr 09:00-20:00"
  — GET /places/?outdoor_seating=true retorna solo lugares con terraza
  — GET /places/?fee=false retorna solo lugares con entrada libre
  — GET /places/?cuisine=pizza retorna solo lugares con esa cocina

apps/places/tests/test_utils.py (nuevo)
  — OpeningHoursParser: "24/7" → True siempre
  — OpeningHoursParser: "Mo-Fr 09:00-20:00" → True en martes 14:00
  — OpeningHoursParser: "Mo-Fr 09:00-20:00" → False en domingo 14:00
  — OpeningHoursParser: formato no reconocido → None (sin excepción)

apps/integrations/tests/test_overpass.py (extensión)
  — _parse_bool_tag("yes") → True
  — _parse_bool_tag("no") → False
  — _parse_bool_tag(None) → None
  — _parse_elements captura opening_hours del tag OSM
  — _parse_elements captura cuisine del tag OSM
  — _auto_description genera texto para place sin description

apps/integrations/tests/test_weather.py (extensión)
  — GET /weather/forecast/ requiere autenticación
  — GET /weather/forecast/ sin params → 400
  — GET /weather/forecast/ con coords válidas → 200 con lista de 5 días
  — Cada día tiene: date, condition, temp_min, temp_max, is_outdoor_friendly
  — Resultado cacheado en Redis (mock llama al provider solo una vez)
```

### Frontend

```txt
PlaceCard.test.tsx (extensión)
  — muestra badge "Abierto ahora" si is_open_now=true
  — muestra badge "Cerrado" si is_open_now=false
  — no muestra badge de estado si is_open_now=null
  — muestra "Con terraza" si outdoor_seating=true
  — muestra "Entrada libre" si fee=false

WeatherForecastWidget.test.tsx (nuevo)
  — renderiza 5 cards de pronóstico
  — muestra "Ideal para salir" si is_outdoor_friendly=true
  — muestra "Mejor adentro" si is_outdoor_friendly=false
  — muestra skeleton/loading cuando isLoading=true

PlaceDetailPage.test.tsx (nuevo o extensión)
  — muestra la sección "Información del lugar"
  — muestra description si no está vacía
  — muestra "Sin información de horario" si opening_hours=""
```

---

## 10. Criterios de aceptación

### Datos enriquecidos de lugares

- Los lugares importados de OSM muestran horario de apertura cuando OSM lo tiene disponible.
- `is_open_now` devuelve `true` o `false` para lugares con horario reconocible, `null` para el resto.
- La `description` nunca está vacía para lugares OSM — si OSM no la provee, se auto-genera.
- Los filtros `outdoor_seating`, `fee`, `cuisine` funcionan correctamente en `GET /api/v1/places/`.
- `PlaceCard` muestra los badges de estado (abierto/cerrado, terraza, entrada libre) sin afectar la performance de la lista.

### Pronóstico del tiempo

- `GET /api/v1/weather/forecast/` devuelve exactamente 5 días a partir de hoy.
- Cada día incluye `temp_min`, `temp_max`, `condition` y `is_outdoor_friendly`.
- El forecast está cacheado en Redis por 3 horas.
- `WeatherForecastWidget` es visible en `PlannerPage` cuando el usuario tiene ubicación activa.
- `PlanDetailPage` muestra el pronóstico del día del plan para planes futuros.

### Calidad general

- Todos los tests pasan (backend + frontend).
- TypeScript sin errores.
- Los nuevos campos de Place tienen migración limpia que no rompe datos existentes.
- Docker funciona sin cambios adicionales de configuración.

---

## 11. Documentación a actualizar

```txt
DATA_MODEL.md
  — Agregar campos nuevos de Place: opening_hours, cuisine, fee, outdoor_seating, wheelchair, internet_access
  — Documentar is_open_now como campo calculado (no almacenado)

API_GUIDELINES.md
  — Documentar GET /api/v1/weather/forecast/ con ejemplo de response
  — Documentar filtros nuevos en GET /api/v1/places/

docs/adr/ADR-016-place-enrichment.md
  — Decisión: capturar campos OSM directamente vs enriquecimiento con API externa
  — Decisión: description auto-generada como fallback vs dejar vacío
  — Decisión: is_open_now calculado en serializer vs almacenado en DB

docs/adr/ADR-017-weather-forecast.md
  — Decisión: usar /forecast de OpenWeather Free vs pagar por One Call API
  — Decisión: agrupar por día en backend vs enviar raw 3h al frontend
  — Caché de 3h vs mayor frecuencia
```

---

## 12. Definition of Done

Sprint 10 estará completo cuando:

- Los nuevos campos de `Place` tienen migración y están disponibles en el serializer.
- `OverpassProvider` captura `opening_hours`, `cuisine`, `fee`, `outdoor_seating`, `wheelchair`, `internet_access` y `description` de los tags OSM.
- `is_open_now` se calcula correctamente para los formatos OSM más comunes.
- `_auto_description` genera una descripción útil para lugares sin texto en OSM.
- `GET /api/v1/weather/forecast/` devuelve 5 días correctamente formateados.
- `WeatherForecastWidget` es visible y funcional en `PlannerPage` y `PlanDetailPage`.
- `PlaceCard` y `PlaceDetailPage` muestran los campos nuevos.
- Los filtros nuevos (`outdoor_seating`, `fee`, `cuisine`) funcionan en `ExplorePage`.
- Todos los tests pasan — backend y frontend.
- TypeScript sin errores.
- ADR-016 y ADR-017 documentados.

---

## 13. Fuera de alcance

```txt
Parser completo de opening_hours OSM con soporte de feriados y semanas específicas
Fotos de lugares desde Wikimedia Commons
Integración de pronóstico en el motor de recomendaciones V3
Notificaciones push cuando un lugar favorito abre
Reservas o sistema de turnos
Reviews de lugares importados desde Google/Yelp
```

---

## 14. Salida esperada

```txt
SPRINT_10_STATUS: RICH_DATA_AND_FORECAST
```

Al finalizar Sprint 10, Planify tendrá:

- Lugares con **información real y accionable**: horario, tipo de cocina, terraza, precio de entrada.
- **Descripción de cada lugar** — el usuario entiende qué es el lugar antes de decidir ir.
- **Pronóstico de 5 días** integrado al flujo de planificación — el usuario elige el día con mejor clima antes de generar su plan.
- Filtros más potentes que hacen que la búsqueda de lugares sea significativamente más útil.

---

## 15. Próximo Sprint

```txt
SPRINT_11

Candidatos:
  — Parser completo de opening_hours con soporte de feriados
  — Integración del pronóstico en el motor de recomendaciones V3
  — Sistema de reservas básico
  — OAuth (login con Google)
```
