# ADR-016: Enriquecimiento de Datos de Lugares

**Estado:** Aprobado  
**Fecha:** 2026-06-16  
**Sprint:** 10

---

## Contexto

Hasta Sprint 9, un lugar de OSM en Planify tenía únicamente nombre, categoría, dirección, coordenadas, teléfono y sitio web. Esta información es suficiente para mostrar el lugar en un mapa pero no permite al usuario tomar una decisión informada (¿está abierto ahora? ¿tiene terraza? ¿cuánto cuesta entrar?).

OSM ya tiene esta información en sus nodos — el problema era que no la capturábamos.

---

## Decisiones

### 1. Capturar campos OSM directamente (no enriquecimiento con API externa)

**Decisión:** Leer `opening_hours`, `cuisine`, `fee`, `outdoor_seating`, `wheelchair`, `internet_access`, `description` de los tags OSM en `_parse_elements()`.

**Alternativas descartadas:**
- Yelp API / Google Places: costo por request, requiere key, viola el principio de gratuidad del sprint.
- Wikipedia / Wikidata: solo disponible para lugares con artículo; cobertura muy baja en ciudades medianas.

**Motivo:** OSM es la fuente de todos nuestros datos de lugares (`source="osm"`). Es consistente y gratuito.

---

### 2. `description` auto-generada como fallback (no dejar vacía)

**Decisión:** Si OSM no provee `description` ni `note`, `_auto_description()` genera un texto desde los datos disponibles (cuisine, category, city, fee, outdoor_seating).

**Alternativas descartadas:**
- Dejar `description` vacía: el usuario no entiende qué es el lugar.
- Usar IA para generar descripciones: costo por token, latencia, fuera del alcance del sprint.

**Motivo:** Una descripción auto-generada ("Pizzería en Buenos Aires") es significativamente más útil que una cadena vacía.

---

### 3. `is_open_now` calculado en el serializer (no almacenado en DB)

**Decisión:** `is_open_now` es un campo calculado en `PlaceSerializer.get_is_open_now()` usando `OpeningHoursParser`.

**Alternativas descartadas:**
- Almacenar `is_open_now` en DB y actualizar con Celery: inconsistente (depende del timezone del usuario), costoso de mantener.
- Calcular en el frontend: viola la regla de que el backend es el source of truth.

**Motivo:** El horario es relativo al momento de la consulta; recalcular en cada request es correcto y no costoso.

---

### 4. `OpeningHoursParser` — soporte parcial de formato OSM

**Decisión:** Soportar únicamente `24/7` y `Mo-Fr/Mo-Su/individual HH:MM-HH:MM`. Retornar `None` para formatos complejos (PH, SH, semanas específicas).

**Motivo:** Un parser completo (con soporte de feriados) requiere una librería externa (`opening-hours-parser`). Agregar dependencias sin evaluar el impacto es una violación del principio de modularidad del ORCHESTRATOR.md. Sprint 11 puede agregar el parser completo.

---

## Campos nuevos en el modelo `Place`

| Campo | Tipo | Fuente |
|---|---|---|
| `opening_hours` | CharField(500) | OSM `opening_hours` tag |
| `cuisine` | CharField(200) | OSM `cuisine` tag |
| `fee` | BooleanField(null) | OSM `fee` tag → `_parse_bool_tag()` |
| `outdoor_seating` | BooleanField(null) | OSM `outdoor_seating` tag |
| `wheelchair` | CharField(20) | OSM `wheelchair` tag |
| `internet_access` | BooleanField(null) | OSM `internet_access` o `wifi` tag |
| `is_open_now` | calculado | `OpeningHoursParser.is_open(opening_hours)` |

---

## Consecuencias

- Los lugares OSM nuevos tienen datos enriquecidos inmediatamente.
- Los lugares OSM existentes en DB se enriquecen la próxima vez que se re-sincroniza su zona (cada 24h).
- `is_open_now` puede ser `null` para la mayoría de los lugares en la primera carga (OSM tiene cobertura parcial de `opening_hours`).
