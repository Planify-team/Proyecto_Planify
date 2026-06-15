# ADR-011: Planner Feedback Loop

## Estado
Aceptado — implementado en Sprint 8

## Contexto

Sprint 8 introduce el ciclo de feedback sobre ítems del plan: el usuario puede calificar cada entidad (lugar, actividad, evento) de un plan completado. Este feedback alimenta el motor de recomendaciones V3.

---

## Decisiones

### 1. Modelo PlanFeedback con unique_together

**Modelo:**
```python
class PlanFeedback(models.Model):
    plan = FK(Plan)
    user = FK(User)
    entity_type = CharField  # "place" | "activity" | "event"
    entity_id = UUIDField
    rating = IntegerField (1-5)
    comment = TextField (blank=True)
    
    class Meta:
        unique_together = ("plan", "user", "entity_type", "entity_id")
```

**Por qué unique_together:** Un usuario puede cambiar su calificación de un ítem dentro del mismo plan, pero no puede tener dos calificaciones distintas al mismo tiempo. Se usa `update_or_create` para idempotencia.

---

### 2. Ownership check en create_plan_feedback

**Decisión:** `create_plan_feedback` verifica `plan.user != user` antes de persistir. Si el plan no pertenece al usuario, lanza `PermissionDenied`.

**Por qué en el servicio y no en la view:** La view ya usa `get_plan_by_id(plan_id, user=request.user)` que filtra por owner (retorna None si no es el dueño). La validación en el servicio es una segunda línea de defensa para uso programático.

---

### 3. Extensión de Plan.status con "planned"

**Decisión:** Se agrega el estado `"planned"` al workflow de estados:

| Status | Descripción |
|--------|-------------|
| `draft` | Plan vacío creado manualmente |
| `generated` | Plan con itinerario generado |
| `planned` | Usuario confirmó que ejecutará el plan |
| `completed` | Plan marcado como completado (feedback habilitado) |
| `cancelled` | Plan cancelado |

---

### 4. Tracking de plan_viewed y plan_shared

**Decisión:** Se registran dos nuevas acciones en `InteractionHistory`:
- `plan_viewed`: cuando un usuario autenticado abre un plan público ajeno.
- `plan_shared`: cuando el propietario comparte su plan (endpoint `POST /plans/{id}/share/`).

Estas acciones se propagan al motor de recomendaciones V3 para favorecer entidades que el usuario ha visto o compartido.

---

## Consecuencias

- El feedback es opcional. Un usuario puede completar planes sin dejar calificaciones.
- El feedback de rating 5 suma hasta +25 puntos en el score de recomendación. Rating 1 descuenta -25.
- Si el usuario no ha dado feedback, `_feedback_score()` retorna 0 (neutro).
