import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardAnomalies } from './DashboardAnomalies';

const data = {
  mesReferencia: '2027-04', historicoInicial: '2027-01-01', completo: true, contasAnalisadas: 4,
  itens: [{ id: 'alert-1', tipo: 'AumentoRecorrente', descricao: 'Internet',
    regra: 'Ao menos 20% e R$ 10 acima da mediana.', valorAtual: 120, valorBase: 100,
    evidencias: [{ contaPagarId: 'conta-1', data: '2027-04-05', valor: 120 }] }]
};
function show(props = {}) {
  return render(<MemoryRouter><DashboardAnomalies data={data} referenceMonth="2027-04" {...props} /></MemoryRouter>);
}
it('explica regra e abre a conta que sustenta o alerta', () => {
  show();
  expect(screen.getByText('Aumento recorrente')).toBeInTheDocument();
  expect(screen.getByText(data.itens[0].regra)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /05\/04\/2027/ })).toHaveAttribute('href', '/contas-pagar/conta-1');
});
it('erro oculta resultado anterior e oferece nova tentativa', () => {
  const retry = vi.fn(); show({ error: true, onRetry: retry });
  expect(screen.queryByText('Internet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); expect(retry).toHaveBeenCalledOnce();
});
it('carregamento não reaproveita alertas do mês anterior', () => {
  show({ loading: true }); expect(screen.queryByText('Internet')).not.toBeInTheDocument();
  expect(screen.getByText('Analisando cobranças')).toBeInTheDocument();
});
it.each([{ ...data, completo: false }, { ...data, mesReferencia: '2027-03' }])('não declara ausência de alertas com análise incompleta', (value) => {
  show({ data: value }); expect(screen.getByText('Análise indisponível para este recorte')).toBeInTheDocument();
  expect(screen.queryByText('Internet')).not.toBeInTheDocument();
});
it('explica que resultado vazio não garante ausência de problemas', () => {
  show({ data: { ...data, itens: [] } });
  expect(screen.getByText(/Nenhum sinal encontrado pelas regras/)).toBeInTheDocument();
  expect(screen.getByText(/não garante ausência de cobranças indevidas/)).toBeInTheDocument();
});
