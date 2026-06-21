/** "$5.000" or "Gratis" when val === 0 */
export function formatARS(val: string | number | null | undefined): string {
  if (val == null) return '—'
  const n = parseFloat(String(val))
  if (isNaN(n)) return '—'
  if (n === 0) return 'Gratis'
  return `$${Math.round(n).toLocaleString('es-AR')}`
}

/** "15 ene 2026" */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
