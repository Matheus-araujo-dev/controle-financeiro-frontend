import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FinancialAccountListPage } from './FinancialAccountListPage';

vi.mock('../../shared/export/richExport', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/richExport')>('../../shared/export/richExport');
  return { ...actual, downloadRichExport: vi.fn() };
});

vi.mock('../../shared/export/printReport', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/printReport')>('../../shared/export/printReport');
  return { ...actual, openPrintReport: vi.fn() };
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

const baseItem = {
  id: '1',
  descricao: 'Aluguel',
  statusCodigo: 'PENDENTE',
  dataVencimento: '2026-04-10',
  ehRecorrente: true,
  valorLiquido: 120
};

const listResponse = {
  items: [baseItem],
  page: 1,
  pageSize: 10,
  totalItems: 1,
  totalPages: 1,
  summary: { totalRegistros: 1, valorTotal: 120 }
};

function buildConfig(listFn: ReturnType<typeof vi.fn>) {
  return {
    key: 'contas-pagar' as const,
    title: 'Contas a pagar',
    singularTitle: 'Conta a pagar',
    routeBase: '/contas-pagar',
    personLabel: 'Recebedor',
    personRole: 'recebedor' as const,
    listDescription: 'Desc',
    formDescription: 'Desc form',
    columns: [{ title: 'Descricao', dataIndex: 'descricao', key: 'descricao' }],
    defaultFilters: {
      page: 1,
      pageSize: 10,
      search: '',
      statusCodigo: ['PENDENTE', 'VENCIDA']
    },
    defaultValues: {} as never,
    list: listFn as never,
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    liquidar: vi.fn().mockResolvedValue({ id: '1' }),
    estornar: vi.fn().mockResolvedValue({ id: '1' }),
    cancelar: vi.fn(),
    gerarOcorrencias: vi.fn().mockResolvedValue({ id: '1' }),
    pausarRecorrencia: vi.fn().mockResolvedValue({ id: '1' }),
    encerrarRecorrencia: vi.fn().mockResolvedValue({ id: '1' }),
    toFormValues: vi.fn(),
    loadPessoaOptions: vi.fn().mockResolvedValue([]),
    loadResponsavelOptions: vi.fn().mockResolvedValue([]),
    loadFormaPagamentoOptions: vi.fn().mockResolvedValue([]),
    loadContaBancariaOptions: vi.fn().mockResolvedValue([]),
    loadCartaoOptions: vi.fn(),
    loadRateioOptions: vi.fn(),
    buildSummaryItems: (summary: unknown) => [
      { key: 'registros', label: 'Registros filtrados', value: String((summary as { totalRegistros: number }).totalRegistros) }
    ]
  };
}

describe('PROD-03: Saved views', () => {
  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders the saved views button', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');
    expect(screen.getByLabelText('Visões salvas')).toBeInTheDocument();
  }, 30000);

  it('opens dropdown and shows empty state', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');
    await userEvent.click(screen.getByLabelText('Visões salvas'));

    expect(await screen.findByText('Nenhuma visão salva ainda')).toBeInTheDocument();
  }, 30000);

  it('saves the current view and shows it in the dropdown', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    await userEvent.click(screen.getByLabelText('Visões salvas'));
    await userEvent.click(await screen.findByText('Salvar visão atual'));

    const nameInput = screen.getByPlaceholderText('Nome da visão...');
    await userEvent.type(nameInput, 'Minhas pendentes');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Minhas pendentes')).toBeInTheDocument();
  }, 30000);

  it('loads a saved view and applies filters to the list function', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    // Pre-seed a saved view in localStorage
    const viewData = [{
      id: 'test-view-1',
      name: 'Vencidas esta semana',
      filters: {
        search: '',
        statusCodigo: ['VENCIDA'],
        dataInicial: '2026-09-07',
        dataFinal: '2026-09-13'
      },
      createdAt: '2026-09-13T00:00:00Z'
    }];
    localStorage.setItem('saved-views:anonymous:contas-pagar', JSON.stringify(viewData));

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    // Open saved views dropdown
    await userEvent.click(screen.getByLabelText('Visões salvas'));

    // Click on saved view
    await userEvent.click(await screen.findByText('Vencidas esta semana'));

    // Should apply filters
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          statusCodigo: ['VENCIDA'],
          dataInicial: '2026-09-07',
          dataFinal: '2026-09-13'
        })
      )
    );
  }, 30000);

  it('deletes a saved view from the dropdown', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    // Save a view
    await userEvent.click(screen.getByLabelText('Visões salvas'));
    await userEvent.click(await screen.findByText('Salvar visão atual'));
    const nameInput = screen.getByPlaceholderText('Nome da visão...');
    await userEvent.type(nameInput, 'Para excluir');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Para excluir')).toBeInTheDocument();

    // Delete it
    await userEvent.click(screen.getByLabelText('Excluir visão Para excluir'));

    await waitFor(() =>
      expect(screen.queryByText('Para excluir')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Nenhuma visão salva ainda')).toBeInTheDocument();
  }, 30000);
});
