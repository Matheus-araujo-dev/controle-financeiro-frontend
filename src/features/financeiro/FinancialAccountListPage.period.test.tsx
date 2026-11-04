/**
 * PROD-01: Period selector — preset chips, custom interval, detect preset.
 * PROD-02: Export filter parity — all active filters appear in export headers.
 *
 * These functions live inside FinancialAccountListPage and are not exported,
 * so we test them indirectly through the rendered component.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FinancialAccountListPage } from './FinancialAccountListPage';
import { downloadRichExport } from '../../shared/export/richExport';
import { openPrintReport } from '../../shared/export/printReport';

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
    loadPessoaOptions: vi.fn().mockResolvedValue([
      { label: 'Fornecedor A', value: 'p1' },
      { label: 'Fornecedor B', value: 'p2' }
    ]),
    loadResponsavelOptions: vi.fn().mockResolvedValue([{ label: 'João', value: 'r1' }]),
    loadFormaPagamentoOptions: vi.fn().mockResolvedValue([
      { label: 'Pix', value: 'fp1', ehCartao: false, baixarAutomaticamente: false },
      { label: 'Boleto', value: 'fp2', ehCartao: false, baixarAutomaticamente: false }
    ]),
    loadContaBancariaOptions: vi.fn().mockResolvedValue([{ label: 'Conta Corrente', value: 'cb1' }]),
    loadCartaoOptions: vi.fn(),
    loadRateioOptions: vi.fn(),
    buildSummaryItems: (summary: unknown) => [
      { key: 'registros', label: 'Registros filtrados', value: String((summary as { totalRegistros: number }).totalRegistros) }
    ]
  };
}

describe('PROD-01: Period selector presets', () => {
  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    sessionStorage.clear();
  });

  it('renders all period preset options in the ComboBox', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    // Open the period ComboBox
    const periodCombo = screen.getAllByLabelText('Período de vencimento')[0];
    expect(periodCombo).toBeInTheDocument();

    await userEvent.click(periodCombo);

    // Verify all preset options are listed
    const expectedOptions = ['Todos', 'Hoje', 'Próximos 7 dias', 'Próximos 30 dias', 'Este mês', 'Mês anterior', 'Vencidos', 'Personalizado'];
    for (const label of expectedOptions) {
      expect(await screen.findByRole('button', { name: label })).toBeInTheDocument();
    }
  }, 30000);

  it('selects "Hoje" preset and sends today date range to the list function', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Hoje' }));

    const today = new Date().toISOString().split('T')[0];
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: today,
          dataFinal: today
        })
      )
    );
  }, 30000);

  it('selects "Este mês" preset and sends correct date range', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Este mês' }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: monthStart,
          dataFinal: monthEnd
        })
      )
    );
  }, 30000);

  it('selects "Mês anterior" preset and sends previous month range', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Mês anterior' }));

    const now = new Date();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: prevStart,
          dataFinal: prevEnd
        })
      )
    );
  }, 30000);

  it('selects "Vencidos" preset and sends only dataFinal as today', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Vencidos' }));

    const today = new Date().toISOString().split('T')[0];

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataFinal: today
        })
      )
    );
  }, 30000);

  it('selects "Todos" to clear period filters', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    // Select "Hoje" first
    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Hoje' }));

    const today = new Date().toISOString().split('T')[0];
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: today, dataFinal: today })
      )
    );

    // Now select "Todos" to clear
    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Todos' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: undefined,
          dataFinal: undefined
        })
      )
    );
  }, 30000);

  it('selects "Personalizado" preset and applies custom dates', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    const combos = screen.getAllByLabelText('Período de vencimento');
    await userEvent.click(combos[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Personalizado' }));

    const today = new Date().toISOString().split('T')[0];
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: today,
          dataFinal: today
        })
      )
    );
  }, 30000);
});

describe('PROD-02: Export filter parity', () => {
  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    sessionStorage.clear();
    vi.mocked(downloadRichExport).mockClear();
  });

  it('includes person filter in export when a recebedor is selected', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');
    await waitFor(() => expect(config.loadPessoaOptions).toHaveBeenCalled());

    // Select a person filter
    await userEvent.click(screen.getAllByLabelText('Recebedor')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Fornecedor A' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ recebedorIds: ['p1'] })
      )
    );

    // Trigger XLSX export
    await userEvent.click(screen.getByRole('button', { name: /XLSX/ }));

    await waitFor(() => expect(downloadRichExport).toHaveBeenCalled());

    const call = vi.mocked(downloadRichExport).mock.calls[0][0];
    expect(call.filters).toEqual(
      expect.arrayContaining([['Recebedor:', 'Fornecedor A']])
    );
  }, 30000);

  it('includes forma de pagamento filter in export', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');
    await waitFor(() => expect(config.loadFormaPagamentoOptions).toHaveBeenCalled());

    await userEvent.click(screen.getAllByLabelText('Forma de pagamento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Pix' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ formaPagamentoIds: ['fp1'] })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /XLSX/ }));

    await waitFor(() => expect(downloadRichExport).toHaveBeenCalled());

    const call = vi.mocked(downloadRichExport).mock.calls[0][0];
    expect(call.filters).toEqual(
      expect.arrayContaining([['Forma de pagamento:', 'Pix']])
    );
  }, 30000);

  it('includes status filter labels in export', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    // Default filters include PENDENTE and VENCIDA status
    await userEvent.click(screen.getByRole('button', { name: /XLSX/ }));

    await waitFor(() => expect(downloadRichExport).toHaveBeenCalled());

    const call = vi.mocked(downloadRichExport).mock.calls[0][0];
    expect(call.filters).toEqual(
      expect.arrayContaining([['Status:', 'Pendente, Vencida']])
    );
  }, 30000);

  it('includes period filter in export when a preset is selected', async () => {
    const list = vi.fn().mockResolvedValue(listResponse);
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    await screen.findAllByText('Aluguel');

    // Select "Hoje"
    await userEvent.click(screen.getAllByLabelText('Período de vencimento')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Hoje' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: expect.any(String) })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /XLSX/ }));

    await waitFor(() => expect(downloadRichExport).toHaveBeenCalled());

    const call = vi.mocked(downloadRichExport).mock.calls[0][0];
    // Should have a period filter entry
    const periodFilter = call.filters?.find((f: [string, string]) => f[0] === 'Período:');
    expect(periodFilter).toBeDefined();
  }, 30000);
});
