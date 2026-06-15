# SPRINT_6.md

# Sprint 6 — Reseñas, Reputación y Descubrimiento

## 1. Objetivo del Sprint

Darle vida social a Planify mediante un sistema de reseñas y calificaciones, y mejorar radicalmente la capacidad de descubrimiento con búsqueda full-text, filtros avanzados, sección trending y tab "Cerca de mí".

Al terminar este sprint, un usuario puede:
- Calificar y reseñar cualquier lugar, actividad o evento.
- Ver qué es popular entre otros usuarios.
- Buscar por nombre cualquier contenido de la app.
- Filtrar por precio, modalidad y distancia.
- Descubrir qué tiene cerca usando su ubicación.

---

## 2. Alcance

### Incluido

- Sistema de Reviews & Ratings (stars 1-5 + texto, uno por usuario por entidad).
- Endpoint de Trending (top favoriteados últimos 30 días).
- Búsqueda full-text unificada por nombre/descripción.
- Filtros avanzados en Explorar (precio, indoor/outdoor, fecha, gratuitos).
- Tab "Cerca de mí" en Explorar con orden por distancia.
- RatingBadge en cards de Explorar (promedio + cantidad).
- Sección Trending horizontal en Explorar.
- Bug fixes de auditoría (4 issues identificados en sprint anterior).

### Excluido

- Colecciones curatoriales (Sprint 7).
- Compartir plan (Sprint 7).
- Historial del usuario (Sprint 7).
- Push notifications (Sprint 9).

---

## 3. Módulos a implementar

| Módulo | Prioridad |
|--------|-----------|
| Reviews (nuevo) | Alta |
| Search (nuevo) | Alta |
| Trending (nuevo) | Alta |
| Filtros avanzados | Alta |
| Tab "Cerca de mí" | Media |
| RatingBadge en cards | Media |
| Bug fixes auditoría | Alta |

---

## 4. Backend

### Nueva app: apps.reviews

```txt
backend/apps/reviews/
  models.py       — Review(user, entity_type, entity_id, stars, text, created_at, updated_at)
  services.py     — create_or_update_review(), delete_review()
  selectors.py    — get_reviews_for_entity(), get_entity_rating(), get_user_review_for_entity()
  serializers.py  — ReviewSerializer, ReviewCreateSerializer
  views.py
  urls.py
  apps.py
  migrations/
```

### Endpoints nuevos

#### Reviews

```txt
POST   /api/v1/reviews/                                    — crear/actualizar reseña
GET    /api/v1/reviews/{entity_type}/{entity_id}/          — listar + rating promedio + mi reseña
DELETE /api/v1/reviews/{entity_type}/{entity_id}/delete/   — eliminar propia reseña
```

#### Trending

```txt
GET    /api/v1/trending/   — top-6 places/activities/events más favoriteados (últimos 30 días)
```

#### Search

```txt
GET    /api/v1/search/?q={query}   — búsqueda full-text unificada, devuelve {places, activities, events}
```

### Anotaciones en selectors existentes

- `get_active_places()`: anotar `avg_rating` y `review_count` desde `apps.reviews`.
- `get_active_places()`: soportar parámetros `lat`, `lon`, `radius_km` para filtrado por distancia (bounding box).
- `get_active_activities()`: soportar filtro `indoor`, `outdoor`, `free`.
- `get_published_events()`: soportar filtro `free` (price=0).

### Bug fixes de auditoría

- `PlaceSerializer`: agregar `source`, `external_id` a los fields.
- `PlacePermission`: agregar `has_object_permission()`, corregir llamada en `place_detail`.
- `Audit selectors`: agregar `select_related("user")` para eliminar N+1.
- `Events PATCH`: mover a `update_event()` service con audit logging.

---

## 5. Frontend

### Componentes nuevos

```txt
ReviewSection      — star picker + lista de reseñas + eliminar + mi reseña
RatingBadge        — promedio visual compacto (estrella + número + cantidad)
SearchResultsPage  — /search?q= con resultados agrupados por tipo
```

### Modificaciones

```txt
Navbar             — SearchBar global que navega a /search?q=
PlaceCard          — agrega RatingBadge
ActivityCard       — agrega RatingBadge
EventCard          — agrega RatingBadge
PlaceDetail        — agrega ReviewSection al final
ActivityDetail     — agrega ReviewSection al final
EventDetail        — agrega ReviewSection al final
ExplorePage        — agrega: Trending horizontal, tab "Cerca de mí", filtros avanzados
```

### Nuevos hooks y servicios

```txt
useReviews(entityType, entityId)
useCreateReview()
useDeleteReview()
useTrending()
useSearch(query)
reviewService.ts
```

---

## 6. Testing obligatorio

### Backend

```txt
tests/test_reviews.py     — modelo, service, permisos, unique constraint
tests/test_search.py      — búsqueda vacía, resultados, sin resultados
tests/test_trending.py    — sin favoritos, con favoritos
```

### Frontend

```txt
ReviewSection.test.tsx    — render, star picker, submit, eliminar
SearchResultsPage.test.tsx — empty state, resultados, loading
```

---

## 7. Criterios de aceptación

### Reviews

- Un usuario puede calificar con 1-5 estrellas cualquier lugar, actividad o evento.
- Solo puede tener una reseña activa por entidad (update-or-create).
- Puede eliminar su propia reseña.
- Las cards en Explorar muestran promedio + cantidad de reseñas si count > 0.
- Los detail pages muestran todas las reseñas de otros usuarios.
- Un usuario no autenticado puede ver reseñas pero no crearlas.

### Búsqueda

- Escribir "tango" devuelve lugares, actividades y eventos que contengan esa palabra.
- Resultados agrupados y navegables.
- Estado vacío claro cuando no hay resultados.

### Trending

- La sección "Más populares" aparece en Explorar cuando no hay búsqueda activa.
- Muestra los más favoriteados en los últimos 30 días.
- Se oculta si no hay favoritos registrados.

### Filtros y Cerca de mí

- En Explorar se puede filtrar activities por indoor/outdoor.
- En Explorar se puede filtrar events por gratuitos.
- El tab "Cerca de mí" requiere permiso de geolocalización y ordena por distancia.

---

## 8. Documentación a actualizar

```txt
DATA_MODEL.md          — agregar entidad Review
ARCHITECTURE.md        — agregar ADRs 005-008 al registro
API_GUIDELINES.md      — agregar endpoints /reviews/, /search/, /trending/
FOLDER_STRUCTURE.md    — agregar apps/reviews/ al árbol de backend
ORCHESTRATOR.md        — actualizar estado Sprint 6
docs/adr/ADR-008-reviews-ratings.md  — crear nuevo ADR
```

---

## 9. Definition of Done

Sprint 6 estará completo cuando:

- Todos los endpoints nuevos respondan con datos reales.
- Las migraciones de `reviews` ejecuten correctamente.
- Los bug fixes de auditoría estén aplicados y testeados.
- La búsqueda devuelva resultados correctos.
- Las reseñas aparezcan en los detail pages.
- El trending aparezca en Explorar.
- Las cards muestren el rating promedio.
- Todos los tests pasen (backend + frontend).
- TypeScript sin errores.
- Docker funcionando sin cambios de configuración.
- Documentación actualizada.

---

## 10. Salida esperada

```txt
SPRINT_6_STATUS: DISCOVERY_AND_REPUTATION
```

Al finalizar Sprint 6, Planify tendrá:

- Contenido con reputación visible (stars, conteos).
- Búsqueda que realmente funciona.
- Descubrimiento por popularidad y proximidad.
- Código de auditoría limpio.
