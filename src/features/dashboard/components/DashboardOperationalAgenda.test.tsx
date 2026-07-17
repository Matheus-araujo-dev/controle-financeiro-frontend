import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { DashboardOperationalAgenda } from './DashboardOperationalAgenda';
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
    statusCodigo: 'PENDENTE',
    statusNome: 'Pendente',
    ...overrides
  };
}

function renderComponent(props: Partial<Parameters<typeof DashboardOperationalAgenda>[0]> = {}) {
  return render(
    <MemoryRouter>
      <DashboardOperationalAgenda items={[]} {...props} />
    </MemoryRouter>
  );
}

describe('DashboardOperationalAgenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no items', () => {
    renderComponent({ items: [] });
    expect(screen.getByText('Sem compromissos para o período.')).toBeInTheDocument();
  });

  it('renders items list', () => {
    renderComponent({ items: [makeItem({ descricao: 'Fornecedor ABC' })] });
    expect(screen.getByText('Fornecedor ABC')).toBeInTheDocument();
  });

  it('shows ContaPagar item with error border', () => {
    const { container } = renderComponent({ items: [makeItem({ tipoLancamento: 'ContaPagar' })] });
    expect(container.querySelector('.border-error')).toBeInTheDocument();
  });

  it('shows ContaReceber item with primary border', () => {
    const { container } = renderComponent({ items: [makeItem({ tipoLancamento: 'ContaReceber' })] });
    expect(container.querySelector('.border-primary')).toBeInTheDocument();
  });

  it('shows ContaPagar icon "payments"', () => {
    renderComponent({ items: [makeItem({ tipoLancamento: 'ContaPagar' })] });
    expect(screen.getByText('payments')).toBeInTheDocument();
  });

  it('shows ContaReceber icon "call_received"', () => {
    renderComponent({ items: [makeItem({ tipoLancamento: 'ContaReceber' })] });
    expect(screen.getByText('call_received')).toBeInTheDocument();
  });

  it('shows "Hoje" label for today items', () => {
    const today = new Date().toISOString().split('T')[0];
    renderComponent({ items: [makeItem({ dataVencimento: today })] });
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('shows formatted date for non-today items', () => {
    renderComponent({ items: [makeItem({ dataVencimento: '2026-07-20' })] });
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });

  it('shows person name', () => {
    renderComponent({ items: [makeItem({ pessoaNome: 'Fornecedor Beta' })] });
    expect(screen.getByText('Fornecedor Beta')).toBeInTheDocument();
  });

  it('navigates to /agenda when no referenceMonth', () => {
    renderComponent({ items: [], referenceMonth: undefined });
    const btn = screen.getByRole('button', { name: /Ver calendário/i });
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/agenda');
  });

  it('navigates to /agenda?mes=... when referenceMonth provided', () => {
    renderComponent({ items: [], referenceMonth: '2026-07' });
    const btn = screen.getByRole('button', { name: /Ver calendário/i });
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/agenda?mes=2026-07');
  });

  it('shows valor in error color for ContaPagar', () => {
    const { container } = renderComponent({ items: [makeItem({ tipoLancamento: 'ContaPagar', valor: 1000 })] });
    const amountEl = container.querySelector('.text-error.font-bold');
    expect(amountEl).toBeInTheDocument();
  });

  it('shows valor in primary color for ContaReceber', () => {
    const { container } = renderComponent({ items: [makeItem({ tipoLancamento: 'ContaReceber', valor: 1000 })] });
    const amountEl = container.querySelector('.text-primary.font-bold');
    expect(amountEl).toBeInTheDocument();
  });

  it('renders multiple items', () => {
    renderComponent({
      items: [
        makeItem({ id: 'i1', descricao: 'Despesa 1' }),
        makeItem({ id: 'i2', descricao: 'Despesa 2' }),
        makeItem({ id: 'i3', descricao: 'Despesa 3' })
      ]
    });
    expect(screen.getByText('Despesa 1')).toBeInTheDocument();
    expect(screen.getByText('Despesa 2')).toBeInTheDocument();
    expect(screen.getByText('Despesa 3')).toBeInTheDocument();
  });
});
