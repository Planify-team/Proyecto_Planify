# SPRINT_8.md

# Sprint 8 — Ecosistema de Contenido y Retención    

## Estado

```txt
SPRINT_8_STATUS: PLANNED
```

---

# Objetivo

El objetivo de Sprint 8 es transformar Planify en una plataforma capaz de generar contenido real de forma autónoma y aumentar la retención de usuarios mediante un ciclo completo de planificación → ejecución → valoración.

Actualmente el sistema depende principalmente de:

* contenido interno cargado manualmente;
* integraciones externas;
* recomendaciones automáticas;
* planes generados por el Planner.

A partir de este sprint el sistema incorporará:

* gestión de contenido por negocios;
* gestión de eventos por organizadores;
* ciclo de feedback posterior a los planes;
* aprendizaje continuo para el motor de recomendaciones.

---

# Alcance

Sprint 8 incorpora:

## Business Dashboard

* Gestión de Places por Business Owners
* Gestión de Promotions por Business Owners
* Ownership real de contenido
* Dashboard de métricas básicas

## Organizer Dashboard

* Gestión de Events por Event Organizers
* Publicación y cancelación de eventos
* Control de estados de eventos

## Retención y Feedback

* Recordatorios automáticos de planes próximos
* Flujo de finalización de planes
* Calificación posterior al uso
* Aprendizaje para recomendaciones futuras

## Optimización

* Métricas básicas de interacción
* Auditoría completa
* Mejora del Recommendation Engine utilizando feedback real

---

# Bloque 1 — Ownership de Contenido

## Objetivo

Permitir que negocios y organizadores gestionen su propio contenido.

---

## DATA_MODEL

Actualizar:

```txt
Place
 └── owner (User)

Promotion
 └── owner (User)

Event
 └── organizer (User)
```

---

## Roles involucrados

```txt
business_owner

event_organizer
```

---

## Reglas

### Business Owner

Puede:

```txt
Crear Place

Editar Place propio

Crear Promotion

Editar Promotion propia

Desactivar Promotion propia
```

No puede:

```txt
Editar contenido ajeno
```

---

### Event Organizer

Puede:

```txt
Crear Event

Editar Event propio

Publicar Event

Cancelar Event
```

No puede:

```txt
Modificar eventos de otros organizadores
```

---

# Bloque 2 — Dashboard Business

## Objetivo

Dar herramientas reales a negocios.

---

## Backend

Crear:

```txt
GET  /api/v1/dashboard/business/

GET  /api/v1/dashboard/business/places/

GET  /api/v1/dashboard/business/promotions/
```

---

## Información mínima

```txt
Cantidad de places

Cantidad de promociones activas

Cantidad de favoritos recibidos

Promociones próximas a vencer
```

---

## Frontend

Nueva página:

```txt
BusinessDashboardPage

/dashboard/business
```

---

## Componentes

```txt
BusinessStatsCard

OwnedPlacesTable

OwnedPromotionsTable
```

---

# Bloque 3 — Dashboard Organizer

## Objetivo

Permitir autogestión de eventos.

---

## Backend

Crear:

```txt
GET /api/v1/dashboard/organizer/

GET /api/v1/dashboard/organizer/events/
```

---

## Información mínima

```txt
Eventos publicados

Eventos cancelados

Eventos futuros

Favoritos recibidos
```

---

## Frontend

Nueva página:

```txt
OrganizerDashboardPage

/dashboard/organizer
```

---

## Componentes

```txt
OrganizerStatsCard

OwnedEventsTable
```

---

# Bloque 4 — Retención Post-Plan

## Objetivo

Cerrar el ciclo de uso del Planner.

---

## Flujo

### Día anterior

Crear notificación:

```txt
Tu plan para mañana está listo
```

---

### Día del plan

Crear notificación:

```txt
Hoy tenés un plan programado
```

---

### Después de la fecha

Estado:

```txt
completed
```

---

## DATA_MODEL

Actualizar Plan:

```txt
status

planned

completed

cancelled
```

---

## Backend

Crear tarea programada:

```txt
Celery Beat
```

