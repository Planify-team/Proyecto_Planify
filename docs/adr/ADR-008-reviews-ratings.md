# ADR-008 — Sistema de Reviews & Ratings con entidad genérica

## Estado

Aprobado — Sprint 6

## Contexto

Planify necesita permitir a los usuarios dejar reseñas (texto + estrellas 1-5) sobre Places, Activities y Events. El modelo debe ser:

- Extensible a nuevos tipos de entidad sin migraciones adicionales.
- Eficiente en queries (sin N+1 al listar cards).
- Simple de mantener (una tabla, no tres).

## Decisión

### Modelo genérico con entity_type + entity_id

En lugar de crear `PlaceReview`, `ActivityReview` y `EventReview` por separado, se usa un único modelo `Review` con:

```python
entity_type = CharField(choices=["place", "activity", "event"])
entity_id   = UUIDField()
```

Esto permite agregar soporte para nuevos tipos (ej. `"promotion"`) sin nuevas tablas ni migraciones.

### Restricción única por usuario/entidad

```python
unique_together = [("user", "entity_type", "entity_id")]
```

Un usuario puede tener una sola reseña por entidad. El servicio usa `update_or_create` para implementar upsert transparente.

### Anotaciones con Subquery para evitar N+1

Las listas de Places/Activities/Events anotan `avg_rating` y `review_count` usando Django `Subquery` + `OuterRef`:

```python
avg_sub = Review.objects.filter(entity_type="place", entity_id=OuterRef("id"))
    .values("entity_id").annotate(a=Avg("stars")).values("a")[:1]
qs = qs.annotate(avg_rating=Subquery(avg_sub), ...)
```

Esto resuelve el cálculo en una sola query SQL con subselects, sin N+1.

## Alternativas descartadas

- **Tres tablas separadas**: más migraciones, más código duplicado, sin beneficio en queries.
- **FK nullable a cada entidad**: dificulta agregar futuros tipos, viola principio Open/Closed.
- **Cache Redis por entidad**: complejidad innecesaria para el volumen actual.

## Consecuencias

- Un solo `Review` model en `apps.reviews`.
- Los serializers de Place/Activity/Event incluyen `avg_rating` y `review_count` como `SerializerMethodField` con `getattr(obj, "avg_rating", None)` para no romper si el selector no anota.
- La API expone: POST `/reviews/`, GET `/reviews/{type}/{id}/`, DELETE `/reviews/{type}/{id}/delete/`.
