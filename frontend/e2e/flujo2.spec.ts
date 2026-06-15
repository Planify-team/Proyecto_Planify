import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

/**
 * Flujo 2: Login → Abrir actividad → Agregar favorito → Ver favoritos
 */
test.describe('Flujo 2 — Favoritos', () => {
  test('agregar actividad a favoritos y verificar en la lista', async ({ page }) => {
    // ── Paso 1: Login ─────────────────────────────────────────────────────────
    await login(page)
    await expect(page).toHaveURL('/')

    // ── Paso 2: Ir a Explorar → pestaña Actividades ───────────────────────────
    await page.goto('/explorar')
    await expect(page.getByRole('heading', { name: /explorar/i })).toBeVisible()

    await page.getByRole('button', { name: /actividades/i }).click()

    // Esperar que carguen las actividades
    const activityCard = page.locator('[class*="cursor-pointer"]').first()
    await expect(activityCard).toBeVisible({ timeout: 10_000 })

    // Capturar el nombre de la primera actividad
    const activityName = await activityCard.locator('h3').first().innerText()

    // ── Paso 3: Abrir la actividad ────────────────────────────────────────────
    await activityCard.click()
    await page.waitForURL(/\/activities\//)
    await expect(page.getByRole('heading', { name: activityName })).toBeVisible()

    // ── Paso 4: Agregar a favoritos ───────────────────────────────────────────
    const addFavBtn = page.getByRole('button', { name: /agregar a favoritos/i })
    const removeFavBtn = page.getByRole('button', { name: /quitar de favoritos/i })

    // Si ya es favorito, quitarlo primero para tener estado limpio
    if (await removeFavBtn.isVisible()) {
      await removeFavBtn.click()
      await expect(addFavBtn).toBeVisible({ timeout: 5_000 })
    }

    await addFavBtn.click()
    await expect(
      page.getByRole('button', { name: /quitar de favoritos/i }),
    ).toBeVisible({ timeout: 5_000 })

    // ── Paso 5: Verificar en /favoritos ──────────────────────────────────────
    await page.goto('/favoritos')
    await expect(page.getByRole('heading', { name: /mis favoritos/i })).toBeVisible()
    await expect(page.getByText(activityName)).toBeVisible()
  })
})
