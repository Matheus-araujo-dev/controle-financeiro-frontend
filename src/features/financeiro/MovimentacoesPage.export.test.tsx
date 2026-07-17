import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovimentacoesPage } from './MovimentacoesPage';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';

// Mock only workbook — downloadRichExport and openPrintReport run for real,
// which invokes all richExportColumns and printColumns lambdas in MovimentacoesPage.
vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return {
    ...actual,
    createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])),
    downloadBlob: vi.fn(),
  };
});

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: { listar: vi.fn() },
    pessoas: { listar: vi.fn() }
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    movimentacoes: { listar: vi.fn(), obterPorId: vi.fn() }
  }
}));

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<MovimentacoesPage />, { wrapper: Wrapper });
}

function makeMov(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mov-1',
    dataMovimentacao: '2026-07-01',
    observacao: 'Salário',
    tipo: 'Entrada',
    valor: 3000,
    contaBancariaNome: 'Conta Principal',
    responsavelNome: 'Ana',
    statusNome: 'Efetivada',
    statusCodigo: 'EFETIVADA',
    contaReceberId: 'cr-1',
    contaPagarId: null,
    faturaCartaoId: null,
    ...overrides,
  };
}

describe('MovimentacoesPage — export column lambdas (real richExport/printReport)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [{ id: 'cb1', nome: 'Conta Principal', banco: 'Banco' }],
      page: 1, pageSize: 100, totalItems: 1, totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [{ id: 'p1', nome: 'Ana' }],
      page: 1, pageSize: 100, totalItems: 1, totalPages: 1
    } as never);
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() }
    } as unknown as Window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('XLSX export runs all richExportColumn lambdas: Entrada+Saida rows and null fields', async () => {
    // Two rows: Entrada with real values, Saida with null nullable fields.
    // Covers: observacao ?? '', contaBancariaNome ?? '', responsavelNome ?? '',
    //   tipo==='Entrada' ternaries (both branches), totalValue reduce ternary.
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [
        makeMov({ tipo: 'Entrada', observacao: 'Salário', contaBancariaNome: 'Conta', responsavelNome: 'Ana' }),
        makeMov({ id: 'mov-2', tipo: 'Saida', valor: 500, observacao: null, contaBancariaNome: null, responsavelNome: null, statusNome: null }),
      ],
      page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
      summary: { totalRegistros: 2, totalEntradas: 3000, totalSaidas: 500, saldoLiquido: 2500 },
    } as never);

    renderPage();
    expect(await screen.findByText('Salário')).toBeInTheDocument();

    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prevCalls = vi.mocked(createXlsxBlob).mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prevCalls)
    );
  }, 25000);

  it('PDF export runs all printColumn lambdas: saldo positivo (neutral type)', async () => {
    // Entrada row with all fields → covers tipo==='Entrada' branches → saldo >= 0 → type='neutral'
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [
        makeMov({ tipo: 'Entrada', observacao: 'Salário', contaBancariaNome: 'Conta', responsavelNome: 'Ana' }),
        makeMov({ id: 'mov-2', tipo: 'Saida', valor: 200, observacao: null, contaBancariaNome: null, responsavelNome: null, statusNome: null }),
      ],
      page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
      summary: { totalRegistros: 2, totalEntradas: 3000, totalSaidas: 200, saldoLiquido: 2800 },
    } as never);

    renderPage();
    expect(await screen.findByText('Salário')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
  }, 25000);

  it('PDF export with negative saldo covers saldo < 0 branch in handlePdfExport', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [makeMov({ tipo: 'Saida', valor: 1000, contaPagarId: 'cp-1', contaReceberId: null })],
      page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, totalEntradas: 0, totalSaidas: 1000, saldoLiquido: -1000 },
    } as never);

    renderPage();
    expect(await screen.findByText('Conta a pagar')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
  }, 25000);

  it('covers hasUrlParams=true, contaBancariaInicial branch and dataInicialParam/dataFinalParam', async () => {
    vi.stubGlobal('location', {
      search: '?contaBancariaId=cb1&dataInicial=2026-01-01&dataFinal=2026-12-31',
    });

    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1, pageSize: 20, totalItems: 0, totalPages: 1,
      summary: { totalRegistros: 0, totalEntradas: 0, totalSaidas: 0, saldoLiquido: 0 },
    } as never);

    renderPage();

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenCalledWith(
        expect.objectContaining({ contaBancariaIds: ['cb1'] })
      )
    );
  }, 15000);
});
