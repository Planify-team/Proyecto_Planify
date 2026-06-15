# ARCHITECTURE.md

# Arquitectura del Sistema

## 1. Principio rector

> El backend es el **source of truth**.
>
> El frontend presenta información y estado visual, pero no decide reglas de negocio, permisos, recomendaciones, workflows, validaciones críticas ni lógica de integración.
>
> Toda decisión relevante para el dominio debe ser ejecutada y validada en el backend.

---

## 2. Objetivos arquitectónicos

La arquitectura debe ser:

- modular;
- mantenible;
- testeable;
- escalable;
- segura;
- observable;
- documentada;
- desacoplada de proveedores externos;
- preparada para futuras integraciones con IA;
- preparada para crecimiento funcional sin afectar módulos existentes.

### Objetivos específicos del proyecto

- Centralizar información de eventos, lugares y promociones.
- Recomendar planes personalizados según contexto.
- Integrar múltiples proveedores externos.
- Permitir escalabilidad geográfica futura.
- Mantener trazabilidad de acciones relevantes.
- Facilitar el mantenimiento mediante separación de responsabilidades.
- Construir una base sólida para recomendaciones inteligentes.

---

## 3. Capas del sistema

```txt
Frontend (React / HTML / CSS / JavaScript)
  ↓
API REST (Django REST Framework)
  ↓
Controllers / ViewSets
  ↓
Serializers / DTOs
  ↓
Service Layer
  ↓
Models / ORM
  ↓
PostgreSQL Database
```

### Responsabilidades por capa

#### Frontend

Responsable de:

- interfaz gráfica;
- experiencia de usuario;
- navegación;
- renderizado;
- consumo de API.

No debe contener:

- reglas de negocio;
- lógica de recomendación;
- validaciones críticas;
- cálculos de permisos.

#### API / Controllers

Responsable de:

- recibir requests;
- validar autenticación;
- invocar servicios;
- devolver respuestas.

#### Serializers / DTOs

Responsable de:

- validación de formato;
- transformación de datos;
- serialización;
- deserialización.

#### Service Layer

Responsable de:

- reglas de negocio;
- recomendaciones;
- workflows;
- integraciones externas;
- permisos complejos;
- generación de planes;
- scoring de recomendaciones.

#### Models / ORM

Responsable de:

- persistencia;
- relaciones;
- restricciones de datos.

#### Database

Responsable de:

- almacenamiento permanente;
- integridad referencial;
- consistencia de datos.

---

## 4. Regla de Service Layer

Toda lógica de negocio compleja debe vivir en `services/`.

### Permitido en services

- generación de recomendaciones;
- cálculo de relevancia;
- cálculo de score de recomendación;
- generación automática de planes;
- análisis de historial de interacción;
- personalización basada en preferencias;
- workflow de favoritos;
- workflow de recordatorios;
- integración con APIs externas;
- auditoría;
- ranking de resultados;
- cálculos de distancia;
- gestión de permisos complejos;
- notificaciones;
- filtrado por presupuesto;
- filtrado por gustos del usuario;
- filtrado por clima;
- filtrado por ubicación;
- filtrado por horario;
- filtrado por cantidad de personas;
- filtrado por edad.

### Prohibido en vistas, serializers o frontend

- lógica de recomendación;
- cálculo de puntuaciones;
- reglas de negocio críticas;
- validaciones de seguridad;
- integración directa con proveedores externos;
- reglas de acceso;
- decidir qué actividad, evento, lugar o plan recomendar.

---

## 5. Módulos principales

