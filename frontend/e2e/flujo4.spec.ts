import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'
import { login } from './helpers/auth'

/**
 * Flujo 4: Login → Notificaciones → Marcar como leída
 *
 * Requiere que exista al menos una notificación no leída para el usuario admin.
 * El beforeEach crea una notificación de prueba antes de los tests.
 */
test.describe('Flujo 4 — Notificaciones', () => {
  test.beforeEach(async () => {
    execSync(
      `docker exec planify_backend python manage.py shell -c "` +
      `from apps.notifications.models import Notification, NotificationType, NotificationStatus; ` +
      `from django.contrib.auth import get_user_model; ` +
      `U = get_user_model(); ` +
      `admin = U.objects.get(email='admin@planify.com'); ` +
      `n, _ = Notification.objects.get_or_create(user=admin, title='Notificacion de prueba E2E', ` +
      `defaults={'message':'Test E2E','notification_type':NotificationType.SYSTEM,'status':NotificationStatus.SENT,'read':False}); ` +
      `n.read = False; n.save()` +
      `"`,
      { stdio: 'ignore' }
    )
  })

  test('marcar notificación como leída', async ({ page }) => {
    // ── Paso 1: Login ─────────────────────────────────────────────────────────
    await login(page)
    await expect(page).toHaveURL('/')

    // ── Paso 2: Ir a Notificaciones ───────────────────────────────────────────
    await page.goto('/notificaciones')
    await expect(page.getByRole('heading', { name: /notificaciones/i })).toBeVisible()

    // Verificar que hay notificaciones no leídas
    const markReadBtn = page.getByRole('button', { name: /marcar como leída/i }).first()
    await expect(markReadBtn).toBeVisible({ timeout: 8_000 })

    // Capturar el título de la primera notificación no leída
    const unreadSection = page.locator('section').filter({ hasText: /sin leer/i })
    const firstNotifTitle = await unreadSection.locator('p[class*="font-semibold"]').first().innerText()

    // ── Paso 3: Marcar como leída ─────────────────────────────────────────────
    await markReadBtn.click()

    // El botón "Marcar como leída" debe desaparecer para esa notificación
    // y la notificación debe aparecer en la sección "Leídas"
    await expect(
      page.locator('section').filter({ hasText: /leídas/i }).getByText(firstNotifTitle),
    ).toBeVisible({ timeout: 8_000 })
  })

  test('página de notificaciones muestra estado vacío cuando no hay notificaciones', async ({ page }) => {
    // Este test verifica el estado vacío para un usuario sin notificaciones.
    // Usamos un usuario recién creado que no tiene notificaciones.
    const uniqueEmail = `empty.notif.${Date.now()}@planify.com`

    // Crear usuario
    await page.goto('/register')
    await page.getByLabel('Nombre', { exact: true }).fill('Sin')
    await page.getByLabel('Apellido', { exact: true }).fill('Notif')
    await page.getByLabel('Correo electrónico', { exact: true }).fill(uniqueEmail)
    await page.getByLabel('Contraseña', { exact: true }).fill('Planify2025!')
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Planify2025!')
    await page.getByRole('button', { name: /crear cuenta/i }).click()
    await page.waitForURL('/')

    // Ir a notificaciones
    await page.goto('/notificaciones')
    await expect(page.getByText(/sin notificaciones/i)).toBeVisible()
  })
})
