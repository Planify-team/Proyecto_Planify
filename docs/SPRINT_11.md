# SPRINT_11.md

# Sprint 11 — Datos Reales, Fuentes Externas y Plan Sorpresa Inteligente

## Estado

```txt
SPRINT_11_STATUS: REAL_DATA_SOURCES_AND_SMART_SURPRISE
```

---

## 1. Objetivo del Sprint

Hacer que Planify genere planes con datos reales y variados, no solo los 61 lugares sembrados manualmente.

Hasta Sprint 10, Planify tiene una base de datos de actividades curada a mano y lugares importados de OpenStreetMap. Es funcional pero limitado: el catálogo de actividades no se actualiza, la cobertura es incompleta y el Plan Sorpresa usa los mismos datos que el plan normal sin ninguna lógica diferenciadora.

Sprint 11 responde a tres preguntas concretas:

1. ¿De dónde sacamos datos reales y actualizados de Buenos Aires sin depender de scraping?
2. ¿Cómo enriquecemos las actividades existentes con coordenadas, fotos y URLs?
3. ¿Cómo hace el Plan Sorpresa para siempre generar algo, incluso con restricciones estrictas?

Al terminar este sprint, Planify tiene:

- **GCBA Open Data** integrado — datos oficiales del GCBA: teatros, centros culturales, deportivos, bibliotecas, espacios verdes (gratis, en español, mantenidos por el gobierno).
- **OpenTripMap** como fuente secundaria de enriquecimiento — POIs con fotos y descripciones.
- **Modelo Activity enriquecido** — lat/lon, address, is_free, external_url, image_url, source, external_id.
- **Plan Sorpresa con relajación progresiva** — siempre genera algo útil aunque no haya candidatos perfectos.
- **Tests cubriendo los nuevos flujos**.

---

## 2. Alcance

### Incluido

- Campos nuevos en `Activity`: `latitude`, `longitude`, `address`, `is_free`, `external_url`, `image_url`, `source`, `external_id`.
- Migración limpia de `Activity` (campos opcionales, retrocompatible).
- `GCBAProvider` — cliente para el portal de datos abiertos del GCBA (CKAN/SODA API).
- Management command `seed_gcba` — importa y deduplica datasets del GCBA a Activity.
- `OpenTripMapProvider` — cliente de enriquecimiento con foto y descripción para actividades existentes.
- Management command `enrich_activities_opentripmap` — enriquece actividades con imagen y descripción desde OpenTripMap.
- `generate_surprise_plan()` con relajación progresiva (3 fases: filtros estrictos → ciudad → sin filtro).
- Serializer de `Activity` con los nuevos campos.
- Tests backend para provider GCBA, relajación progresiva y campos nuevos.
- ADR-018, ADR-019.

### Excluido

- Ticketmaster (evaluar cobertura en Argentina primero — queda como candidato de Sprint 12).
- Wikidata (relación effort/valor demasiado baja para el MVP de Buenos Aires).
- ActivitySource como modelo separado — se usa `source` CharField más simple.
- Parser completo de `opening_hours` OSM (quedó fuera de Sprint 10, sigue pendiente).
- Sistema de reservas o ticketing.
- Login con OAuth.

---

## 3. Módulos a implementar

| Módulo | Prioridad |
|---|---|
| Migración Activity — campos enriquecidos | Alta |
| GCBAProvider + seed_gcba command | Alta |
| OpenTripMapProvider + enrich command | Media |
| generate_surprise_plan con relajación progresiva | Alta |
| Activity serializer con campos nuevos | Alta |
| Tests backend | Alta |
| ADRs | Media |

---

## 4. Bloque 1 — Activity enriquecido

### Objetivo

Que las actividades puedan vivir de manera autónoma: con coordenadas propias (para mostrar en mapa sin depender de un Place), URL de referencia, foto y fuente trazable para deduplicación.

---

### Campos nuevos en `apps/activities/models.py`

```txt
latitude      DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
              — coordenada lat propia, independiente de place

longitude     DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
              — coordenada lon propia

address       CharField(max_length=300, blank=True, default="")
              — dirección en texto: "Av. del Libertador 1473, Palermo"

is_free       BooleanField(null=True, blank=True)
              — True: gratuita / False: paga / None: desconocida

external_url  URLField(blank=True, default="")
              — link a la página oficial o fuente de información

image_url     URLField(blank=True, default="")
              — foto representativa (OpenTripMap o GCBA)

source        CharField(max_length=50, blank=True, default="manual", db_index=True)
              — "manual", "gcba", "opentripmap"
              — permite saber el origen y re-sincronizar selectivamente

external_id   CharField(max_length=200, blank=True, default="", db_index=True)
              — ID en el sistema externo — para deduplicación al re-importar
              — formato: "{source}:{id_en_fuente}"
```

