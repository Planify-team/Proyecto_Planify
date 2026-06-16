# API_GUIDELINES.md

# Guía de Diseño de APIs

## 1. Principio

Las APIs de Planify deben ser:

- consistentes;
- predecibles;
- seguras;
- documentadas;
- versionadas;
- orientadas a recursos.

El backend es el único responsable de validar permisos, reglas de negocio y acceso a datos.

---

## 2. Convenciones de naming

Usar sustantivos en plural:

```txt
/api/v1/users/
/api/v1/events/
/api/v1/places/
/api/v1/activities/
/api/v1/promotions/
/api/v1/favorites/
/api/v1/notifications/
/api/v1/recommendations/
```

Evitar nombres ambiguos:

```txt
/api/do_stuff/
/api/process/
/api/data/
/api/getInfo/
```

Usar nombres descriptivos y alineados con el dominio.

---

## 3. Métodos HTTP

| Método | Uso |
|----------|----------|
| GET | Lectura |
| POST | Creación o acción controlada |
| PUT | Reemplazo completo |
| PATCH | Actualización parcial |
| DELETE | Eliminación lógica o controlada |

---

## 4. Endpoints principales del sistema

### Autenticación

```txt
POST /api/v1/auth/register/
POST /api/v1/auth/login/
POST /api/v1/auth/logout/
POST /api/v1/auth/refresh/
GET  /api/v1/auth/me/
```

### Usuarios

```txt
GET    /api/v1/users/
GET    /api/v1/users/{id}/
PATCH  /api/v1/users/{id}/
DELETE /api/v1/users/{id}/
```

### Eventos

```txt
GET    /api/v1/events/
GET    /api/v1/events/{id}/
POST   /api/v1/events/
PATCH  /api/v1/events/{id}/
DELETE /api/v1/events/{id}/
```

### Lugares

```txt
GET    /api/v1/places/
GET    /api/v1/places/{id}/
POST   /api/v1/places/
PATCH  /api/v1/places/{id}/
DELETE /api/v1/places/{id}/
```

### Actividades

```txt
GET /api/v1/activities/
GET /api/v1/activities/{id}/
```

### Promociones

```txt
GET    /api/v1/promotions/
GET    /api/v1/promotions/{id}/
POST   /api/v1/promotions/
PATCH  /api/v1/promotions/{id}/
DELETE /api/v1/promotions/{id}/
```

### Favoritos

```txt
GET    /api/v1/favorites/
POST   /api/v1/favorites/
DELETE /api/v1/favorites/{id}/
```

### Notificaciones

```txt
GET /api/v1/notifications/
```

### Recomendaciones

```txt
GET  /api/v1/recommendations/
POST /api/v1/recommendations/click/
```

### Reviews

```txt
POST   /api/v1/reviews/                              — Crear o actualizar reseña (auth)
GET    /api/v1/reviews/{entity_type}/{entity_id}/   — Listar reseñas de una entidad (público)
DELETE /api/v1/reviews/{entity_type}/{entity_id}/delete/ — Eliminar propia reseña (auth)
```

`entity_type` puede ser: `place`, `activity`, `event`.

### Planes (Planner)

```txt
POST   /api/v1/plans/generate/                       — Generar itinerario automático (auth)
GET    /api/v1/plans/                                — Listar planes propios (auth)
POST   /api/v1/plans/                                — Crear plan vacío (auth)
GET    /api/v1/plans/{id}/                           — Ver plan propio (auth)
PATCH  /api/v1/plans/{id}/                           — Actualizar plan: is_public, status, title (auth)
DELETE /api/v1/plans/{id}/                           — Eliminar plan propio (auth)
POST   /api/v1/plans/{id}/items/                     — Agregar ítem al plan (auth)
DELETE /api/v1/plans/{id}/items/{item_id}/           — Quitar ítem del plan (auth)
GET    /api/v1/plans/public/{slug}/                  — Ver plan público sin autenticación (AllowAny)
```

`generate/` acepta: `date`, `budget`, `people_count`, `city`. Devuelve el plan con 3 ítems (morning/afternoon/evening).
Regla de clima: `date ≤ 5 días desde hoy` → real OpenWeather; `date > 5 días` → lógica neutral.

### Búsqueda global

```txt
GET /api/v1/search/?q={query}
```

Retorna resultados agrupados: `{ places: [...], activities: [...], events: [...] }` (máximo 10 por tipo).

### Trending

```txt
GET /api/v1/trending/
```

Retorna entidades más agregadas a favoritos en los últimos 30 días. Máximo 6 por tipo.

### Clima

```txt
GET /api/v1/weather/current/?lat={lat}&lon={lon}
```

Respuesta exitosa: `{"success": true, "data": {"temperature": 18, "feels_like": 16, "condition": "Clear", "is_outdoor_friendly": true, ...}}`

Fallback (API caída o sin key): `{"success": true, "data": null}`

```txt
GET /api/v1/weather/forecast/?lat={lat}&lon={lon}
```