| Módulo | Responsabilidad | Owner principal |
|----------|----------|----------|
| Usuarios | Registro, autenticación, perfil, preferencias, gustos, edad y presupuesto del usuario | Backend Agent |
| PerfilUsuario | Gestión de preferencias y comportamiento del usuario | Backend Agent |
| OrganizadorEvento | Responsable de publicar eventos | Evento |
| Evento | Actividad programada disponible para asistir | Lugar, Categoría, OrganizadorEvento |
| Lugares | Gestión y consulta de restaurantes, bares, cafeterías, parques, museos y puntos de interés | Backend Agent |
| Planes | Generación y gestión de planes personalizados | Backend Agent |
| Recomendaciones | Motor de recomendación contextual | Backend Agent |
| Favoritos | Gestión de contenido guardado por usuarios | Backend Agent |
| Recordatorios | Gestión de alertas y agenda personal | Backend Agent |
| Promociones | Gestión de descuentos, ofertas y beneficios | Backend Agent |
| Geolocalización | Ubicación, distancias y mapas | Backend Agent |
| Clima | Consulta climática para adaptación contextual | Backend Agent |
| Administración y Moderación | Gestión de contenido y validación | Backend Agent |
| Frontend | Interfaz de usuario y experiencia visual | Frontend Agent |
| Infraestructura | Deploy, monitoreo, configuración y almacenamiento | DevOps Agent |
| Seguridad | Autenticación, autorización, auditoría y protección de datos | Security Agent |

---

## 6. Modelo de datos

### Entidades principales

| Entidad | Descripción | Relaciones clave |
|----------|----------|----------|
| Usuario | Persona registrada en la plataforma | PerfilUsuario, Favoritos, Recordatorios |
| PerfilUsuario | Preferencias y comportamiento del usuario | Usuario |
| Evento | Actividad programada disponible para asistir | Lugar, Categoría |
| Lugar | Ubicación física asociada a actividades | Ubicación, Categoría, NegocioAsociado |
| Ubicación | Información geográfica y coordenadas | Lugar |
| Categoría | Clasificación temática | Eventos, Lugares |
| Plan | Conjunto de recomendaciones agrupadas | Usuario, Evento, Lugar |
| Favorito | Relación entre usuario y contenido guardado | Usuario, Evento, Lugar |
| Recordatorio | Alertas programadas por el usuario | Usuario, Evento |
| Promoción | Beneficio o descuento vigente | Lugar, NegocioAsociado |
| NegocioAsociado | Empresa registrada en la plataforma | Lugar, Promoción |
| HistorialBusqueda | Registro de búsquedas realizadas | Usuario |
| HistorialInteraccion | Registro de comportamiento del usuario | Usuario |
| Reseña | Opinión y valoración de usuarios | Usuario, Evento, Lugar |

### Reglas de datos

- Toda entidad sensible debe tener `created_at` y `updated_at`.
- Toda entidad sensible debe tener trazabilidad.
- Todo evento debe poseer fecha de inicio y fecha de finalización.
- Todo lugar debe poseer una ubicación válida.
- Todo plan debe contener al menos una recomendación.
- Toda promoción debe estar asociada a un negocio asociado.
- Toda promoción debe tener fecha de inicio y fecha de finalización.
- Toda interacción relevante del usuario debe quedar registrada.
- Toda recomendación debe calcularse desde el backend.
- No se deben mostrar eventos vencidos o inactivos.
- No se deben mostrar promociones vencidas.
- Las actividades outdoor no deben priorizarse cuando el clima sea desfavorable.
- La ubicación del usuario debe utilizarse únicamente para recomendaciones y cálculo de cercanía.
- Los negocios asociados no pueden modificar información de otros negocios.
- No se deben exponer IDs internos si el dominio utiliza identificadores públicos.
- Las eliminaciones relevantes deberán ser lógicas (soft delete).

---

## 7. Multi-tenant y aislamiento

Actualmente el sistema opera bajo un esquema single-tenant.

Todos los usuarios comparten:

- catálogo de eventos;
- catálogo de lugares;
- categorías;
- promociones públicas;
- servicios externos de clima y geolocalización.

Si en futuras versiones se implementa multi-tenancy:

- cada consulta deberá filtrarse por tenant;
- cada permiso deberá validar alcance;
- ningún usuario podrá acceder a datos de otro tenant;
- cada exportación deberá respetar el tenant correspondiente;
- cada negocio asociado solo podrá administrar sus propios lugares, eventos y promociones.

---

## 8. Auditoría

Toda acción relevante debe generar evento auditable.

### Eventos mínimos

