import {test,expect} from '@playwright/test';
test('explica risco do mês e permite consultar a composição diária',async({page})=>{
  const now=new Date();const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;const days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  await page.route('**/api/v1/dashboard/fluxo-caixa?**',route=>route.fulfill({json:{visao:'Caixa',dataInicial:`${month}-01`,dias:days,riscoSaldoNegativo:true,itens:Array.from({length:days},(_,i)=>({data:`${month}-${String(i+1).padStart(2,'0')}`,saldoInicial:i===0?100:-100,entradasPrevistas:0,saidasPrevistas:i===0?200:0,saldoFinalPrevisto:-100,riscoSaldoNegativo:true}))}}));
  await page.goto('/login');await page.getByLabel('Usuário técnico').fill('e2e');await page.getByLabel('Nome de exibição').fill('Validação E2E');await page.getByRole('button',{name:'Entrar'}).click();
  const health=page.getByRole('region',{name:'Saúde e previsão de caixa'});
  await expect(health.getByText(/Primeiro saldo negativo:/)).toBeVisible();
  await health.getByText('Ver composição diária').click();await expect(health.getByRole('table')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await health.getByRole('link',{name:'Consultar contas a pagar'}).click();await expect(page).toHaveURL(new RegExp(`contas-pagar\\?dataInicial=${month}-01&dataFinal=${month}-${days}`));
});