`source` se indexa para poder hacer `Activity.objects.filter(source="gcba")` eficientemente al re-sincronizar.

`external_id` permite evitar duplicados en `update_or_create(external_id=..., defaults={...})`.

---

### Migración

```txt
python manage.py makemigrations activities --name="activity_enriched_fields"
python manage.py migrate
```

Todos los campos son opcionales. Los 61 registros existentes quedan con `source="manual"`, `external_id=""`, campos vacíos — sin romper nada.

---

## 5. Bloque 2 — GCBA Open Data

### Objetivo

Importar datos reales del gobierno de la Ciudad de Buenos Aires. El GCBA publica decenas de datasets en `data.buenosaires.gob.ar` bajo licencia abierta: teatros, centros culturales, polideportivos, bibliotecas, espacios verdes, museos municipales. Son gratuitos, en español y se actualizan periódicamente.

---

### Por qué GCBA vs otras fuentes

| Fuente | Datos BA | Gratis | En español | Actualizados |
|---|---|---|---|---|
| GCBA Open Data | ✓ | ✓ | ✓ | ✓ |
| OSM/Overpass | Parcial | ✓ | No | Variable |
| OpenTripMap | Parcial | Limitado | No | Variable |
| Ticketmaster | Solo eventos | Sí | No | ✓ |
| Wikidata | Wikipedia-level | ✓ | No | Variable |

---

### `GCBAProvider` — `apps/integrations/providers/gcba.py`

```python
BASE_URL = "https://data.buenosaires.gob.ar/api/3/action/datastore_search"

DATASETS = {
    "teatros": {
        "resource_id": "teatros-y-salas-culturales",
        "category": "Cultura",
        "activity_type": "concert",
        "name_field": "nombre",
        "address_field": "direccion",
        "lat_field": "lat",
        "lon_field": "long",
        "description_field": "descripcion",
        "url_field": "url",
    },
    "centros_culturales": {
        "resource_id": "centros-culturales",
        "category": "Cultura",
        "activity_type": "tourism",
        ...
    },
    "deportivos": {
        "resource_id": "establecimientos-deportivos",
        "category": "Deporte",
        "activity_type": "sports",
        ...
    },
    "bibliotecas": {
        "resource_id": "bibliotecas-populares-y-especializadas",
        "category": "Cultura",
        "activity_type": "tourism",
        ...
    },
    "museos": {
        "resource_id": "museos-y-espacios-de-arte",
        "category": "Museo",
        "activity_type": "museum",
        ...
    },
}

class GCBAProvider:
    def fetch_dataset(self, dataset_key: str, limit: int = 500) -> list[dict]:
        ...
    def parse_record(self, record: dict, dataset_config: dict) -> dict | None:
        ...
```

Cada record se convierte a un dict con:

```txt
{
  "name": str,
  "description": str,
  "category": str,
  "activity_type": str,
  "address": str,
  "latitude": float | None,
  "longitude": float | None,
  "external_url": str,
  "external_id": "gcba:{id}",
  "source": "gcba",
  "is_free": None,  # GCBA no siempre informa precio
}
```

Reintentos: 2 intentos con backoff de 5s. Timeout: 15s. Sin caché (el command es un batch offline).

---

### Management command `seed_gcba`

```txt
python manage.py seed_gcba
python manage.py seed_gcba --dataset teatros
python manage.py seed_gcba --dry-run
python manage.py seed_gcba --clear-gcba  # borra los GCBA existentes antes de reimportar
```

Usa `Activity.objects.update_or_create(external_id=record["external_id"], defaults={...})`.

Salida esperada:
```txt
[gcba] teatros: 87 registros descargados, 82 importados, 5 sin coordenadas (skip)
[gcba] centros_culturales: 142 registros, 139 importados
[gcba] deportivos: 203 registros, 198 importados
Total: 419 actividades importadas de GCBA
```

---

## 6. Bloque 3 — OpenTripMap (enriquecimiento)

### Objetivo

OpenTripMap tiene fotos y descripciones en texto para POIs en Buenos Aires. No es una fuente primaria (la cobertura es inconsistente), pero es útil para enriquecer actividades que ya existen en Planify con imagen y texto.

### `OpenTripMapProvider` — `apps/integrations/providers/opentripmap.py`

```python
BASE_URL = "https://api.opentripmap.com/0.1/en/places"

class OpenTripMapProvider:
    def search_radius(self, lat: float, lon: float, radius_m: int = 500,
                      kinds: str = "cultural,amusements") -> list[dict]:
        # GET /radius?radius={}&lon={}&lat={}&kinds={}&apikey={}
        ...

    def get_details(self, xid: str) -> dict | None:
        # GET /{xid}?apikey={}  → image, wikipedia_extracts.text
        ...
```

