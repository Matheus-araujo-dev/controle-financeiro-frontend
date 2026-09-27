import { test, expect } from '@playwright/test';

test.describe('Login local', () => {
  test('exibe o formulário vigente e abre o dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Usuário técnico')).toBeVisible();
    await expect(page.getByLabel('Nome de exibição')).toBeVisible();
    await page.getByLabel('Usuário técnico').fill('e2e');
    await page.getByLabel('Nome de exibição').fill('Validação E2E');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  });
});
