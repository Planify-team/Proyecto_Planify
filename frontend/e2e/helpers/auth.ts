import type { Page } from '@playwright/test'

export const ADMIN_EMAIL = 'admin@planify.com'
export const ADMIN_PASSWORD = 'admin123'

export async function login(
  page: Page,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')
}
