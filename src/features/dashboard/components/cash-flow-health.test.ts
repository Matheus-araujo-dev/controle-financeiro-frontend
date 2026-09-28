import { describe, it, expect } from 'vitest';
import { analyzeCashFlow } from './cash-flow-health';
import type { DashboardFluxoCaixa } from '../../../types/dashboard';
export function flow(): DashboardFluxoCaixa {
  return {visao:'Caixa', dataInicial:'2027-02-01', dias:28, riscoSaldoNegativo:true, itens:Array.from({length:28},(_,i)=>({data:`2027-02-${String(i+1).padStart(2,'0')}`,saldoInicial:i===0?100:i===1?-100:200,entradasPrevistas:i===1?300:0,saidasPrevistas:i===0?200:0,saldoFinalPrevisto:i===0?-100:200,riscoSaldoNegativo:i===0}))};
}
describe('explicação do caixa oficial',()=>{
  it('identifica primeiro dia negativo mesmo recuperando no fim',()=>{
    expect(analyzeCashFlow(flow(),'2027-02')).toMatchObject({state:'ready',firstNegative:'2027-02-01',minimum:-100,change:100,final:200});
  });
  it('não confunde lista vazia com saúde financeira',()=>expect(analyzeCashFlow({...flow(),itens:[]},'2027-02').state).toBe('empty'));
  it('recusa mês anterior durante troca de competência',()=>expect(analyzeCashFlow(flow(),'2027-03').state).toBe('incomplete'));
  it.each(['missing','duplicate','nan','balance'] as const)('recusa série inconsistente: %s',kind=>{
    const data=flow();
    if(kind==='missing')data.itens.pop();
    if(kind==='duplicate')data.itens[1].data=data.itens[0].data;
    if(kind==='nan')data.itens[0].saldoFinalPrevisto=NaN;
    if(kind==='balance')data.itens[1].saldoInicial=999;
    expect(analyzeCashFlow(data,'2027-02').state).toBe('incomplete');
  });
  it('saldo zero não é negativo',()=>{
    const data=flow(); data.riscoSaldoNegativo=false;
    data.itens=data.itens.map(item=>({...item,saldoInicial:0,entradasPrevistas:0,saidasPrevistas:0,saldoFinalPrevisto:0,riscoSaldoNegativo:false}));
    expect(analyzeCashFlow(data,'2027-02')).toMatchObject({state:'ready',firstNegative:null,change:0,minimum:0});
  });
});
