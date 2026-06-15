import { test, expect } from '@playwright/test'

/**
 * Flujo 1: Registro → Login implícito → Onboarding → Recomendaciones
 */
test.describe('Flujo 1 — Registro completo', () => {
  test('registro, onboarding y recomendaciones', async ({ page }) => {
    const uniqueEmail = `test.e2e.${Date.now()}@planify.com`

    // ── Paso 1: Registro ──────────────────────────────────────────────────────
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible()

    await page.getByLabel('Nombre', { exact: true }).fill('Test')
    await page.getByLabel('Apellido', { exact: true }).fill('E2E')
    await page.getByLabel('Correo electrónico', { exact: true }).fill(uniqueEmail)
    await page.getByLabel('Contraseña', { exact: true }).fill('Planify2025!')
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Planify2025!')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Registro exitoso → redirige a /
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')

    // ── Paso 2: Onboarding ────────────────────────────────────────────────────
    await page.goto('/onboarding/preferencias')
    await expect(page.getByRole('heading', { name: /qué te gusta hacer/i })).toBeVisible()

    // Verificar que el botón empieza deshabilitado
    await expect(
      page.getByRole('button', { name: /ver mis recomendaciones/i }),
    ).toBeDisabled()

    // Seleccionar dos preferencias
    await page.getByText('Música').click()
    await page.getByText('Deportes').click()

    // Verificar que el botón muestra 2 seleccionados y está habilitado
    await expect(
      page.getByRole('button', { name: /2 seleccionados/i }),
    ).toBeEnabled()

    // ── Paso 3: Ir a Recomendaciones ─────────────────────────────────────────
    await page.getByRole('button', { name: /ver mis recomendaciones/i }).click()

    await page.waitForURL('/recomendaciones')
    await expect(page.getByRole('heading', { name: /para vos/i })).toBeVisible()
  })
})
