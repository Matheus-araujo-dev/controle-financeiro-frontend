import { test, expect } from '@playwright/test';

test.describe('Dashboard responsivo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuário técnico').fill('e2e');
    await page.getByLabel('Nome de exibição').fill('Validação E2E');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/\/dashboard$/);
  });

  test('mantém os controles principais acessíveis e sem rolagem horizontal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lançamento rápido' })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
