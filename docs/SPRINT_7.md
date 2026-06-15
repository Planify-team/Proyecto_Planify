# SPRINT_7.md

# Sprint 7 — Planner Inteligente

## 1. Objetivo del Sprint

Convertir Planify en un asistente de planificación real: el usuario elige una fecha, presupuesto y cantidad de personas, y la app le genera un itinerario completo para el día combinando lugares, actividades y eventos de forma coherente.

Al terminar este sprint, un usuario puede:
- Crear un plan para una fecha y configuración específica.
- Recibir un itinerario generado automáticamente (mañana / tarde / noche).
- Guardar y consultar sus planes anteriores.
- Modificar manualmente los ítems del plan generado.
- Compartir un plan por link público.

---

## 2. Alcance

### Incluido

- Modelo `Plan` con bloques horarios (mañana, tarde, noche).
- Modelo `PlanItem` — cada ítem del itinerario (place, activity o event).
- Endpoint de generación automática: el backend arma el plan usando el motor de recomendaciones existente.
- Endpoint CRUD de planes (crear, listar, ver, eliminar).
- Endpoint para modificar ítems del plan (agregar / quitar).
- Endpoint de link público (`/planes/{slug}/`) — lectura sin auth.
- Frontend: `PlannerPage` con formulario de configuración + vista de itinerario generado.
- Frontend: `MyPlansPage` con historial de planes guardados.
- Frontend: `PlanDetailPage` — vista de un plan específico, editable o compartible.

### Excluido

- IA generativa / LLMs (la generación usa el motor existente, no modelos externos).
- Exportación a Google Calendar (Sprint 8).
- Notificaciones del plan en el día (Sprint 8).
- Reservas o compra de entradas (fuera de roadmap actual).
- Colaboración multi-usuario en un plan (fuera de roadmap actual).

---

## 3. Módulos a implementar

| Módulo | Prioridad |
|--------|-----------|
| Plan model + PlanItem model | Alta |
| Generador de itinerario (service) | Alta |
| Endpoints CRUD de planes | Alta |
| Endpoint de generación automática | Alta |
| Link público de plan | Media |
| PlannerPage (frontend) | Alta |
| MyPlansPage (frontend) | Alta |
| PlanDetailPage (frontend) | Alta |
| Tests backend + frontend | Alta |
| Documentación | Alta |

---

## 4. Backend

### Nueva app: apps.planner

```txt
backend/apps/planner/
  models.py       — Plan, PlanItem
  services.py     — generate_plan(), add_item(), remove_item(), delete_plan()
  selectors.py    — get_plans_for_user(), get_plan_by_id(), get_plan_by_slug()
  serializers.py  — PlanSerializer, PlanItemSerializer, PlanGenerateSerializer
  views.py
  urls.py
  apps.py
  migrations/
  tests/
```

### Modelos

#### Plan

| Campo | Tipo |
|-------|------|
| id | UUID |
| user | FK → User |
| title | String |
| date | Date |
| budget | Decimal |
| people_count | Integer |
| city | String |
| slug | String (único, auto-generado) |
| is_public | Boolean |
| created_at | DateTime |
| updated_at | DateTime |

#### PlanItem

| Campo | Tipo |
|-------|------|
| id | UUID |
| plan | FK → Plan |
| entity_type | Enum (place, activity, event) |
| entity_id | UUID |
| slot | Enum (morning, afternoon, evening) |
| order | Integer |
| note | Text (opcional) |
| created_at | DateTime |

### Endpoints nuevos

```txt
POST   /api/v1/plans/generate/         — generar itinerario automático
GET    /api/v1/plans/                  — listar planes del usuario autenticado
POST   /api/v1/plans/                  — crear plan vacío (manual)
GET    /api/v1/plans/{id}/             — detalle de un plan
DELETE /api/v1/plans/{id}/             — eliminar plan propio
POST   /api/v1/plans/{id}/items/       — agregar ítem a un plan
DELETE /api/v1/plans/{id}/items/{item_id}/ — quitar ítem de un plan
GET    /api/v1/plans/public/{slug}/    — ver plan público sin autenticación
```

### Lógica del generador

`generate_plan(user, date, budget, people_count, city)`:

```txt
1. Obtener clima del día (OpenWeather — ya existe)
2. Obtener preferencias del usuario (UserPreference — ya existe)
3. Para cada slot (morning, afternoon, evening):
   a. Filtrar entidades disponibles: city, budget/3, people_count
   b. Aplicar scores del motor de recomendaciones existente
   c. Priorizar según clima (outdoor si buen tiempo, indoor si lluvia)
   d. Seleccionar top-1 para ese slot
4. Devolver plan con 3 ítems (uno por slot)
5. Guardar el plan con is_public=False por defecto
```

