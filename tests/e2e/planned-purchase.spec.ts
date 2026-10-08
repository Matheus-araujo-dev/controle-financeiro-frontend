import { test, expect } from '@playwright/test';

test('cadastra compra sem data e envia a foto selecionada', async ({ page }) => {
  let creationCount = 0;
  let receivedDate: unknown = 'not submitted';
  let uploadReceived = false;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = { items: [], totalItems: 0, page: 1, pageSize: 100, totalPages: 0 };
    if (path.endsWith('/contas-gerenciais')) json = { items: [{ id: 'category', codigo: '2.1', descricao: 'Tecnologia', tipo: 'Despesa', ativo: true, aceitaLancamentos: true }] };
    else if (path.endsWith('/pessoas')) json = { items: [{ id: 'person', nome: 'Matheus', ativo: true }] };
    else if (path.endsWith('/compras-planejadas') && route.request().method() === 'POST') {
      creationCount++;
      receivedDate = route.request().postDataJSON().dataDesejada;
      json = { id: 'planned-one' };
    } else if (path.endsWith('/anexos/compras-planejadas/planned-one')) {
      uploadReceived = route.request().postData()?.includes('mouse.png') === true;
      json = { id: 'photo-one' };
    }
    await route.fulfill({ json });
  });
  await page.goto('/login');
  await page.getByLabel('Usuário técnico').fill('e2e');
  await page.getByLabel('Nome de exibição').fill('Validação E2E');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/dashboard$/);
  await page.goto('/compras-planejadas/novo');
  await page.getByLabel('Título da Compra', { exact: true }).fill('Mouse novo');
  await page.getByLabel('Valor Estimado (R$)', { exact: true }).fill('200');
  await page.getByLabel('Conta Gerencial', { exact: true }).click();
  await page.getByRole('button', { name: '2.1 - Tecnologia', exact: true }).click();
  await page.getByLabel('Responsável', { exact: true }).click();
  await page.getByRole('button', { name: 'Matheus', exact: true }).click();
  await page.getByLabel('Fotos do produto', { exact: true }).setInputFiles({
    name: 'mouse.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
  });
  await expect(page.getByText('Data desejada é opcional.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole('button', { name: 'Confirmar Planejamento' }).click();
  await expect(page).toHaveURL(/\/compras-planejadas$/);
  expect(receivedDate).toBeNull();
  expect(creationCount).toBe(1);
  expect(uploadReceived).toBe(true);
});