Devuelve pronóstico de 5 días agrupado por día. Requiere autenticación. Cacheado 3h en Redis.

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-06-17",
      "day_name": "Miércoles",
      "condition": "Clear",
      "description": "cielo despejado",
      "temp_min": 10.0,
      "temp_max": 22.0,
      "precipitation_mm": 0.0,
      "is_outdoor_friendly": true
    }
  ]
}
```

### Lugares externos

```txt
GET /api/v1/external/places/?lat={lat}&lon={lon}&radius={m}&type={type}
GET /api/v1/external/places/search/?q={query}&lat={lat}&lon={lon}
```

Ambos endpoints devuelven el mismo formato que `/api/v1/places/` incluyendo campos enriquecidos de Sprint 10. El campo `source` indica el origen ('internal' o 'osm').

### Filtros nuevos en `/api/v1/places/` (Sprint 10)

```txt
?outdoor_seating=true|false   → lugares con/sin terraza exterior
?fee=true|false               → lugares con entrada paga o gratuita
?wheelchair=yes|limited       → accesibilidad en silla de ruedas
?cuisine={tipo}               → tipo de cocina (icontains)
?open_now=true                → solo lugares abiertos ahora (filtro post-query en Python)
```

---

## 5. Acciones especiales

Para acciones de dominio utilizar rutas explícitas.

### Eventos

```txt
POST /api/v1/events/{id}/publish/
POST /api/v1/events/{id}/cancel/
```

### Promociones

```txt
POST /api/v1/promotions/{id}/activate/
POST /api/v1/promotions/{id}/cancel/
```

### Favoritos

```txt
POST /api/v1/places/{id}/favorite/
POST /api/v1/events/{id}/favorite/
```

### Recordatorios

```txt
POST /api/v1/events/{id}/reminder/
```

---

## 6. Motor de recomendaciones

El endpoint principal de recomendaciones deberá aceptar filtros contextuales.

Ejemplo:

```txt
GET /api/v1/recommendations/?budget=5000&people=4&distance=10
```

Filtros soportados:

- presupuesto;
- categoría;
- cantidad de personas;
- distancia;
- edad;
- horario;
- tipo de actividad;
- indoor / outdoor.

El backend combinará:

- ubicación;
- clima;
- preferencias;
- historial;
- filtros explícitos.

---

## 7. Paginación

Todo listado grande debe paginarse.

Formato estándar:

```json
{
  "count": 120,
  "next": "https://api.planify.com/api/v1/events/?page=2",
  "previous": null,
  "results": []
}
```

---

## 8. Filtros

Los filtros deben ser explícitos.

Ejemplo:

```txt
/api/v1/events/?category=music
/api/v1/events/?city=buenos-aires
/api/v1/events/?date_from=2026-01-01
/api/v1/events/?date_to=2026-01-31

/api/v1/places/?category=restaurant
/api/v1/places/?distance=10

/api/v1/promotions/?active=true
```

No utilizar filtros ocultos.

---

## 9. Ordenamiento

Se deberá soportar ordenamiento cuando sea aplicable.

Ejemplo:

```txt
/api/v1/events/?ordering=date
/api/v1/events/?ordering=-date

/api/v1/places/?ordering=distance
/api/v1/places/?ordering=rating
```

---

## 10. Respuesta exitosa

Formato estándar:

```json
{
  "success": true,
  "data": {}
}
```

---

## 11. Errores

Formato estándar:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No se pudo completar la operación.",
    "details": {
      "field": [
        "Mensaje específico"
      ]
    }
  }
}
```

---

## 12. Códigos HTTP

| Código | Significado |
|----------|----------|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido |
| 400 | Error de validación |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | Recurso inexistente |
| 429 | Rate limit |
| 500 | Error interno |

---

## 13. Versionado

Toda API debe comenzar en:

```txt
/api/v1/
```

Si una modificación rompe compatibilidad:

```txt
/api/v2/
```

No se modifican contratos existentes sin versionar.

---

## 14. Seguridad

- Todos los endpoints privados requieren JWT.
- Los permisos deben validarse en backend.
- Validar ownership cuando corresponda.
- No exponer campos sensibles.
- Aplicar rate limiting a endpoints públicos.
- Auditar acciones críticas.
- Sanitizar entradas del usuario.
- Nunca confiar en datos enviados por el frontend.

---

## 15. Integraciones externas

Las APIs externas nunca serán consumidas directamente desde el frontend.

Todas las integraciones deberán pasar por el backend.

Integraciones previstas:

- Google Maps API
- Google Places API
- OpenWeather API
- Ticketmaster API
- OAuth Google

---

## 16. Documentación

Cada endpoint debe documentar:

- propósito;
- permisos requeridos;
- request;
- response;
- errores posibles;
- filtros;
- paginación;
- side effects;
- eventos auditables.

---

## 17. Checklist antes de crear un endpoint

- ¿Ya existe un endpoint similar?
- ¿Respeta naming?
- ¿Respeta la arquitectura?
- ¿Tiene permisos?
- ¿Tiene validaciones?
- ¿Tiene tests?
- ¿Está documentado?
- ¿Respeta RBAC?
- ¿Genera auditoría cuando corresponde?
- ¿Puede reutilizarse en el futuro?

---

## 18. Regla de oro

> Ningún endpoint debe implementar lógica de negocio compleja fuera de la capa de Services definida en ARCHITECTURE.md.