Caché Redis: 24h para `search_radius`, 7 días para `get_details` (los detalles cambian raramente).

Rate limit: máximo 3 req/s, 500/día. El command respeta estos límites con `time.sleep(0.4)`.

### Management command `enrich_activities_opentripmap`

```txt
python manage.py enrich_activities_opentripmap
python manage.py enrich_activities_opentripmap --limit 50
python manage.py enrich_activities_opentripmap --source gcba  # solo los de GCBA
```

Algoritmo:
1. Busca actividades con `image_url=""` y `latitude__isnull=False`.
2. Para cada actividad, llama a `search_radius(lat, lon, radius_m=300)`.
3. Si encuentra un match por nombre (similitud > 0.7), llama a `get_details(xid)`.
4. Si el detalle tiene `image`, guarda `image_url`. Si tiene `wikipedia_extracts.text`, guarda en `description` solo si el description actual está vacío.
5. Marca `source = "opentripmap"` solo si antes era `""` — respeta la fuente primaria.

Salida esperada:
```txt
Procesando 419 actividades...
  [ok] MALBA → imagen encontrada
  [ok] Teatro Colón → imagen encontrada
  [skip] Clase de tango → sin match en radio 300m
Resultado: 87 actividades enriquecidas con imagen, 12 con descripción
```

---

## 7. Bloque 4 — Plan Sorpresa con relajación progresiva

### Objetivo

El Plan Sorpresa falla silenciosamente cuando el usuario no tiene historial o cuando hay pocos candidatos para la ciudad seleccionada. En lugar de devolver un plan vacío, debe intentar estrategias progresivamente más permisivas.

---

### Diseño de relajación progresiva

```txt
Fase 1 (estricta): Filtros completos
  — city match + budget <= budget_per_slot + min_people <= people_count
  — Misma lógica que generate_plan()
  — Si genera plan con ≥1 item → listo

Fase 2 (relajada): Solo ciudad
  — Sin filtro de budget ni people
  — city match conservado para coherencia geográfica
  — Si genera plan con ≥1 item → listo
  — Nota en generation_reason: "Sugerencia fuera de tu rango de presupuesto habitual"

Fase 3 (minimal): Sin filtros geográficos
  — Sin city filter — cualquier actividad o lugar de la base de datos
  — Prioriza actividades con score_base más alto
  — Siempre genera algo (hay al menos 61 actividades sembradas)
  — Nota en generation_reason: "Plan genérico — configurá tu ciudad para mejores resultados"
```

La relajación ocurre **por slot**: si el slot de mañana falla en Fase 1, intenta Fase 2 para ese slot — no descarta los slots que ya encontraron candidatos.

---

### Cambios en `apps/planner/services.py`

Nueva función interna `_collect_candidates(city, budget_per_slot, people_count, phase)`:

```python
def _collect_candidates(city, budget_per_slot, people_count, phase: int) -> list[dict]:
    """
    phase=1: city + budget + people (estricto)
    phase=2: city only
    phase=3: no filters
    """
```

`generate_surprise_plan()` actualizado:

```python
def generate_surprise_plan(user, plan_date=None) -> Plan:
    ...
    # Intenta generar con los 3 niveles de relajación
    for phase in (1, 2, 3):
        candidates = _collect_candidates(city, budget_per_slot, 1, phase)
        slot_results = _pick_slots(candidates, is_outdoor_friendly, phase)
        if slot_results:
            break  # Si al menos 1 slot tiene candidato, usar este resultado
    ...
```

---

## 8. Testing obligatorio

### Backend

```txt
apps/activities/tests/test_activity_model.py (nuevo o extensión)
  — Activity puede crearse con source="gcba" y external_id="gcba:123"
  — update_or_create por external_id deduplica correctamente
  — Activity con is_free=True se muestra correctamente en serializer

apps/integrations/tests/test_gcba.py (nuevo)
  — GCBAProvider.parse_record convierte registro GCBA a dict normalizado
  — parse_record retorna None si faltan campos obligatorios (name)
  — parse_record maneja coordenadas malformadas sin lanzar excepción
  — seed_gcba --dry-run no persiste datos
  — seed_gcba deduplica por external_id (update_or_create)

apps/planner/tests/test_surprise_plan.py (nuevo)
  — generate_surprise_plan() siempre retorna un Plan (aunque sea vacío)
  — Con candidatos disponibles en Fase 1 → plan generado con reason normal
  — Con city inválida ("XYZ") → cae a Fase 3, generation_reason contiene "genérico"
  — Sin historial de planes → usa Buenos Aires y budget de 3000

apps/planner/tests/test_planner_services.py (extensión)
  — _collect_candidates(phase=1) filtra por city y budget
  — _collect_candidates(phase=2) filtra por city, ignora budget
  — _collect_candidates(phase=3) retorna todos sin filtro
```

