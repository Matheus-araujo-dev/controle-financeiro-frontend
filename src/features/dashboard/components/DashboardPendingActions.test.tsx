import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPendingActions } from './DashboardPendingActions';
import type { DashboardContaResumo } from '../../../types/dashboard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeItem(overrides: Partial<DashboardContaResumo> = {}): DashboardContaResumo {
  return {
    id: 'item-1',
    tipoLancamento: 'ContaPagar',
    descricao: 'Aluguel',
    pessoaNome: 'Imobiliária XYZ',
    dataVencimento: '2026-07-20',
    valor: 2500,
    statusCodigo: 'VENCIDA',
    statusNome: 'Vencida',
    ...overrides
  };
}

function renderComponent(props: Partial<Parameters<typeof DashboardPendingActions>[0]> = {}) {
  return render(
    <MemoryRouter>
      <DashboardPendingActions vencidas={[]} aVencer={[]} {...props} />
    </MemoryRouter>
  );
}

describe('DashboardPendingActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no items', () => {
    renderComponent();
    expect(screen.getByText('Tudo em dia! Sem pendências.')).toBeInTheDocument();
  });

  it('renders the header with "Pendências" title', () => {
    renderComponent();
    expect(screen.getByText('Pendências')).toBeInTheDocument();
  });

  it('shows vencidas badge count', () => {
    renderComponent({
      vencidas: [
        makeItem({ id: 'v1', descricao: 'Conta 1' }),
        makeItem({ id: 'v2', descricao: 'Conta 2' })
      ]
    });
    expect(screen.getByText('2 vencidas')).toBeInTheDocument();
  });

  it('shows singular vencida badge for single item', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'v1', descricao: 'Conta 1' })]
    });
    expect(screen.getByText('1 vencida')).toBeInTheDocument();
  });

  it('displays total pendente amount', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'v1', valor: 1000 })],
      aVencer: [makeItem({ id: 'a1', valor: 500, dataVencimento: '2099-12-31' })]
    });
    expect(screen.getByText('Total pendente')).toBeInTheDocument();
  });

  it('displays "Em atraso" section when there are vencidas', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'v1', valor: 1500 })]
    });
    expect(screen.getByText('Em atraso')).toBeInTheDocument();
  });

  it('renders vencidas group header', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'v1', descricao: 'Fatura elétrica' })]
    });
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
    expect(screen.getByText('Fatura elétrica')).toBeInTheDocument();
  });

  it('renders items that vence today under "Vencem hoje" group', () => {
    const today = new Date().toISOString().split('T')[0];
    renderComponent({
      aVencer: [makeItem({ id: 'a1', descricao: 'Boleto hoje', dataVencimento: today })]
    });
    expect(screen.getByText('Vencem hoje')).toBeInTheDocument();
    expect(screen.getByText('Boleto hoje')).toBeInTheDocument();
  });

  it('renders items within 7 days under "Próximos 7 dias" group', () => {
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    renderComponent({
      aVencer: [makeItem({ id: 'a1', descricao: 'Conta semana', dataVencimento: in3days })]
    });
    expect(screen.getByText('Próximos 7 dias')).toBeInTheDocument();
    expect(screen.getByText('Conta semana')).toBeInTheDocument();
  });

  it('renders items beyond 7 days under "Restante do mês" group', () => {
    const in15days = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    renderComponent({
      aVencer: [makeItem({ id: 'a1', descricao: 'Conta mês', dataVencimento: in15days })]
    });
    expect(screen.getByText('Restante do mês')).toBeInTheDocument();
    expect(screen.getByText('Conta mês')).toBeInTheDocument();
  });

  it('shows StatusBadge with "Vencida" for overdue items', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'v1', descricao: 'Item vencido' })]
    });
    expect(screen.getByText('Vencida')).toBeInTheDocument();
  });

  it('shows StatusBadge "A pagar" for ContaPagar items a vencer', () => {
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    renderComponent({
      aVencer: [makeItem({ id: 'a1', tipoLancamento: 'ContaPagar', dataVencimento: in3days })]
    });
    expect(screen.getByText('A pagar')).toBeInTheDocument();
  });

  it('shows StatusBadge "A receber" for ContaReceber items a vencer', () => {
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    renderComponent({
      aVencer: [makeItem({ id: 'a1', tipoLancamento: 'ContaReceber', dataVencimento: in3days })]
    });
    expect(screen.getByText('A receber')).toBeInTheDocument();
  });

  it('shows person name', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'v1', pessoaNome: 'Fornecedor Beta' })]
    });
    expect(screen.getByText('Fornecedor Beta')).toBeInTheDocument();
  });

  it('navigates to /contas-pagar/:id on click for ContaPagar', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'cp-123', tipoLancamento: 'ContaPagar' })]
    });
    fireEvent.click(screen.getByText('Aluguel'));
    expect(mockNavigate).toHaveBeenCalledWith('/contas-pagar/cp-123');
  });

  it('navigates to /contas-receber/:id on click for ContaReceber', () => {
    renderComponent({
      vencidas: [makeItem({ id: 'cr-456', tipoLancamento: 'ContaReceber' })]
    });
    fireEvent.click(screen.getByText('Aluguel'));
    expect(mockNavigate).toHaveBeenCalledWith('/contas-receber/cr-456');
  });

  it('calls onLiquidar when liquidar button clicked for vencida', () => {
    const onLiquidar = vi.fn();
    const item = makeItem({ id: 'v1', descricao: 'Para liquidar' });
    renderComponent({ vencidas: [item], onLiquidar });
    fireEvent.click(screen.getByLabelText('Liquidar Para liquidar'));
    expect(onLiquidar).toHaveBeenCalledWith(item);
  });

  it('does not show liquidar button for "Restante do mês" items', () => {
    const onLiquidar = vi.fn();
    const in15days = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    renderComponent({
      aVencer: [makeItem({ id: 'a1', descricao: 'Conta futura', dataVencimento: in15days })],
      onLiquidar
    });
    expect(screen.queryByLabelText('Liquidar Conta futura')).not.toBeInTheDocument();
  });

  it('renders valor in error color for ContaPagar', () => {
    const { container } = renderComponent({
      vencidas: [makeItem({ tipoLancamento: 'ContaPagar' })]
    });
    const errorAmount = container.querySelector('.text-error.font-bold');
    expect(errorAmount).toBeInTheDocument();
  });

  it('renders valor in primary color for ContaReceber', () => {
    const { container } = renderComponent({
      vencidas: [makeItem({ tipoLancamento: 'ContaReceber' })]
    });
    const primaryAmount = container.querySelector('.text-primary.font-bold');
    expect(primaryAmount).toBeInTheDocument();
  });
});
