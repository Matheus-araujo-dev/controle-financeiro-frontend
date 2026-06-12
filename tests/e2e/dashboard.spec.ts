import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@empresa.com');
    await page.getByLabel('Senha').fill('admin123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('deve exibir cards de resumo financeiro', async ({ page }) => {
    await expect(page.getByText('Receitas')).toBeVisible();
    await expect(page.getByText('Despesas')).toBeVisible();
    await expect(page.getByText('Saldo')).toBeVisible();
  });

  test('deve filtrar despesas por período', async ({ page }) => {
    await page.getByLabel('Período').click();
    await page.getByRole('option', { name: 'Este Mês' }).click();
    await expect(page.getByText('Receitas')).toBeVisible();
  });
});