import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AgendaPage } from './AgendaPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { listar: vi.fn() },
    contasReceber: { listar: vi.fn() }
  }
}));

import { financeiroApi } from '../../services/http/financeiro-api';

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/agenda${search}`]}>
      <QueryClientProvider client={createQC()}>
        <Routes>
          <Route path="/agenda" element={<AgendaPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const pagarItem = {
  id: 'cp-1',
  descricao: 'Aluguel',
  recebedorNome: 'Imobiliária XPTO',
  dataVencimento: '2026-07-15',
  valorLiquido: 2000,
  statusCodigo: 'PENDENTE',
  statusNome: 'Pendente'
};

const receberItem = {
  id: 'cr-1',
  descricao: 'Salário',
  pagadorNome: 'Empresa ABC',
  dataVencimento: '2026-07-05',
  valorLiquido: 5000,
  statusCodigo: 'LIQUIDADA',
  statusNome: 'Liquidada'
};

const canceladaItem = {
  ...pagarItem,
  id: 'cp-2',
  descricao: 'Assinatura cancelada',
  statusCodigo: 'CANCELADA',
  statusNome: 'Cancelada'
};

const pagedPagar = (items = [pagarItem]) => ({
  items,
  page: 1,
  pageSize: 300,
  totalItems: items.length,
  totalPages: 1
});

const pagedReceber = (items = [receberItem]) => ({
  items,
  page: 1,
  pageSize: 300,
  totalItems: items.length,
  totalPages: 1
});

const emptyPaged = { items: [], page: 1, pageSize: 300, totalItems: 0, totalPages: 1 };

describe('AgendaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders loading state while queries are pending', () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockReturnValue(new Promise(() => {}));
    vi.mocked(financeiroApi.contasReceber.listar).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/Carregando agenda/)).toBeInTheDocument();
  });

  it('renders empty state when no items are returned', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(emptyPaged as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage();
    expect(await screen.findByText(/Nenhum lançamento neste mês/)).toBeInTheDocument();
  });

  it('renders ContaPagar and ContaReceber items grouped by date', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar() as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(pagedReceber() as never);
    renderPage();
    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText('Salário')).toBeInTheDocument();
    expect(screen.getByText('Imobiliária XPTO')).toBeInTheDocument();
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument();
  });

  it('filters out CANCELADA items', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar([canceladaItem]) as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage();
    await waitFor(() => expect(financeiroApi.contasPagar.listar).toHaveBeenCalled());
    await waitFor(() => expect(financeiroApi.contasReceber.listar).toHaveBeenCalled());
    expect(screen.queryByText('Assinatura cancelada')).not.toBeInTheDocument();
    expect(await screen.findByText(/Nenhum lançamento/)).toBeInTheDocument();
  });

  it('shows summary cards with totals', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar() as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(pagedReceber() as never);
    renderPage();
    expect(await screen.findByText('Total a pagar')).toBeInTheDocument();
    expect(screen.getByText('Total a receber')).toBeInTheDocument();
    expect(screen.getByText('Saldo do mês')).toBeInTheDocument();
  });

  it('navigates to conta-pagar detail when ContaPagar item is clicked', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar() as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage();
    await screen.findByText('Aluguel');
    await userEvent.click(screen.getByText('Aluguel'));
    expect(mockNavigate).toHaveBeenCalledWith('/contas-pagar/cp-1');
  });

  it('navigates to conta-receber detail when ContaReceber item is clicked', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(emptyPaged as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(pagedReceber() as never);
    renderPage();
    await screen.findByText('Salário');
    await userEvent.click(screen.getByText('Salário'));
    expect(mockNavigate).toHaveBeenCalledWith('/contas-receber/cr-1');
  });

  it('navigates to previous month when Mês anterior button is clicked', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(emptyPaged as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage('?mes=2026-07');
    await screen.findByText(/Nenhum lançamento/);
    await userEvent.click(screen.getByLabelText('Mês anterior'));
    await waitFor(() =>
      expect(financeiroApi.contasPagar.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: '2026-06-01' })
      )
    );
  });

  it('navigates to next month when Próximo mês button is clicked', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(emptyPaged as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage('?mes=2026-07');
    await screen.findByText(/Nenhum lançamento/);
    await userEvent.click(screen.getByLabelText('Próximo mês'));
    await waitFor(() =>
      expect(financeiroApi.contasPagar.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: '2026-08-01' })
      )
    );
  });

  it('navigates back to current month when Hoje button is clicked', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(emptyPaged as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage('?mes=2025-01');
    await screen.findByText(/Nenhum lançamento/);
    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    await waitFor(() =>
      expect(financeiroApi.contasPagar.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: currentMonthStart })
      )
    );
  });

  it('shows VENCIDA status badge with error tone', async () => {
    const vencida = { ...pagarItem, statusCodigo: 'VENCIDA', statusNome: 'Vencida' };
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar([vencida]) as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage();
    expect(await screen.findByText('Vencida')).toBeInTheDocument();
  });

  it('shows PARCIAL status badge with warning tone', async () => {
    const parcial = { ...pagarItem, statusCodigo: 'PARCIAL', statusNome: 'Parcial' };
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar([parcial]) as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage();
    expect(await screen.findByText('Parcial')).toBeInTheDocument();
  });

  it('shows LIQUIDADA status badge with success tone', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(emptyPaged as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(pagedReceber() as never);
    renderPage();
    expect(await screen.findByText('Liquidada')).toBeInTheDocument();
  });

  it('shows multiple items on same day sorted by date', async () => {
    const item2 = { ...pagarItem, id: 'cp-2', descricao: 'Internet' };
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(pagedPagar([pagarItem, item2]) as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(emptyPaged as never);
    renderPage();
    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
  });
});
