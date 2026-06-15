# ADR-002: Autenticación basada en JWT con SimpleJWT

**Proyecto:** Planify  
**Fecha:** 2026-06-10  
**Estado:** Aprobado  
**Responsable:** Orchestrator

---

## Contexto

Planify es una SPA React desacoplada del backend Django. La autenticación debe funcionar sin sesiones de servidor (stateless) para facilitar escala horizontal. Se requieren access tokens de vida corta y refresh tokens seguros para mantener la sesión del usuario.

---

## Decisión

Usar **djangorestframework-simplejwt 5.4** para emitir, validar y rotar tokens JWT. Access token con TTL de 15 minutos; refresh token con TTL de 7 días almacenado en `TokenBlacklistApp` al logout.

---

## Alternativas consideradas

| Alternativa | Ventajas | Desventajas |
|---|---|---|
| JWT con SimpleJWT | Stateless, integración DRF nativa, blacklist incluida | Tokens no revocables sin blacklist |
| Django Sessions + cookies | Revocación inmediata, sin tokens en cliente | Requiere sticky sessions o sesiones en Redis; complica escala |
| Auth0 / servicio externo | Gestión de identidad delegada | Dependencia externa, costo, complejidad de integración |

---

## Justificación

La arquitectura SPA + API stateless es el patrón estándar para este stack. SimpleJWT provee blacklist de refresh tokens sin infraestructura adicional. El frontend almacena los tokens en memoria (Zustand) para reducir exposición XSS.

---

## Consecuencias

### Positivas

- Sin estado en el servidor para autenticación.
- Refresh token rotation reduce ventana de exposición.
- Blacklist permite logout efectivo.

### Negativas / Trade-offs

- Blacklist requiere consulta a BD en cada refresh (overhead mínimo).
- Access tokens comprometidos son válidos hasta expiración (15 min).

---

## Impacto en el sistema

### Backend
`rest_framework_simplejwt.token_blacklist` instalada. Endpoints `/api/v1/auth/token/`, `/api/v1/auth/token/refresh/`, `/api/v1/auth/logout/`.

### Frontend
`useAuthStore` (Zustand) gestiona tokens en memoria. Axios interceptor renueva automáticamente con el refresh token.

### Base de datos
Tabla `token_blacklist_outstandingtoken` y `token_blacklist_blacklistedtoken` creadas por migración.

### DevOps
Sin impacto en infraestructura.

### Seguridad
`SIGNING_KEY` derivada de `SECRET_KEY`. HTTPS obligatorio en producción (`SECURE_HSTS_SECONDS`).

### QA
Tests de auth usan flujo completo: login → obtener token → request autenticado → logout → verificar blacklist.

---

## Estado final

**Resultado:** Aprobado  
**Fecha de aprobación:** 2026-06-10
