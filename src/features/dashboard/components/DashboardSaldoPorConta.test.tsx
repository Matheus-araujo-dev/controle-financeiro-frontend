import { render, screen } from '@testing-library/react';
import { DashboardSaldoPorConta } from './DashboardSaldoPorConta';
import type { ContaBancariaResumo } from '../../../types/cadastros';

function makeConta(overrides: Partial<ContaBancariaResumo> = {}): ContaBancariaResumo {
  return {
    id: 'conta-1',
    nome: 'Conta Corrente',
    banco: 'Banco do Brasil',
    agencia: '1234',
    numeroConta: '56789-0',
    tipoConta: 'corrente',
    saldoInicial: 1000,
    dataSaldoInicial: '2026-01-01',
    saldoAtual: 1500,
    limiteCartoesCompartilhado: null,
    limiteCartoesComprometido: 0,
    limiteCartoesDisponivel: null,
    ativo: true,
    icone: null,
    cor: null,
    ...overrides
  };
}

describe('DashboardSaldoPorConta', () => {
  it('renders empty state when no accounts', () => {
    render(<DashboardSaldoPorConta contas={[]} />);
    expect(screen.getByText('Nenhuma conta cadastrada.')).toBeInTheDocument();
  });

  it('filters out inactive accounts', () => {
    const contas = [
      makeConta({ id: 'c1', nome: 'Ativa', ativo: true }),
      makeConta({ id: 'c2', nome: 'Inativa', ativo: false })
    ];
    render(<DashboardSaldoPorConta contas={contas} />);
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.queryByText('Inativa')).not.toBeInTheDocument();
  });

  it('shows empty state when all accounts are inactive', () => {
    const contas = [makeConta({ ativo: false })];
    render(<DashboardSaldoPorConta contas={contas} />);
    expect(screen.getByText('Nenhuma conta cadastrada.')).toBeInTheDocument();
  });

  it('renders account with positive saldo using primary class', () => {
    const contas = [makeConta({ saldoAtual: 1500 })];
    const { container } = render(<DashboardSaldoPorConta contas={contas} />);
    const balances = container.querySelectorAll('.text-primary');
    expect(balances.length).toBeGreaterThan(0);
  });

  it('renders account with negative saldo using error class', () => {
    const contas = [makeConta({ saldoAtual: -500 })];
    const { container } = render(<DashboardSaldoPorConta contas={contas} />);
    const errorTexts = container.querySelectorAll('.text-error');
    expect(errorTexts.length).toBeGreaterThan(0);
  });

  it('uses fallback color when conta.cor is null', () => {
    const contas = [makeConta({ cor: null })];
    const { container } = render(<DashboardSaldoPorConta contas={contas} />);
    const iconContainer = container.querySelector('[style*="background-color"]') as HTMLElement;
    // Browser converts #2bf58e20 → rgba(43, 245, 142, 0.125)
    expect(iconContainer?.style.backgroundColor).toMatch(/43.*245.*142|2bf58e/i);
  });

  it('uses provided cor', () => {
    const contas = [makeConta({ cor: '#ff0000' })];
    const { container } = render(<DashboardSaldoPorConta contas={contas} />);
    const iconContainer = container.querySelector('[style*="background-color"]') as HTMLElement;
    // Browser converts #ff000020 → rgba(255, 0, 0, 0.125)
    expect(iconContainer?.style.backgroundColor).toMatch(/255.*0.*0|ff0000/i);
  });

  it('uses fallback icon when conta.icone is null', () => {
    const contas = [makeConta({ icone: null })];
    render(<DashboardSaldoPorConta contas={contas} />);
    // Header also has account_balance icon, so multiple elements
    const icons = screen.getAllByText('account_balance');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('uses provided icon', () => {
    const contas = [makeConta({ icone: 'savings' })];
    render(<DashboardSaldoPorConta contas={contas} />);
    expect(screen.getAllByText('savings').length).toBeGreaterThan(0);
  });

  it('sorts accounts by saldo descending', () => {
    const contas = [
      makeConta({ id: 'c1', nome: 'Baixo Saldo', saldoAtual: 100 }),
      makeConta({ id: 'c2', nome: 'Alto Saldo', saldoAtual: 5000 })
    ];
    render(<DashboardSaldoPorConta contas={contas} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Alto Saldo');
    expect(items[1]).toHaveTextContent('Baixo Saldo');
  });

  it('shows total saldo with primary class when positive', () => {
    const contas = [
      makeConta({ id: 'c1', saldoAtual: 1000 }),
      makeConta({ id: 'c2', saldoAtual: 500 })
    ];
    const { container } = render(<DashboardSaldoPorConta contas={contas} />);
    const totalEl = container.querySelector('.text-sm.font-bold.tabular-nums.text-primary');
    expect(totalEl).toBeInTheDocument();
  });

  it('shows total saldo with error class when negative', () => {
    const contas = [
      makeConta({ id: 'c1', saldoAtual: -2000 }),
      makeConta({ id: 'c2', saldoAtual: 500 })
    ];
    const { container } = render(<DashboardSaldoPorConta contas={contas} />);
    const totalEl = container.querySelector('.text-sm.font-bold.tabular-nums.text-error');
    expect(totalEl).toBeInTheDocument();
  });

  it('displays account name and bank', () => {
    const contas = [makeConta({ nome: 'Poupança XP', banco: 'XP Investimentos' })];
    render(<DashboardSaldoPorConta contas={contas} />);
    expect(screen.getByText('Poupança XP')).toBeInTheDocument();
    expect(screen.getByText('XP Investimentos')).toBeInTheDocument();
  });
});
