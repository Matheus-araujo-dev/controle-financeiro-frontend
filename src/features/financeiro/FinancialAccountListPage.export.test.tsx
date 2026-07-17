import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FinancialAccountListPage } from './FinancialAccountListPage';

// Mock only workbook — downloadRichExport and openPrintReport run for real,
// invoking all richExportColumns and printColumns lambdas in FinancialAccountListPage.
vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return {
    ...actual,
    createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])),
    downloadBlob: vi.fn(),
  };
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

// Diverse test rows to cover all ?? and ternary branches in richExportColumns and printColumns:
// Row 1: LIQUIDADA, all non-null fields, has parcelas (covers non-null ?? branches and `&&` true branch)
// Row 2: LIQUIDADA, null valorLiquido (covers null ?? branch for valorLiquido in totalLiquidado reduce)
// Row 3: PENDENTE, all null nullable fields, no parcelas (covers null ?? branches and `&&` false branch)
const testRows = [
  {
    id: 'r1',
    descricao: 'Aluguel',
    numeroDocumento: 'DOC-001',
    recebedorNome: 'Maria',
    pagadorNome: null,
    responsavelNome: 'Ana',
    dataVencimento: '2026-07-15',
    numeroParcela: 1,
    quantidadeParcelas: 3,
    formaPagamentoNome: 'Pix',
    valorLiquido: 1200,
    statusNome: 'Liquidada',
    statusCodigo: 'LIQUIDADA',
    ehRecorrente: false,
  },
  {
    id: 'r2',
    descricao: 'Internet',
    numeroDocumento: null,
    recebedorNome: null,
    pagadorNome: 'Fornecedor',
    responsavelNome: null,
    dataVencimento: null,
    numeroParcela: null,
    quantidadeParcelas: null,
    formaPagamentoNome: null,
    valorLiquido: null,
    statusNome: null,
    statusCodigo: 'LIQUIDADA',
    ehRecorrente: false,
  },
  {
    id: 'r3',
    descricao: 'Luz',
    numeroDocumento: null,
    recebedorNome: null,
    pagadorNome: null,
    responsavelNome: null,
    dataVencimento: '2026-08-01',
    numeroParcela: null,
    quantidadeParcelas: null,
    formaPagamentoNome: null,
    valorLiquido: 200,
    statusNome: 'Pendente',
    statusCodigo: 'PENDENTE',
    ehRecorrente: true,
  },
];

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
      page: 1, pageSize: 10, search: '', statusCodigo: ['PENDENTE', 'VENCIDA']
    },
    defaultValues: {} as never,
    list: listFn,
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
    loadCartaoOptions: vi.fn().mockResolvedValue([]),
    loadRateioOptions: vi.fn().mockResolvedValue([]),
    buildSummaryItems: () => [],
  };
}

describe('FinancialAccountListPage — export column lambdas (real richExport/printReport)', () => {
  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    sessionStorage.clear();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() }
    } as unknown as Window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('XLSX export invokes all richExportColumn lambdas: null and non-null row fields, with parcelas and without', async () => {
    const list = vi.fn().mockResolvedValue({
      items: testRows,
      page: 1, pageSize: 20, totalItems: 3, totalPages: 1,
      summary: { totalRegistros: 3, valorTotal: 1400 },
    });
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Aluguel')).toBeInTheDocument();

    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prevCalls = vi.mocked(createXlsxBlob).mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prevCalls)
    );
  }, 25000);

  it('PDF export invokes all printColumn lambdas with LIQUIDADA+PENDENTE rows and null fields', async () => {
    const list = vi.fn().mockResolvedValue({
      items: testRows,
      page: 1, pageSize: 20, totalItems: 3, totalPages: 1,
      summary: { totalRegistros: 3, valorTotal: 1400 },
    });
    const config = buildConfig(list);

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Aluguel')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
  }, 25000);
});
