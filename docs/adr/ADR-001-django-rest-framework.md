# ADR-001: Django REST Framework como capa de API

**Proyecto:** Planify  
**Fecha:** 2026-06-10  
**Estado:** Aprobado  
**Responsable:** Orchestrator

---

## Contexto

Planify necesita exponer una API REST consumida por el frontend React y potencialmente por clientes móviles en el futuro. El backend usa Django 5.2. Se requiere soporte para serialización, validación, paginación, filtros, autenticación JWT y control de permisos granular.

---

## Decisión

Usar **Django REST Framework (DRF) 3.16** como única capa de API.

---

## Alternativas consideradas

| Alternativa | Ventajas | Desventajas |
|---|---|---|
| DRF | Maduro, documentado, integración nativa con Django ORM y auth | Verboso en ViewSets complejos |
| Django Ninja | Tipado con Pydantic, performance ligeramente superior | Ecosistema más joven, menos integraciones |
| FastAPI separado | Muy performante, tipado nativo | Requiere segundo servicio, duplica infraestructura |

---

## Justificación

DRF es el estándar de facto para APIs Django. Su integración con el ORM, el sistema de permisos y `django-filter` reduce tiempo de desarrollo. La compatibilidad con `djangorestframework-simplejwt` resuelve autenticación sin configuración adicional.

---

## Consecuencias

### Positivas

- Serializers reutilizables entre endpoints.
- Browsable API para desarrollo.
- Permisos basados en clases integrables con RBAC.

### Negativas / Trade-offs

- Overhead de serialización comparado con respuestas dict crudas.
- Curva de aprendizaje en ViewSets anidados.

---

## Impacto en el sistema

### Backend
Todos los endpoints bajo `/api/v1/` se implementan mediante ViewSets o APIViews de DRF.

### Frontend
Consume JSON estándar; sin impacto en implementación.

### Base de datos
Sin impacto directo.

### DevOps
`djangorestframework==3.16.0` incluido en `requirements.txt` y `requirements-prod.txt`.

### Seguridad
`DEFAULT_AUTHENTICATION_CLASSES` configurado con JWT + session para el admin.

### QA
Tests de endpoints usan `APIClient` de DRF.

---

## Estado final

**Resultado:** Aprobado  
**Fecha de aprobación:** 2026-06-10