### Frontend (sin cambios de componentes — solo tipos)

```txt
Si Activity serializer expone nuevos campos, actualizar type Activity en types/index.ts.
No hay componentes nuevos en este sprint — el enriquecimiento mejora el backend;
el frontend ya muestra entity_name/entity_description/entity_category desde Sprint 11-pre.
```

---

## 9. Criterios de aceptación

### GCBA Open Data

- `python manage.py seed_gcba` importa al menos 3 datasets correctamente.
- Los registros sin nombre se saltan sin romper el import.
- Los registros duplicados (mismo `external_id`) se actualizan, no se crean nuevos.
- El command acepta `--dry-run` y reporta cuántos registros procesaría.
- Después de `seed_gcba`, `Activity.objects.filter(source="gcba").count() > 100`.

### Activity enriquecido

- Migración limpia: `makemigrations` + `migrate` sin errores.
- Los 61 registros manuales existentes conservan `source="manual"`.
- El serializer de Activity expone `latitude`, `longitude`, `address`, `is_free`, `external_url`, `image_url`, `source`.

### Plan Sorpresa

- `generate_surprise_plan()` nunca levanta excepción por falta de candidatos.
- Con una ciudad sin datos ("Mar del Plata"), cae a Fase 3 y genera plan igualmente.
- El `generation_reason` refleja la fase usada cuando no es Fase 1.

### Calidad general

- Todos los tests pasan — backend.
- TypeScript sin errores si se actualiza `Activity` type en frontend.
- Docker funciona sin cambios adicionales de configuración.

---

## 10. Documentación a actualizar

```txt
DATA_MODEL.md
  — Agregar campos nuevos de Activity: latitude, longitude, address, is_free,
    external_url, image_url, source, external_id

docs/adr/ADR-018-gcba-open-data.md
  — Decisión: GCBA vs Ticketmaster vs Wikidata como fuente primaria de BA
  — Decisión: usar CKAN/SODA API vs scraping vs Google Places
  — Por qué ActivitySource model fue descartado en favor de source CharField

docs/adr/ADR-019-surprise-plan-relaxation.md
  — Decisión: relajación progresiva vs "fallar limpio" cuando no hay candidatos
  — Las 3 fases y sus trade-offs
  — Por qué relajar por slot vs relajar todo el plan de una vez
```

---

## 11. Definition of Done

Sprint 11 estará completo cuando:

- `Activity` tiene los 8 campos nuevos con migración limpia.
- `GCBAProvider` existe y `seed_gcba` importa al menos 3 datasets.
- Después de `seed_gcba`, la app tiene > 100 actividades de fuente GCBA.
- `OpenTripMapProvider` existe y `enrich_activities_opentripmap` enriquece imágenes.
- `generate_surprise_plan()` usa relajación progresiva y nunca falla por falta de candidatos.
- Los tests de `test_gcba.py` y `test_surprise_plan.py` pasan.
- TypeScript sin errores.
- ADR-018 y ADR-019 documentados.

---

## 12. Fuera de alcance

```txt
Ticketmaster — evaluar cobertura Argentina en Sprint 12
Wikidata — descartado por relación effort/valor
ActivitySource modelo separado — reemplazado por source CharField
Parser completo de opening_hours OSM
OAuth / login con Google
Sistema de reservas
Frontend de actividades GCBA (Sprint 12 — por ahora se consumen via planner)
```

---

## 13. Próximo Sprint (candidatos)

```txt
SPRINT_12

Candidatos:
  — Frontend de actividades: página de exploración de actividades
  — Ticketmaster: evaluar cobertura y agregar si > 50 eventos/mes en BA
  — OAuth: login con Google (mayor fricción de onboarding resuelta)
  — Parser completo de opening_hours con soporte de feriados argentinos
  — Maps: mostrar actividades GCBA en mapa junto a lugares OSM
```

---

## 14. Salida esperada

```txt
SPRINT_11_STATUS: REAL_DATA_SOURCES_AND_SMART_SURPRISE
```

Al finalizar Sprint 11, Planify tiene:

- **Datos reales del gobierno porteño** — cientos de actividades de fuente oficial.
- **Actividades con coordenadas, fotos y URLs** — suficiente para mostrarlas en mapa y en cards completas.
- **Plan Sorpresa que siempre funciona** — relajación progresiva garantiza que el usuario siempre recibe algo útil.
- **Fuente trazable** — cada actividad sabe de dónde viene, lo que permite re-sincronizar y deduplicar.
