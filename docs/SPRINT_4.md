# SPRINT_4.md

# Sprint 4 — Calidad, Testing y Preparación para Producción

## Estado

```txt
SPRINT_4_STATUS: PLANNED
```

---

# Objetivo

El objetivo de Sprint 4 es fortalecer la calidad técnica de Planify, aumentar la cobertura de pruebas, preparar la infraestructura para producción y validar que toda la arquitectura definida durante Sprint 0, Sprint 1, Sprint 2 y Sprint 3 funciona correctamente de extremo a extremo.

Este sprint NO agrega funcionalidades principales de negocio.

El foco está puesto en:

- calidad;
- estabilidad;
- testing;
- documentación;
- despliegue;
- observabilidad;
- preparación para producción.

---

# Entregables principales

## QA y Testing

### Frontend

Implementar:

- Vitest;
- React Testing Library;
- mocks de API;
- cobertura mínima de componentes críticos.

Tests mínimos:

- Navbar;
- Login;
- Register;
- Onboarding;
- Recommendations;
- Favorites;
- Notifications;
- Reminders;
- Promotions;
- MapPage.

---

### Backend

Revisar cobertura existente.

Objetivo:

```txt
Cobertura mínima:
80%
```

Agregar tests faltantes para:

- recomendaciones;
- favoritos;
- recordatorios;
- notificaciones;
- geolocalización;
- permisos.

---

### End-to-End

Implementar Playwright.

Flujos obligatorios:

#### Flujo 1

Registro de usuario

```txt
Registro
→ Login
→ Onboarding
→ Recomendaciones
```

---

#### Flujo 2

Favoritos

```txt
Login
→ Abrir actividad
→ Agregar favorito
→ Ver favoritos
```

---

#### Flujo 3

Recordatorios

```txt
Login
→ Abrir evento
→ Crear recordatorio
→ Ver recordatorio
→ Eliminar recordatorio
```

---

#### Flujo 4

Notificaciones

```txt
Login
→ Abrir notificaciones
→ Marcar como leída
```

---

# Infraestructura

## Docker Producción

Crear:

```txt
backend/Dockerfile.prod

frontend/Dockerfile.prod
```

Optimizar:

- imágenes;
- cache;
- capas Docker;
- tamaño final.

---

## Docker Compose Producción

Crear:

```txt
docker-compose.prod.yml
```

Servicios:

- frontend;
- backend;
- postgres;
- redis;
- nginx.

---

## Variables de entorno

Crear:

```txt
.env.example
```

Documentar:

- backend;
- frontend;
- postgres;
- redis;
- jwt;
- cors;
- nginx.

---

# CI/CD

Implementar GitHub Actions.

Archivo:

```txt
.github/workflows/ci.yml
```

Pipeline mínimo:

### Backend

```txt
Instalar dependencias
↓
Ruff
↓
Pytest
```

---

### Frontend

```txt
npm install
↓
TypeScript check
↓
Vitest
↓
Build
```

---

### Resultado esperado

No permitir merge si:

- fallan tests;
- falla lint;
- falla build.

---

# Seguridad

Revisión completa de:

- JWT;
- permisos;
- ownership;
- endpoints públicos;
- validación de inputs;
- rate limiting;
- auditoría.

Validar:

- RBAC.md
- RULES.md
- SECURITY_AGENT.md

---

# Observabilidad

Implementar:

## Backend

Healthcheck:

```txt
/api/health/
```

Debe validar:

- API;
- PostgreSQL;
- Redis.

---

## Logging

Configurar:

```txt
INFO
WARNING
ERROR
```

Registrar:

- login;
- errores;
- excepciones;
- acciones críticas.

---

# Documentación

Actualizar:

## ADRs

Crear ADRs para:

### ADR-001

```txt
Django REST Framework
```

### ADR-002

```txt
JWT Authentication
```

### ADR-003

```txt
PostgreSQL + Redis
```

### ADR-004

```txt
Arquitectura modular por dominios
```

---

## Documentación técnica

Revisar:

- ARCHITECTURE.md
- STACK.md
- DATA_MODEL.md
- API_GUIDELINES.md

Verificar consistencia con código real.

---

# Checklist de aceptación

## Backend

- [ ] Todos los tests pasan
- [ ] Cobertura mínima 80%
- [ ] Healthcheck implementado
- [ ] Logs configurados

---

## Frontend

- [ ] Tests de componentes implementados
- [ ] Build exitosa
- [ ] TypeScript sin errores
- [ ] Responsive validado

---

## E2E

- [ ] Registro completo
- [ ] Favoritos
- [ ] Recordatorios
- [ ] Notificaciones

---

## DevOps

- [ ] Docker producción
- [ ] Compose producción
- [ ] Variables documentadas
- [ ] CI/CD funcionando

---

## Documentación

- [ ] ADRs creados
- [ ] Documentación actualizada
- [ ] Arquitectura consistente

---

# Fuera de alcance

No se implementa:

- OpenWeather;
- Google Places;
- recomendaciones V3;
- compartir planes;
- reservas;
- pagos;
- suscripciones;
- IA generativa.

Todo eso corresponde a Sprint 5 y posteriores.

---