### RBAC

- Crear y ver planes propios: cualquier usuario autenticado.
- Ver plan público: sin autenticación (AllowAny).
- Eliminar o modificar: solo el propietario.
- Auditoría: `log_action` en create, delete.

---

## 5. Frontend

### Páginas nuevas

```txt
PlannerPage     — /planner          — formulario de configuración + resultado
MyPlansPage     — /mis-planes       — historial de planes guardados
PlanDetailPage  — /planes/:id       — detalle editable del plan
PlanPublicPage  — /planes/p/:slug   — vista pública (sin auth)
```

### Componentes nuevos

```txt
PlannerForm        — fecha, presupuesto, personas, ciudad
ItineraryView      — muestra slots morning/afternoon/evening con sus ítems
PlanItemCard       — card de un ítem dentro del itinerario
SlotBadge          — etiqueta visual de mañana / tarde / noche
SharePlanButton    — copia link público al portapapeles
```

### Modificaciones

```txt
Navbar     — agregar enlace "Planner" en la navegación principal
AppRoutes  — registrar las 4 rutas nuevas
```

### Nuevos hooks y servicios

```txt
usePlanner()              — POST /plans/generate/ + manejo de estado
useMyPlans()              — GET /plans/
usePlan(id)               — GET /plans/{id}/
useAddPlanItem()          — POST /plans/{id}/items/
useRemovePlanItem()       — DELETE /plans/{id}/items/{item_id}/
plannerService.ts         — todas las llamadas a la API del planner
```

---

## 6. Testing obligatorio

### Backend

```txt
tests/test_planner.py
  — generate_plan() devuelve 3 ítems (uno por slot)
  — generate_plan() respeta presupuesto
  — generate_plan() prioriza indoor si hay lluvia
  — CRUD de planes (crear, listar, ver, eliminar)
  — solo el propietario puede eliminar su plan
  — link público accesible sin auth
  — link público no expone planes privados
  — agregar y quitar ítems del plan
```

### Frontend

```txt
PlannerForm.test.tsx
  — renderiza campos requeridos
  — deshabilita submit sin fecha o ciudad
  — muestra loading durante generación

ItineraryView.test.tsx
  — muestra los 3 slots
  — muestra nombre de cada ítem
  — botón de quitar ítem llama al hook correcto

MyPlansPage.test.tsx
  — muestra lista de planes
  — muestra empty state sin planes
  — navega al detalle al hacer click
```

---

## 7. Criterios de aceptación

### Generación de plan

- El usuario completa fecha, presupuesto, personas y ciudad.
- La app devuelve un itinerario con al menos un ítem por slot (mañana / tarde / noche).
- El plan respeta el presupuesto total indicado.
- Si hay lluvia prevista, el slot del mediodía prioriza actividades indoor.
- La generación tarda menos de 3 segundos.

### Gestión de planes

- El usuario puede ver todos sus planes anteriores en `/mis-planes`.
- Puede eliminar un plan propio.
- Puede agregar o quitar ítems manualmente del plan generado.

### Compartir

- Al activar el link público, el plan es accesible sin login desde `/planes/p/{slug}`.
- El link público no muestra la opción de editar ni eliminar.
- Copiar el link funciona en desktop y móvil.

---

## 8. Documentación a actualizar

```txt
DATA_MODEL.md        — agregar entidades Plan y PlanItem
API_GUIDELINES.md    — agregar endpoints /plans/
ARCHITECTURE.md      — agregar ADR-009 al registro
FOLDER_STRUCTURE.md  — agregar apps/planner/ al árbol de backend y /planner a features frontend
ORCHESTRATOR.md      — actualizar estado Sprint 7
docs/adr/ADR-009-planner-itinerario.md  — crear nuevo ADR
```

---

## 9. Definition of Done

Sprint 7 estará completo cuando:

- El generador devuelva un itinerario real usando datos de la base de datos.
- Los endpoints de CRUD de planes respondan correctamente.
- El link público funcione sin autenticación.
- `PlannerPage` muestre el itinerario generado de forma clara.
- `MyPlansPage` liste los planes guardados del usuario.
- El usuario pueda agregar y quitar ítems del itinerario.
- Todos los tests pasen (backend + frontend).
- TypeScript sin errores.
- Docker funcionando sin cambios de configuración.
- Documentación actualizada.

---

## 10. Salida esperada

```txt
SPRINT_7_STATUS: INTELLIGENT_PLANNER
```

Al finalizar Sprint 7, Planify tendrá:

- Un generador de itinerarios que combina clima, preferencias y presupuesto.
- Historial de planes guardados por usuario.
- Posibilidad de compartir un plan por link público.
- Una razón concreta para volver a la app antes de cada salida.
