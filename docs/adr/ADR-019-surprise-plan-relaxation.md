# ADR-019: Relajación Progresiva en el Plan Sorpresa

**Estado:** Aprobado  
**Fecha:** 2026-06-16  
**Sprint:** 11

---

## Contexto

El Plan Sorpresa (`generate_surprise_plan`) generaba planes vacíos cuando el usuario no tenía historial o cuando la ciudad configurada tenía pocos candidatos que pasaran los filtros de budget y people. Un plan vacío es la peor experiencia posible: el usuario hizo clic en "Sorprendeme" y no obtuvo nada.

---

## Decisiones

### 1. Relajación progresiva en 3 fases

**Decisión:** Intentar candidatos en 3 fases de restricción decreciente, usando la primera que produzca al menos 1 resultado.

```
Fase 1 (strict):  city + budget <= budget_per_slot + min_people <= people_count
Fase 2 (relaxed): city only — sin filtro de budget ni people
Fase 3 (minimal): sin filtros geográficos — pool completo
```

**Motivo:**
- La Fase 3 siempre tiene candidatos (hay al menos 61 actividades sembradas para Buenos Aires).
- Las fases 1 y 2 preservan la relevancia geográfica cuando hay candidatos suficientes.
- El usuario recibe algo útil en lugar de un error o pantalla vacía.

**Alternativa descartada: "fallar limpio" con mensaje de error**
- Un mensaje de error en "Sorprendeme" rompe la promesa de la feature.
- El usuario no sabe qué ajustar — no tiene preferencias configuradas ni historial.

**Alternativa descartada: relajar todo el plan de una vez**
- Relajar por slot permite que cada slot use la fase más estricta posible.
- Ejemplo: si hay actividades en la ciudad para mañana (Fase 1) pero no para la noche (Fase 2), el resultado final combina ambas — no hace falta degradar todo el plan.
- En la implementación actual, por simplicidad, se relaja por plan completo — si la Fase 1 produce al menos 1 slot, se usa ese resultado. Si no, intenta Fase 2 completa.

---

### 2. `phase_label` en `generation_reason` para trazabilidad

**Decisión:** Cuando se usa Fase 2 o Fase 3, el `generation_reason` incluye un prefijo indicando la relajación.

```
[Sugerencia fuera de tu rango de presupuesto habitual] Coincide con tus preferencias.
[Plan genérico — configurá tu ciudad para mejores resultados] Actividad popular.
```

**Motivo:**
- Ayuda a depurar en desarrollo por qué un plan usó relajación.
- Puede mostrarse al usuario como contexto (futuro: "Ampliamos el rango para encontrar opciones").
- No afecta la funcionalidad — es solo metadata en el reason string.

---

### 3. Extracción de `_collect_candidates` y `_pick_slots`

**Decisión:** Refactorizar `generate_plan` para que use helpers internos que `generate_surprise_plan` también puede llamar directamente.

**Motivo:**
- Evita crear N planes en DB para probar N fases (lo cual generaría audit trails sucios).
- La lógica de selección de candidatos y selección de slots ahora es reutilizable.
- `generate_plan` mantiene el mismo comportamiento externo — solo la implementación interna cambia.

---

## Consecuencias

- `generate_surprise_plan()` nunca levanta excepción por falta de candidatos.
- El plan resultante puede tener 0 items si la BD está completamente vacía (borde extremo).
- Los logs de producción muestran en qué fase se generó cada surprise plan.
- El refactor de `generate_plan` hace el código de servicios más testeable — `_collect_candidates` y `_pick_slots` son funciones puras (dado un contexto de BD).
