import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardTransactionList } from './DashboardTransactionList';

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DashboardTransactionList', () => {
  it('renders Entrada movimentacao with + sign and primary color', () => {
    wrap(
      <DashboardTransactionList
        movimentacoes={[
          { id: 'm1', dataMovimentacao: '2026-07-15', tipo: 'Entrada', natureza: 'Realizada', valor: 500, observacaoResumida: 'Salário', contaPagarId: null, contaReceberId: 'cr1', faturaCartaoId: null }
        ]}
      />
    );
    expect(screen.getByText(/\+ R\$500,00/i)).toBeInTheDocument();
    expect(screen.getByText('Salário')).toBeInTheDocument();
  });

  it('renders Saida movimentacao with - sign and error color', () => {
    wrap(
      <DashboardTransactionList
        movimentacoes={[
          { id: 'm2', dataMovimentacao: '2026-07-16', tipo: 'Saida', natureza: 'Realizada', valor: 200, observacaoResumida: 'Aluguel', contaPagarId: 'cp1', contaReceberId: null, faturaCartaoId: null }
        ]}
      />
    );
    expect(screen.getByText(/- R\$200,00/i)).toBeInTheDocument();
  });

  it('shows fallback text when observacaoResumida is null', () => {
    wrap(
      <DashboardTransactionList
        movimentacoes={[
          { id: 'm3', dataMovimentacao: '2026-07-17', tipo: 'Entrada', natureza: 'Realizada', valor: 100, observacaoResumida: null, contaPagarId: null, contaReceberId: null, faturaCartaoId: null }
        ]}
      />
    );
    expect(screen.getByText('Movimentação financeira')).toBeInTheDocument();
  });

  it('renders empty state when no movimentacoes', () => {
    wrap(<DashboardTransactionList movimentacoes={[]} />);
    expect(screen.getByText('Ver histórico completo')).toBeInTheDocument();
  });
});
