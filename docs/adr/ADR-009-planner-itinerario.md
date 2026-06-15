# ADR-009: Planner de Itinerario Inteligente

## Estado
Aceptado — implementado en Sprint 7

## Contexto

Sprint 7 introduce el Planner Inteligente: dada una fecha, presupuesto, cantidad de personas y ciudad, el backend genera un itinerario de 3 slots (mañana, tarde, noche) combinando lugares, actividades y eventos.

Se tomaron decisiones sobre: cómo manejar el clima para fechas futuras, cómo modelar el flujo de estados del plan, y cómo generar una razón explicativa por ítem.

---

## Decisiones

### 1. Regla de clima: ≤5 días → API real; >5 días → lógica neutral

**Problema:** OpenWeather (free tier) sólo provee clima actual y forecast de hasta 5 días. Para fechas más lejanas no hay datos fiables.

**Decisión:**
- Si `(plan_date - today).days <= 5` y el usuario tiene coordenadas: se consulta `openweather_provider.get_current_weather()`.
- Si `delta_days > 5`: `is_outdoor_friendly = None` → el motor de recomendaciones aplica modificador climático = 0 (neutral).

**Consecuencia:** Para planes a más de 5 días, el scoring no penaliza ni premia actividades outdoor/indoor basado en clima. Es el comportamiento más honesto dado que no hay datos.

---

### 2. Plan.status workflow

**Problema:** Un plan puede ser creado vacío (manualmente) o generado automáticamente. Además el usuario puede marcarlo como completado o cancelado.

**Decisión:** Campo `status` con 4 valores:

| Status | Descripción |
|--------|-------------|
| `draft` | Plan creado manualmente sin itinerario generado |
| `generated` | Plan con itinerario generado automáticamente |
| `completed` | Usuario marcó el plan como completado |
| `cancelled` | Plan cancelado |

El endpoint `generate/` siempre crea con `status="generated"`. El endpoint `POST /plans/` (manual) crea con `status="draft"`. El usuario puede actualizar status vía `PATCH`.

---

### 3. PlanItem.generation_reason

**Problema:** El usuario necesita entender por qué se eligió un ítem concreto para su plan.

**Decisión:** Campo `generation_reason` (TextField) en `PlanItem`. Se reutiliza la función `_build_reason_from_breakdown()` del motor de recomendaciones, pasándole el `score_breakdown` calculado durante `generate_plan()`.

**Consecuencia:** Los ítems generados automáticamente tienen una razón descriptiva (ej. "Coincide con tus preferencias de café, ideal para este momento del día."). Los ítems añadidos manualmente tienen `generation_reason=""`.

---

### 4. Selección de ítems por slot sin repetición

**Problema:** Al generar el plan, una entidad popular podría ser seleccionada en múltiples slots.

**Decisión:** Set `used_ids` que acumula los `entity_id` ya asignados. Al puntuar candidatos para cada slot, se excluyen los IDs ya usados. El orden de prioridad de slots es: morning → afternoon → evening.

---

### 5. Slug para link público

**Problema:** Los planes necesitan un identificador amigable para compartir sin exponer el UUID interno.

**Decisión:** Slug generado con `slugify(f"plan-{date}-{user_id[:8]}-{uuid4()[:8]}")`. No usa `python-slugify` (dependencia extra) sino `django.utils.text.slugify`, que maneja fechas alfanuméricas sin caracteres especiales. El UUID al final garantiza unicidad incluso si el mismo usuario genera dos planes para la misma fecha.

---

### 6. Endpoint público `/plans/public/{slug}/` sin autenticación

**Problema:** Un usuario debe poder compartir su plan con alguien que no tiene cuenta.

**Decisión:** `AllowAny` en el endpoint `public_plan`. Sólo retorna el plan si `is_public=True`. El usuario activa la visibilidad pública vía `PATCH /plans/{id}/` con `{"is_public": true}`.

---

## Consecuencias

- Los planes privados jamás son accesibles vía slug (el selector filtra `is_public=True`).
- La generación de planes es síncrona (no Celery) dado que tarda menos de 3 segundos con el conjunto de datos actual.
- Si en el futuro se agrega forecast de 7 días vía OpenWeather Pro, el punto de extensión es la condición `delta_days <= 5` en `generate_plan()`.
