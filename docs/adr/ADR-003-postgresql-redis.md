# ADR-003: PostgreSQL como base de datos principal y Redis como caché/broker

**Proyecto:** Planify  
**Fecha:** 2026-06-10  
**Estado:** Aprobado  
**Responsable:** Orchestrator

---

## Contexto

Planify persiste usuarios, lugares, eventos, actividades, recomendaciones y sus relaciones. Se requiere integridad referencial, soporte geoespacial futuro, y un mecanismo de caché para recomendaciones costosas y ejecución de tareas asíncronas (notificaciones, reminders).

---

## Decisión

- **PostgreSQL 17** como única base de datos relacional.
- **Redis 7** como backend de caché Django (`django-redis`) y broker/backend de Celery.

---

## Alternativas consideradas

| Alternativa | Ventajas | Desventajas |
|---|---|---|
| PostgreSQL + Redis | Maduro, ACID, extensión PostGIS disponible; Redis estándar de industria | Dos servicios a operar |
| MySQL + Memcached | Ampliamente usado | Sin soporte nativo JSON avanzado ni geoespacial; Memcached no sirve como broker Celery |
| MongoDB | Flexible para datos no estructurados | Sin integridad referencial; ORM Django no nativo |
| SQLite | Sin infraestructura | No apto para concurrencia de producción |

---

## Justificación

PostgreSQL es el motor de preferencia del ecosistema Django para producción. Soporta JSON, full-text search y PostGIS (útil para futuras queries geoespaciales). Redis unifica caché y broker Celery reduciendo la cantidad de servicios.

---

## Consecuencias

### Positivas

- Integridad referencial garantizada con FK y constraints.
- `psycopg[binary]` provee driver moderno y eficiente.
- Caché de recomendaciones reduce carga de cómputo.
- Celery puede escalar workers sin cambiar el broker.

### Negativas / Trade-offs

- Redis agrega un servicio más en producción.
- Requiere configuración de persistencia AOF en Redis para no perder tareas encoladas.

---

## Impacto en el sistema

### Backend
`DATABASES` apunta a PostgreSQL vía `psycopg`. `CACHES` y `CELERY_BROKER_URL` apuntan a Redis.

### Frontend
Sin impacto directo.

### Base de datos
Volúmenes Docker `postgres_data` y `redis_data` persisten datos entre reinicios.

### DevOps
`docker-compose.yml` y `docker-compose.prod.yml` definen ambos servicios con healthchecks. Redis en producción con `--appendonly yes`.

### Seguridad
`POSTGRES_PASSWORD` y credenciales Redis nunca en código fuente; gestionadas vía `.env.prod`.

### QA
Tests de integración usan la base de datos real (no mocks) por configuración de pytest-django.

---

## Estado final

**Resultado:** Aprobado  
**Fecha de aprobación:** 2026-06-10
