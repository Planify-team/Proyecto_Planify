# ADR-012: Recommendation Engine V3 — Feedback Loop Integration

## Estado
Aceptado — implementado en Sprint 8

## Contexto

Sprint 7 (V2) introdujo modificadores contextuales (tiempo, día, distancia). Sprint 8 extiende el motor con feedback explícito del usuario vía `PlanFeedback`.

---

## Decisiones

### 1. Función _feedback_score(entity_id, entity_type) → float [-25, +25]

**Implementación:**
```python
def _feedback_score(entity_id: str, entity_type: str) -> float:
    feedbacks = PlanFeedback.objects.filter(
        entity_type=entity_type, entity_id=entity_id
    ).values_list("rating", flat=True)
    if not feedbacks:
        return 0
    total = 0.0
    for r in feedbacks:
        if r == 5:    total += 25
        elif r >= 4:  total += 12
        elif r == 3:  total += 5
        elif r == 2:  total -= 10
        else:         total -= 25
    return max(-25, min(25, total / len(feedbacks)))
```

**Por qué promedio y no suma:** Una entidad con 100 ratings de 1 no debe tener penalización infinita. El promedio normaliza el impacto independientemente del volumen.

**Por qué [-25, +25]:** El rango permite influencia significativa pero no dominante. El score base de una entidad va de 0 a 100; un feedback de +25 puede elevar una entidad promedio al top pero no puede hacer que una entidad mediocre supere a una excelente.

---

### 2. Integración en generate_recommendations_for_user y generate_plan

**Decisión:** `_feedback_score` se llama para cada activity, event y place en ambos motores:
- `generate_recommendations_for_user()` — recomendaciones personalizadas
- `generate_plan()` — generación de itinerarios

El score se añade al total: `score = max(0, min(100, ... + feedback_s))`

**score_breakdown:** Se exponen dos claves separadas para debugging:
- `"feedback_bonus"`: `max(0, feedback_s)` — la parte positiva
- `"feedback_penalty"`: `min(0, feedback_s)` — la parte negativa

---

### 3. Acciones de InteractionHistory que alimentan V3

| Acción | Efecto en recomendaciones |
|--------|--------------------------|
| `plan_feedback` | Score ±25 vía `_feedback_score` |
| `plan_viewed` | +0.05 vía `_interaction_score_v2` (peso `view`) |
| `plan_shared` | No afecta score (solo auditoría) |

---

## Consecuencias

- El feedback es global por entidad, no personal. Si muchos usuarios califican mal un lugar, afecta las recomendaciones para todos.
- Esto es intencional: el feedback colectivo actúa como señal de calidad agregada, similar a un rating público.
- En el futuro, se podría pesar el feedback por usuario (`personal_feedback_score`) si se quiere personalización más granular.
- Cada llamada a `_feedback_score` hace una query DB. Con muchas entidades podría ser un bottleneck; la optimización natural sería cachear los scores en Redis con TTL de 1 hora (pendiente para Sprint 9+).
