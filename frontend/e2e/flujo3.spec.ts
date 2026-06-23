import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

/**
 * Flujo 3: Login → Abrir evento → Crear recordatorio → Ver → Eliminar
 */
test.describe('Flujo 3 — Recordatorios', () => {
  test('crear y eliminar un recordatorio de evento', async ({ page }) => {
    // ── Paso 1: Login ─────────────────────────────────────────────────────────
    await login(page)
    await expect(page).toHaveURL('/')

    // ── Paso 2: Ir a Explorar → pestaña Eventos ───────────────────────────────
    await page.goto('/explorar')
    await expect(page.getByRole('heading', { name: /explorar/i })).toBeVisible()

    await page.getByRole('tab', { name: /eventos/i }).click()

    // Esperar que carguen los eventos publicados
    const eventCard = page.locator('[class*="cursor-pointer"]').first()
    await expect(eventCard).toBeVisible({ timeout: 10_000 })

    const eventTitle = await eventCard.locator('h3').first().innerText()

    // ── Paso 3: Abrir el evento ───────────────────────────────────────────────
    await eventCard.click()
    await page.waitForURL(/\/events\//)
    await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible()

    // Verificar que la sección de recordatorio está visible (evento publicado)
    const reminderSection = page.getByRole('heading', { name: /crear recordatorio/i })
    await expect(reminderSection).toBeVisible()

    // ── Paso 4: Crear el recordatorio ─────────────────────────────────────────
    // Usar mañana como fecha
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    // datetime-local format: YYYY-MM-DDTHH:MM
    const pad = (n: number) => String(n).padStart(2, '0')
    const reminderValue = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`

    await page.locator('input[type="datetime-local"]').fill(reminderValue)
    await page.getByRole('button', { name: /recordar/i }).click()

    // Esperar que el campo se limpie (indicador de éxito)
    await expect(page.locator('input[type="datetime-local"]')).toHaveValue('', { timeout: 8_000 })

    // ── Paso 5: Verificar en /recordatorios ──────────────────────────────────
    await page.goto('/recordatorios')
    await expect(page.getByRole('heading', { name: /mis recordatorios/i })).toBeVisible()
    await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 5_000 })

    // ── Paso 6: Eliminar el recordatorio ─────────────────────────────────────
    // Primer clic → muestra confirmación
    await page.getByRole('button', { name: /eliminar/i }).first().click()
    await expect(page.getByRole('button', { name: /confirmar/i })).toBeVisible()

    // Segundo clic → elimina definitivamente
    await page.getByRole('button', { name: /confirmar/i }).click()

    // El recordatorio debe desaparecer
    await expect(page.getByText(eventTitle)).not.toBeVisible({ timeout: 8_000 })
  })
})
