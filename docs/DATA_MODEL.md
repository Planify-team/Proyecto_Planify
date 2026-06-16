# DATA_MODEL.md

# Modelo de Datos Oficial

## 1. Principio

> El modelo de datos representa el dominio de negocio de Planify.

Toda entidad, relación o modificación futura deberá respetar este documento.

La base de datos utiliza PostgreSQL como motor principal y Django ORM como capa de persistencia.

---

# 2. Convenciones generales

Todas las entidades principales deben incluir:

```txt
id
created_at
updated_at
```

Toda eliminación será lógica mediante:

```txt
is_active
```

No se realizarán eliminaciones físicas salvo casos excepcionales.

---

# 3. Diagrama conceptual

```txt
User
 ├── UserPreference
 ├── Favorite
 ├── Reminder
 ├── Notification
 ├── InteractionHistory
 └── Review

Place
 ├── Promotion
 ├── Event
 └── Activity

Event
 ├── Reminder
 └── Favorite

Activity
 └── Recommendation

Recommendation
 ├── User
 ├── Activity
 ├── Event
 └── Place

Review
 ├── User
 └── (Place | Activity | Event) via entity_type + entity_id
```

---

# 4. Entidades principales

---

## User

Representa a una persona registrada en la plataforma.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| email | String |
| password | String |
| first_name | String |
| last_name | String |
| birth_date | Date |
| role | Enum |
| profile_image | String |
| is_active | Boolean |
| created_at | DateTime |
| updated_at | DateTime |

### Relaciones

```txt
1 User → N UserPreference

1 User → N Favorite

1 User → N Reminder

1 User → N Notification

1 User → N InteractionHistory

1 User → N Recommendation
```

---

## UserPreference

Preferencias declaradas por el usuario.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| category | String |
| value | String |
| weight | Integer |

### Ejemplos

```txt
Música
Gastronomía
Cine
Outdoor
Indoor
Tecnología
Deportes
```

---

## Place

Representa un lugar físico.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| name | String |
| description | Text |
| category | String |
| address | String |
| city | String |
| latitude | Decimal |
| longitude | Decimal |
| phone | String |
| website | String |
| image_url | String |
| price_level | Integer |
| source | String (default: 'internal', valores: 'internal', 'osm') |
| external_id | String Nullable (external_id de OSM: "osm:node:{id}") |
| last_synced_at | DateTime Nullable |
| opening_hours | String (formato raw de OSM, e.g. "Mo-Fr 09:00-20:00") — Sprint 10 |
| cuisine | String (e.g. "pizza", "italian;pizza") — Sprint 10 |
| fee | Boolean Nullable (True=paga, False=gratis, null=desconocido) — Sprint 10 |
| outdoor_seating | Boolean Nullable — Sprint 10 |
| wheelchair | String ("yes", "limited", "no", "") — Sprint 10 |
| internet_access | Boolean Nullable — Sprint 10 |
| is_open_now | Campo calculado (no almacenado) — calculado en PlaceSerializer — Sprint 10 |
| owner | FK User (Nullable, SET_NULL) — Sprint 8 |
| is_active | Boolean |
| created_at | DateTime |
| updated_at | DateTime |

### Relaciones

```txt
1 Place → N Events

1 Place → N Promotions

1 Place → N Activities

N Places ← 1 User (owner, Sprint 8)
```

---

## Event

Representa un evento específico.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| place_id | FK |
| title | String |
| description | Text |
| category | String |
| start_date | DateTime |
| end_date | DateTime |
| minimum_age | Integer |
| capacity | Integer |
| price | Decimal |
| image_url | String |
| status | Enum |
| created_at | DateTime |
| updated_at | DateTime |

### Estados

```txt
draft
published
cancelled
finished
```

### Relaciones

```txt
N Event → 1 Place

1 Event → N Favorite

1 Event → N Reminder
```

---

## Activity

Actividad genérica sugerida por el sistema.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| place_id | FK (optional) |
| city | String |
| name | String |
| description | Text |
| category | String |
| activity_type | Enum |
| min_budget | Decimal |
| max_budget | Decimal |
| min_people | Integer |
| max_people | Integer |
| indoor | Boolean |
| outdoor | Boolean |
| score_base | Integer |
| latitude | Decimal (optional) |
| longitude | Decimal (optional) |
| address | String |
| is_free | Boolean (nullable) |
| external_url | URL |
| image_url | URL |
| source | String (`manual`, `gcba`, `opentripmap`) |
| external_id | String (for deduplication on re-import) |
| is_active | Boolean |
| created_at | DateTime |
| updated_at | DateTime |

### Tipos

```txt
restaurant
bar
cinema
museum
park
sports
concert
gaming
tourism
shopping
```

---

## Promotion

Promociones publicadas por negocios.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| place_id | FK |
| title | String |
| description | Text |
| discount_percentage | Decimal |
| start_date | DateTime |
| end_date | DateTime |
| is_active | Boolean |
| created_at | DateTime |
| updated_at | DateTime |

### Relaciones

```txt
N Promotion → 1 Place
```

---

## Favorite

Elementos guardados por un usuario.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| event_id | FK Nullable |
| place_id | FK Nullable |
| activity_id | FK Nullable |
| created_at | DateTime |

### Restricción

Debe existir solamente una referencia:

```txt
event_id
o
place_id
o
activity_id
```

---

## Reminder

