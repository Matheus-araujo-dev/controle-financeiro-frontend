import { test, expect } from '@playwright/test';

test('central permite revisar pendências e abrir a origem em desktop e mobile', async ({ page }) => {
  await page.route('**/api/v1/contas-pagar?**', route => route.fulfill({ json: {
    items: [{ id: 'pending-account', descricao: 'Internet pendente', dataVencimento: '2020-01-01', valorLiquido: 100, valorPago: 40, statusCodigo: 'PARCIAL', recebedorNome: 'Operadora' }],
    page: 1, pageSize: 100, totalItems: 1, totalPages: 1
  } }));
  await page.route('**/api/v1/contas-receber?**', route => route.fulfill({ json: { items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } }));
  await page.route('**/api/v1/importacoes-whatsapp?**', route => route.fulfill({ json: {
    items: new URL(route.request().url()).searchParams.get('statusCodigo') === 'PENDENTE_REVISAO' ? [{ id: 'pending-import', nomeArquivo: 'fatura.pdf', statusCodigo: 'PENDENTE_REVISAO', quantidadePendentes: 2 }] : [],
    page: 1, pageSize: 100, totalItems: new URL(route.request().url()).searchParams.get('statusCodigo') === 'PENDENTE_REVISAO' ? 1 : 0,
    totalPages: new URL(route.request().url()).searchParams.get('statusCodigo') === 'PENDENTE_REVISAO' ? 1 : 0
  } }));
  await page.goto('/login');
  await page.getByLabel('Usuário técnico').fill('e2e');
  await page.getByLabel('Nome de exibição').fill('Validação E2E');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/dashboard$/);
  await page.goto('/pendencias');
  await expect(page.getByRole('heading', { name: 'Pendências financeiras', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Internet pendente/ })).toContainText('R$60,00');
  await expect(page.getByRole('link', { name: /Internet pendente/ })).toHaveAttribute('href', '/contas-pagar/pending-account');
  await page.getByLabel('Tipo de pendência').selectOption('importacao');
  await expect(page).toHaveURL(/tipo=importacao/);
  await expect(page.getByRole('link', { name: /Internet pendente/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole('link', { name: /fatura.pdf/ }).click();
  await expect(page).toHaveURL(/\/importacoes-whatsapp\/pending-import$/);
});