- login;
- registro de usuario;
- edición de perfil;
- creación de evento;
- edición de evento;
- cambio de estado de evento;
- eliminación lógica;
- creación de promoción;
- edición de promoción;
- creación de plan;
- generación de recomendación;
- aprobación o rechazo de contenido;
- exportación;
- cambio de permisos;
- integración externa.

### Datos auditados

- usuario;
- fecha;
- acción;
- entidad afectada;
- resultado;
- dirección IP cuando corresponda.

---

## 9. Integraciones externas

| Integración | Propósito | Responsable | Estado |
|----------|----------|----------|----------|
| OpenWeather API | Obtener clima actual y pronósticos | Backend | Disponible (clave configurada, uso condicional) |
| Google Maps API | Geolocalización y mapas | Backend | Pendiente Sprint 5+ |
| Google Places API | Obtención de lugares cercanos | Backend | Pendiente Sprint 5+ |
| Ticketmaster API | Consulta de eventos y recitales | Backend | Pendiente Sprint 5+ |
| Sistema de Notificaciones (interno) | Alertas y recordatorios vía Celery | Backend | Implementado Sprint 2 |
| Google Calendar | Exportación de eventos y recordatorios | Backend | Futuro |

### Principios de integración

- Ninguna integración externa debe ser consumida directamente desde el frontend.
- Toda integración debe pasar por el backend.
- Las integraciones deben estar desacopladas mediante servicios.
- Los errores externos deben manejarse de forma controlada.
- El sistema debe contemplar mecanismos de fallback cuando una API externa no esté disponible.

---

## 10. Decisiones arquitectónicas

Las decisiones relevantes deben registrarse como ADR en `docs/adr/`.

### ADRs registrados

| ADR | Título | Estado |
|---|---|---|
| [ADR-001](adr/ADR-001-django-rest-framework.md) | Django REST Framework como capa de API | Aprobado |
| [ADR-002](adr/ADR-002-autenticacion-jwt.md) | Autenticación basada en JWT con SimpleJWT | Aprobado |
| [ADR-003](adr/ADR-003-postgresql-redis.md) | PostgreSQL como BD principal y Redis como caché/broker | Aprobado |
| [ADR-004](adr/ADR-004-arquitectura-modular.md) | Arquitectura modular por dominio de negocio | Aprobado |
| [ADR-005](adr/ADR-005-openweather.md) | Integración OpenWeather API | Aprobado |
| [ADR-006](adr/ADR-006-google-places.md) | Integración Google Places API | Aprobado |
| [ADR-007](adr/ADR-007-recommendation-engine-v2.md) | Motor de Recomendaciones V2 con score_breakdown | Aprobado |
| [ADR-008](adr/ADR-008-reviews-ratings.md) | Sistema de Reviews & Ratings con entidad genérica | Aprobado |
| [ADR-009](adr/ADR-009-planner-itinerario.md) | Planner de Itinerario Inteligente | Aprobado |

### ADRs pendientes

- Estrategia de soft delete para entidades críticas.
- Recomendaciones calculadas exclusivamente desde backend.
- Estrategia de fallback ante fallas de proveedores externos.

---

## 11. Anti-patrones prohibidos

- Duplicar lógica entre backend y frontend.
- Crear endpoints ad hoc sin convención.
- Mezclar dominios en un mismo módulo sin justificación.
- Crear carpetas nuevas sin actualizar `FOLDER_STRUCTURE.md`.
- Saltar permisos en endpoints internos.
- Hardcodear reglas de negocio.
- Crear features sin tests mínimos.
- Resolver deuda técnica agregando más complejidad accidental.
- Consumir APIs externas desde el frontend para procesos críticos.
- Realizar consultas N+1 sin optimización.
- Exponer información sensible en respuestas API.
- Implementar lógica de negocio dentro de modelos o vistas.
- Crear dependencias circulares entre módulos.
- Realizar operaciones de escritura sin auditoría cuando corresponda.
- Acoplar el dominio a un proveedor externo específico.
- Mostrar actividades ocultándolas únicamente desde frontend.
- Permitir que un negocio asociado modifique información de otro negocio.
- Guardar claves de APIs dentro del código fuente.
- Depender de una API externa sin manejo de errores.
- Mostrar eventos o promociones vencidas.