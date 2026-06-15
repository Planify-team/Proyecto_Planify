# RBAC.md

# Roles, Permisos y Control de Acceso

## 1. Principio

> Todo acceso debe estar controlado por rol y permisos explícitos.

Ningún usuario podrá acceder a recursos o funcionalidades para las que no tenga autorización.

Todos los permisos deberán validarse desde el backend.

---

## 2. Roles del sistema

| Rol | Descripción |
|----------|----------|
| `admin` | Administración global de la plataforma. |
| `moderator` | Moderación de contenido, eventos y promociones. |
| `business_owner` | Representante de un negocio asociado. |
| `event_organizer` | Organizador autorizado para publicar eventos. |
| `user` | Usuario registrado de la plataforma. |
| `guest` | Usuario no autenticado. |

---

## 3. Scopes

| Scope | Descripción |
|----------|----------|
| `global` | Acceso total al sistema. |
| `organization` | Recursos pertenecientes a una organización o negocio. |
| `own` | Recursos creados por el propio usuario. |
| `public` | Información pública visible para todos. |

---

## 4. Matriz de permisos

### Usuarios

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver usuarios | Sí | Sí | No | No | No | No |
| Crear usuarios | Sí | No | No | No | Sí | Sí (registro) |
| Editar usuarios | Sí | No | No | No | Solo propio | No |
| Suspender usuarios | Sí | Sí | No | No | No | No |
| Eliminar usuarios | Sí | No | No | No | Solo propio | No |

---

### Eventos

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver eventos | Sí | Sí | Sí | Sí | Sí | Sí |
| Crear eventos | Sí | No | No | Sí | No | No |
| Editar eventos | Sí | Sí | No | Solo propios | No | No |
| Cancelar eventos | Sí | Sí | No | Solo propios | No | No |
| Aprobar eventos | Sí | Sí | No | No | No | No |

---

### Lugares

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver lugares | Sí | Sí | Sí | Sí | Sí | Sí |
| Crear lugares | Sí | No | Sí | No | No | No |
| Editar lugares | Sí | Sí | Solo propios | No | No | No |
| Desactivar lugares | Sí | Sí | Solo propios | No | No | No |

---

### Promociones

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver promociones | Sí | Sí | Sí | Sí | Sí | Sí |
| Crear promociones | Sí | No | Sí | No | No | No |
| Editar promociones | Sí | Sí | Solo propias | No | No | No |
| Cancelar promociones | Sí | Sí | Solo propias | No | No | No |

---

### Dashboard de Negocio (Sprint 8)

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver stats de negocio | Sí | No | Solo propios | No | No | No |
| Ver lugares propios | Sí | No | Solo propios | No | No | No |
| Ver promociones propias | Sí | No | Solo propias | No | No | No |

---

### Dashboard de Organizador (Sprint 8)

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver stats de organizador | Sí | No | No | Solo propios | No | No |
| Ver eventos propios (dashboard) | Sí | No | No | Solo propios | No | No |

---

### Plan Feedback (Sprint 8)

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Dar feedback a ítem de plan | Sí | No | No | No | Solo plan propio | No |
| Compartir plan (log share) | Sí | No | Sí | Sí | Sí (solo plan propio) | No |

---

### Favoritos

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Ver favoritos | Sí | No | No | No | Solo propios | No |
| Crear favoritos | Sí | No | No | No | Sí | No |
| Eliminar favoritos | Sí | No | No | No | Solo propios | No |

---

### Recordatorios

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Crear recordatorios | Sí | No | No | No | Sí | No |
| Ver recordatorios | Sí | No | No | No | Solo propios | No |
| Eliminar recordatorios | Sí | No | No | No | Solo propios | No |

---

### Administración del sistema

| Acción | admin | moderator | business_owner | event_organizer | user | guest |
|----------|----------|----------|----------|----------|----------|----------|
| Gestionar configuraciones | Sí | No | No | No | No | No |
| Gestionar roles | Sí | No | No | No | No | No |
| Gestionar permisos | Sí | No | No | No | No | No |
| Ver auditoría | Sí | Sí | No | No | No | No |

---

## 5. Reglas de permisos

- Todo endpoint debe declarar permisos explícitos.
- No se confía en restricciones realizadas únicamente por el frontend.
- Los permisos siempre se validan en backend.
- Los permisos deben verificarse antes de ejecutar lógica de negocio.
- Los recursos marcados como `own` deben validar propiedad real del recurso.
- Toda operación administrativa debe quedar auditada.

---

## 6. Permisos por acción

Toda acción sensible debe responder:

- ¿Quién puede ejecutarla?
- ¿Sobre qué recurso?
- ¿Es un recurso propio o global?
- ¿Debe auditarse?
- ¿Debe generar una notificación?
- ¿Requiere permisos especiales?

---

## 7. Tests mínimos de permisos

Para cada endpoint sensible:

- usuario no autenticado no accede;
- usuario con rol insuficiente no accede;
- usuario propietario puede acceder a sus recursos;
- administrador puede acceder cuando corresponda;
- la acción queda auditada cuando aplica;
- la API responde código HTTP correcto.

---

## 8. Prohibiciones

- No confiar en filtros del frontend.
- No exponer endpoints administrativos públicamente.
- No permitir edición de recursos ajenos sin permisos.
- No devolver información sensible innecesaria.
- No omitir validaciones de autorización.
- No hardcodear permisos dentro de vistas o componentes.

---

## 9. Auditoría de permisos

Las siguientes acciones deben registrarse:

- login;
- logout;
- cambio de rol;
- suspensión de usuario;
- eliminación lógica de usuario;
- creación de evento;
- cancelación de evento;
- creación de promoción;
- cancelación de promoción;
- modificación de permisos;
- acceso a funcionalidades administrativas.

---

## 10. Regla de oro

> Si existe duda sobre si una acción debe permitirse o no, el sistema debe denegarla por defecto hasta que exista una regla explícita que la autorice.