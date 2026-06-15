# ADR-004: Arquitectura modular por dominio de negocio

**Proyecto:** Planify  
**Fecha:** 2026-06-10  
**Estado:** Aprobado  
**Responsable:** Orchestrator

---

## Contexto

Planify cubre múltiples dominios: usuarios, lugares, eventos, actividades, recomendaciones, favoritos, notificaciones, promotions, etc. Se necesita una estructura que permita a equipos trabajar en paralelo, reducir acoplamiento entre dominios y facilitar testing aislado.

---

## Decisión

Organizar el backend en **apps Django independientes por dominio** (`apps/users`, `apps/places`, `apps/events`, `apps/activities`, `apps/recommendations`, `apps/favorites`, `apps/notifications`, `apps/promotions`, `apps/integrations`, `apps/audit`, `apps/core`). El frontend se organiza en **features por dominio** (`features/auth`, `features/map`, `features/recommendations`, etc.) siguiendo la misma separación.

---

## Alternativas consideradas

| Alternativa | Ventajas | Desventajas |
|---|---|---|
| Apps por dominio (elegida) | Bajo acoplamiento, testeable aislado, imports explícitos | Más archivos iniciales |
| Monolito en una sola app | Menos archivos | Acoplamiento alto, difícil de escalar en equipo |
| Microservicios desde el inicio | Escala independiente | Overhead de infraestructura innecesario para este tamaño |

---

## Justificación

La separación por dominio sigue el principio de responsabilidad única a nivel de aplicación. Permite que el Motor de Recomendaciones evolucione independientemente de, por ejemplo, el módulo de Promotions. Los imports explícitos entre apps hacen visibles las dependencias y evitan ciclos.

---

## Consecuencias

### Positivas

- Cada app tiene sus propias migrations, models, serializers, views, tests.
- Se puede activar/desactivar una feature cambiando `INSTALLED_APPS`.
- Frontend espeja la estructura: un feature = una carpeta con pages, hooks, components.

### Negativas / Trade-offs

- Queries entre dominios requieren joins cuidadosos o referencias via FK.
- Incremento del número de archivos de configuración (urls, admin, apps).

---

## Impacto en el sistema

### Backend
`config/api_router.py` agrega los routers de cada app. Cada app registra su propio `urls.py`.

### Frontend
`src/features/<dominio>/` contiene `pages/`, `components/`, `hooks/`. Imports entre features deben ser explícitos y mínimos.

### Base de datos
Cada app gestiona su propio conjunto de tablas. Relaciones cross-domain solo mediante FK con `on_delete` explícito.

### DevOps
Sin impacto.

### Seguridad
Permisos definidos por app; `IsOwnerOrAdmin` vive en `apps/core/permissions.py` como utilidad compartida.

### QA
Tests por app en `apps/<dominio>/tests/`. Fixtures compartidas en `conftest.py` raíz.

---

## Estado final

**Resultado:** Aprobado  
**Fecha de aprobación:** 2026-06-10
