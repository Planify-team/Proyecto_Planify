# ADR-018: GCBA Open Data como Fuente Primaria de Actividades en Buenos Aires

**Estado:** Aprobado  
**Fecha:** 2026-06-16  
**Sprint:** 11

---

## Contexto

Planify necesita datos reales de actividades y lugares de entretenimiento en Buenos Aires. Las fuentes disponibles son:

| Fuente | Tipo | Costo | Idioma | Cobertura BA | Mantenimiento |
|---|---|---|---|---|---|
| GCBA Open Data | Dataset oficial | Gratis | Español | Excelente | Gobierno |
| OpenStreetMap | Mapa colaborativo | Gratis | Sin idioma fijo | Buena | Comunidad |
| OpenTripMap | POIs | 500 req/día gratis | Inglés | Parcial | Empresa |
| Ticketmaster | Eventos | Gratis (limitado) | Inglés | Parcial | Empresa |
| Wikidata | Enciclopédico | Gratis | Multilingüe | Limitada | Comunidad |
| Google Places | POIs | $$$  | Español | Excelente | Google |

---

## Decisiones

### 1. GCBA Open Data como fuente primaria

**Decisión:** Usar el portal `data.buenosaires.gob.ar` (CKAN API) como fuente principal de datos de actividades porteñas.

**Motivo:**
- Datos oficiales del Gobierno de la Ciudad — precisos y actualizados.
- Gratuitos, sin límite de requests, sin API key requerida.
- En español — los nombres de los lugares ya vienen en el idioma correcto.
- Cobertura amplia: teatros, centros culturales, polideportivos, bibliotecas, museos municipales.
- La licencia de datos abiertos permite uso comercial.

**Alternativa descartada: Google Places**
- Costo: ~$17/1000 requests para Nearby Search. Con 500 lugares = $8.50 por import.
- Con re-sincronizaciones mensuales, el costo escala rápidamente.
- Innecesario cuando el gobierno publica los mismos datos gratis.

**Alternativa descartada: Ticketmaster**
- Cubre principalmente eventos grandes (recitales, deportes).
- Baja cobertura de actividades cotidianas (museums, parks, etc.).
- Requiere evaluación de cobertura real en Argentina antes de integrar — queda para Sprint 12.

**Alternativa descartada: Wikidata**
- Datos enciclopédicos, no operacionales (sin horarios, sin dirección normalizada).
- Relación effort/valor baja para el caso de uso de Planify.

---

### 2. `source` CharField en lugar de modelo `ActivitySource` separado

**Decisión:** Usar `Activity.source = CharField(max_length=50)` con valores `"manual"`, `"gcba"`, `"opentripmap"`.

**Motivo:**
- Un modelo separado (`ActivitySource`) agregaría una FK, una migración, un serializer y lógica de join para un dato que es esencialmente un string de auditoría.
- Los únicos casos de uso son filtrar por source (`Activity.objects.filter(source="gcba")`) y mostrar la procedencia — ambos resueltos con un CharField.
- Si en el futuro necesitamos metadata por fuente (credenciales, last_sync, etc.), se puede migrar a un modelo separado con datos reales a migrar.

---

### 3. Deduplicación por `external_id`

**Decisión:** Cada actividad importada tiene `external_id = f"gcba:{resource_id}:{ckan_id}"`.

**Motivo:**
- Permite re-importar datasets sin crear duplicados usando `update_or_create(external_id=...)`.
- El formato `{source}:{resource_id}:{id}` garantiza unicidad entre datasets del mismo proveedor.
- Los registros manuales tienen `external_id=""` — no colisionan.

---

## Consecuencias

- Después de `seed_gcba`, la app tiene >100 actividades de fuente oficial porteña.
- Re-sincronizar es seguro: `--clear-gcba` borra y reimporta, o el default actualiza in-place.
- La trazabilidad de datos mejora: `Activity.source` indica la procedencia de cada registro.
- El modelo Activity crece con 8 campos nuevos — todos opcionales, sin romper datos existentes.
