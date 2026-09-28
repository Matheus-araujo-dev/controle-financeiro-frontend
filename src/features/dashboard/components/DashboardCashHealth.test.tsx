import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {DashboardCashHealth} from './DashboardCashHealth';
import type {DashboardFluxoCaixa} from '../../../types/dashboard';
const data:DashboardFluxoCaixa={visao:'Caixa',dataInicial:'2027-02-01',dias:28,riscoSaldoNegativo:true,itens:Array.from({length:28},(_,i)=>({data:`2027-02-${String(i+1).padStart(2,'0')}`,saldoInicial:i===0?100:-100,entradasPrevistas:0,saidasPrevistas:i===0?200:0,saldoFinalPrevisto:-100,riscoSaldoNegativo:true}))};
function show(props={}){return render(<MemoryRouter><DashboardCashHealth data={data} referenceMonth="2027-02" {...props}/></MemoryRouter>);}
it('explica risco, tendência e abre os números oficiais',()=>{
  show(); expect(screen.getByText(/Primeiro saldo negativo: 01\/02\/2027/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Ver composição diária'));
  expect(screen.getByRole('table',{name:'Composição diária do caixa'})).toBeVisible();
  expect(screen.getByRole('link',{name:'Consultar contas a pagar'})).toHaveAttribute('href','/contas-pagar?dataInicial=2027-02-01&dataFinal=2027-02-28');
});
it('erro não mantém diagnóstico antigo',()=>{show({error:true});expect(screen.getByText('Previsão indisponível')).toBeInTheDocument();expect(screen.queryByText(/Primeiro saldo negativo:/)).not.toBeInTheDocument();});
it('carregamento não exibe dados do recorte anterior',()=>{show({loading:true});expect(screen.getByText('Atualizando previsão')).toBeInTheDocument();expect(screen.queryByText(/Primeiro saldo negativo:/)).not.toBeInTheDocument();});
it('vazio não informa saudável',()=>{show({data:{...data,itens:[]}});expect(screen.getByText('Sem dados de caixa')).toBeInTheDocument();expect(screen.queryByText('Saudável')).not.toBeInTheDocument();});
