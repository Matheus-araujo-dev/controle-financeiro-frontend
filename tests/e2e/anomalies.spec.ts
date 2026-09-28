import { test, expect } from '@playwright/test';

test('explica alerta determinístico e abre a conta de origem', async ({ page }) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await page.route('**/api/v1/**', route => route.fulfill({ json: { items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } }));
  await page.route('**/api/v1/dashboard/resumo?**', route => route.fulfill({ json: {
    saldoAtual: 100, totalAPagar: 200, totalAReceber: 0, saldoProjetado: -100,
    riscoSaldoNegativo: true, contasVencidas: [], contasAVencer: [], movimentacoesRecentes: []
  } }));
  await page.route('**/api/v1/dashboard/fluxo-caixa?**', route => route.fulfill({ json: {
    visao: 'Caixa', dataInicial: `${month}-01`, dias: 0, riscoSaldoNegativo: false, itens: []
  } }));
  await page.route('**/api/v1/dashboard/anomalias?**', route => route.fulfill({ json: {
    mesReferencia: month, historicoInicial: `${month}-01`, completo: true, contasAnalisadas: 2,
    itens: [{ id: 'duplicate', tipo: 'DuplicidadeProvavel', descricao: 'Internet',
      regra: 'Mesma descrição, data e valor. Confira os registros.', valorAtual: 100, valorBase: null,
      evidencias: [{ contaPagarId: '11111111-1111-1111-1111-111111111111', data: `${month}-05`, valor: 100 }] }]
  } }));
  await page.goto('/login');
  await page.getByLabel('Usuário técnico').fill('e2e');
  await page.getByLabel('Nome de exibição').fill('Validação E2E');
  await page.getByRole('button', { name: 'Entrar' }).click();
  const section = page.getByRole('region', { name: 'Alertas de cobranças' });
  await expect(section.getByText('Duplicidade provável')).toBeVisible();
  await expect(section.getByText(/Confira os registros/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await section.getByRole('link').click();
  await expect(page).toHaveURL(/contas-pagar\/11111111-1111-1111-1111-111111111111/);
});