---

## Jobs

```txt
plan_reminder_job

plan_completion_job
```

---

# Bloque 5 — Feedback del Usuario

## Objetivo

Aprender del comportamiento real.

---

## Nuevo flujo

Cuando un plan se complete:

Mostrar:

```txt
¿Cómo estuvo tu experiencia?
```

---

## Calificación

Por cada item:

```txt
1 a 5 estrellas
```

---

## Entidad nueva

```txt
PlanFeedback
```

---

### Campos

```txt
id

plan_id

user_id

entity_type

entity_id

rating

comment

created_at
```

---

## Endpoint

```txt
POST /api/v1/plans/{id}/feedback/
```

---

# Bloque 6 — Recommendation Engine V3

## Objetivo

Usar feedback real.

---

## Nuevos factores

### Feedback positivo

```txt
Rating 5

+25 score
```

---

### Feedback neutro

```txt
Rating 3

+5 score
```

---

### Feedback negativo

```txt
Rating 1

-25 score
```

---

## Historial

Registrar:

```txt
plan_completed

plan_feedback

plan_shared
```

---

## score_breakdown

Agregar:

```txt
feedback_bonus

feedback_penalty
```

---

# Bloque 7 — Compartir Planes

## Objetivo

Generar crecimiento orgánico.

---

## Backend

Actualizar:

```txt
GET /api/v1/plans/public/{slug}/
```

---

## Tracking

Registrar:

```txt
plan_shared

plan_viewed
```

---

## Frontend

Componente:

```txt
SharePlanButton
```

---

## Opciones

```txt
Copiar link

Compartir por WhatsApp
```

---

# Bloque 8 — Frontend

## Nuevas páginas

```txt
BusinessDashboardPage

OrganizerDashboardPage

PlanFeedbackPage
```

---

## Componentes

```txt
RatingStars

PlanFeedbackModal

BusinessStatsCard

OrganizerStatsCard

SharePlanButton
```

---

## Modificaciones

```txt
Navbar

ProfilePage

PlannerPage

PlanDetailPage
```

---

# Bloque 9 — Testing

## Backend

Tests:

```txt
Ownership permissions

Business Dashboard

Organizer Dashboard

Plan reminders

Plan completion

Plan feedback

Recommendation Engine V3
```

---

## Frontend

Tests:

```txt
Dashboards

PlanFeedbackModal

RatingStars

SharePlanButton
```

---

# Bloque 10 — Seguridad

Validar:

```txt
Ownership de Places

Ownership de Promotions

Ownership de Events

Acceso a dashboards

Acceso a feedback

Links públicos
```

---

# Bloque 11 — Documentación

Actualizar:

```txt
DATA_MODEL.md

ARCHITECTURE.md

RBAC.md

API_GUIDELINES.md
```

---

## Crear ADRs

```txt
ADR-010 Ownership de contenido

ADR-011 Planner Feedback Loop

ADR-012 Recommendation Engine V3
```

---

# Checklist de aceptación

## Dashboards

* [ ] Business Owner administra sus Places
* [ ] Business Owner administra sus Promotions
* [ ] Event Organizer administra sus Events

---

## Planner

* [ ] Recordatorios automáticos funcionando
* [ ] Planes pueden completarse
* [ ] Feedback registrado correctamente

---

## Recomendaciones

* [ ] Feedback impacta en recomendaciones futuras
* [ ] score_breakdown actualizado

---

## Compartir

* [ ] Links públicos funcionando
* [ ] Compartir por WhatsApp funcionando

---

## Documentación

* [ ] ADRs creados
* [ ] Documentación actualizada

---

# Fuera de alcance

No implementar:

```txt
Pagos

Reservas

Chat

IA generativa

Push notifications móviles

Google Calendar
```

---

# Resultado esperado

Al finalizar Sprint 8:

```txt
PLANIFY_STATUS:
CONTENT_GROWTH_AND_RETENTION_ENABLED
```

---

# Próximo Sprint

```txt
SPRINT_9

Experiencia de descubrimiento avanzada y crecimiento orgánico
```