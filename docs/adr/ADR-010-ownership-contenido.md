# ADR-010: Ownership de Contenido (Places, Promotions, Events)

## Estado
Aceptado — implementado en Sprint 8

## Contexto

Sprint 8 introduce el concepto de "propietario de contenido": los usuarios con roles `business_owner` y `event_organizer` pueden crear y gestionar su propio contenido (lugares, promociones, eventos). Los moderadores y admins tienen acceso completo. Los usuarios comunes pueden leer pero no modificar.

---

## Decisiones

### 1. Campo owner/organizer en modelos

**Decisión:**
- `Place.owner` → FK a User (SET_NULL, null=True). Asignado en `create_place(user=user)`.
- `Promotion.owner` → FK a User (SET_NULL, null=True). Ya existía desde Sprint 1.
- `Event.organizer` → FK a User (SET_NULL, null=True). Ya existía desde Sprint 1.

**Por qué SET_NULL y no CASCADE:** Si el usuario es eliminado, el contenido permanece en la plataforma (puede ser reasignado o mantenido por un moderador). Eliminar en cascada borraría datos valiosos.

---

### 2. Clases de permiso (BasePermission)

**Decisión:** Cada entidad tiene su propia clase `*Permission` en `apps/<entity>/permissions.py`:

```python
def has_object_permission(self, request, view, obj):
    if request.method in SAFE_METHODS: return True
    if request.user.role in ("admin", "moderator"): return True
    if request.user.role == "business_owner": return obj.owner == request.user
    return False
```

**Alternativa rechazada:** Verificación inline en las views — viola SRP y dificulta testing.

---

### 3. Dashboard por rol

**Decisión:** App `apps/dashboard/` sin modelos, solo views/selectors/permissions. Rutas separadas:
- `GET /api/v1/dashboard/business/stats/` — `IsBusinessOwner`
- `GET /api/v1/dashboard/organizer/stats/` — `IsEventOrganizer`

**Por qué app separada:** El dashboard agrega datos de múltiples apps. Ponerlo en `places/` o `events/` crearía acoplamiento incorrecto.

---

## Consecuencias

- Un `business_owner` solo ve y modifica sus propios lugares/promociones.
- Un `event_organizer` solo ve y modifica sus propios eventos.
- Admin y moderador pueden modificar cualquier contenido.
- Si un lugar no tiene owner (creado por seed/admin), ningún `business_owner` puede editarlo.