Recordatorios creados por usuarios.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| event_id | FK |
| reminder_date | DateTime |
| created_at | DateTime |

---

## Notification

Notificaciones generadas por el sistema.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| title | String |
| message | Text |
| notification_type | String |
| read | Boolean |
| created_at | DateTime |

### Tipos

```txt
event_reminder
promotion
system
recommendation
```

---

## InteractionHistory

Registro de comportamiento del usuario.

Permite mejorar recomendaciones futuras.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| action | String |
| entity_type | String |
| entity_id | UUID |
| created_at | DateTime |

### Acciones

```txt
view
favorite
unfavorite
click
share
search
create_reminder
recommendation_click
plan_viewed     — Sprint 8: usuario autenticado abre un plan público ajeno
plan_shared     — Sprint 8: propietario comparte su plan
plan_feedback   — Sprint 8: propietario da feedback a un ítem del plan
plan_completed  — Sprint 8: tarea Celery marca plan como completado
plan_cloned     — Sprint 9: usuario copia un plan ajeno como draft propio
plan_surprise   — Sprint 9: usuario genera un plan vía Modo Sorprendeme
```

---

## Recommendation

Resultado generado por el motor de recomendaciones.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| activity_id | FK Nullable |
| event_id | FK Nullable |
| place_id | FK Nullable |
| score | Decimal |
| recommendation_reason | Text |
| score_breakdown | JSON (V3: preference, popularity, interaction, weather, distance, budget, time_of_day, day_of_week, feedback_bonus, feedback_penalty) |
| created_at | DateTime |

### Ejemplo

```txt
Hace frío + llueve

Score:
92

Motivo:
"Cine cercano acorde a tu presupuesto y preferencias."
```

---

## Review

Reseña de un usuario sobre un Place, Activity o Event.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| entity_type | Enum (place, activity, event) |
| entity_id | UUID |
| stars | Integer (1-5) |
| text | Text |
| created_at | DateTime |
| updated_at | DateTime |

### Restricciones

```txt
unique_together: (user_id, entity_type, entity_id)
stars: 1 a 5
```

### Relaciones

```txt
N Review → 1 User
```

---

## Plan

Itinerario del día generado para un usuario.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK |
| title | String |
| date | Date |
| budget | Decimal |
| people_count | Integer |
| city | String |
| slug | String (único) |
| is_public | Boolean |
| status | Enum (draft, generated, planned, completed, cancelled) |
| created_at | DateTime |
| updated_at | DateTime |

### Estados

```txt
draft      — creado manualmente, sin itinerario generado
generated  — itinerario generado automáticamente por el motor
planned    — usuario confirmó que ejecutará el plan (Sprint 8)
completed  — usuario marcó el plan como realizado
cancelled  — plan cancelado
```

### Relaciones

```txt
N Plan → 1 User
1 Plan → N PlanItem
1 Plan → N PlanFeedback (Sprint 8)
```

---

## PlanItem

Ítem individual dentro de un plan (place, activity o event).

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| plan_id | FK |
| entity_type | Enum (place, activity, event) |
| entity_id | UUID |
| slot | Enum (morning, afternoon, evening) |
| order | Integer |
| note | Text (opcional) |
| generation_reason | Text (por qué fue elegido por el motor) |
| created_at | DateTime |

### Relaciones

```txt
N PlanItem → 1 Plan
```

---

## PlanFeedback (Sprint 8)

Calificación de un ítem de plan por parte de su propietario.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| plan_id | FK Plan |
| user_id | FK User |
| entity_type | Enum (place, activity, event) |
| entity_id | UUID |
| rating | Integer (1-5) |
| comment | Text (opcional) |
| created_at | DateTime |

### Restricciones

```txt
unique_together: (plan_id, user_id, entity_type, entity_id)
Sólo el propietario del plan puede crear feedback.
update_or_create — idempotente: actualiza si ya existe.
```

### Relaciones

```txt
N PlanFeedback → 1 Plan
N PlanFeedback → 1 User
```

---

## AuditLog

Registro de auditoría del sistema.

### Campos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| user_id | FK Nullable |
| action | String |
| entity_type | String |
| entity_id | UUID |
| metadata | JSON |
| created_at | DateTime |

### Eventos auditables

```txt
login
logout
create
update
delete
publish
cancel
favorite
reminder
```

---

# 5. Índices recomendados

Crear índices para:

```txt
User.email

Place.category

Place.city

Event.start_date

Event.status

Promotion.is_active

Favorite.user_id

Recommendation.user_id
```

---

# 6. Restricciones de integridad

- Todo Event debe pertenecer a un Place.
- Toda Promotion debe pertenecer a un Place.
- Todo Favorite debe pertenecer a un User.
- Todo Reminder debe pertenecer a un User.
- Toda Recommendation debe pertenecer a un User.
- No puede existir un Event sin Place.
- No pueden mostrarse promociones vencidas.
- No pueden generarse recomendaciones para usuarios eliminados.

---

# 7. Entidades futuras (No MVP)

Estas entidades no forman parte del MVP pero la arquitectura debe permitir agregarlas.

```txt
Achievement
Friendship
Chat
Reservation
Payment
Subscription
AIRecommendation
```

---

# 8. Regla de oro

> Ninguna entidad puede agregarse, eliminarse o modificarse sin actualizar DATA_MODEL.md, ARCHITECTURE.md y API_GUIDELINES.md.