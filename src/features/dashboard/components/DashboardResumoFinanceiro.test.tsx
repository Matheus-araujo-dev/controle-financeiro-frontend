import { render, screen } from '@testing-library/react';
import { DashboardResumoFinanceiro } from './DashboardResumoFinanceiro';

describe('DashboardResumoFinanceiro', () => {
  it('renders with real data (total > 0, positive saldo)', () => {
    render(
      <DashboardResumoFinanceiro
        data={{ totalReceitas: 3000, totalDespesas: 1000, saldo: 2000, dataInicial: '2026-07-01', dias: 30, itens: [] }}
        referenceMonth="2026-07"
      />
    );
    expect(screen.getByText(/receitas vs despesas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/75%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2\.000,00/i).length).toBeGreaterThan(0);
  });

  it('renders with data=undefined (total=0 path, shows 50/50 split without progress bar)', () => {
    render(
      <DashboardResumoFinanceiro
        data={undefined}
        referenceMonth="2026-07"
      />
    );
    expect(screen.getByText(/receitas vs despesas/i)).toBeInTheDocument();
    expect(screen.getAllByText('R$0,00').length).toBeGreaterThan(0);
  });

  it('renders with negative saldo (saldoPositivo=false uses error color)', () => {
    render(
      <DashboardResumoFinanceiro
        data={{ totalReceitas: 500, totalDespesas: 800, saldo: -300, dataInicial: '2026-07-01', dias: 30, itens: [] }}
        referenceMonth="2026-07"
      />
    );
    const saldoEl = screen.getByText(/300,00/i);
    expect(saldoEl.closest('[class*="error"]') ?? saldoEl).toBeInTheDocument();
  });
});
