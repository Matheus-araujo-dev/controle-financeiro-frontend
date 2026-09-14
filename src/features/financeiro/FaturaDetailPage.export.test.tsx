import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    faturas: {
      obterPorId: vi.fn(),
      listarItens: vi.fn(),
      pagar: vi.fn(),
      fechar: vi.fn(),
      estornar: vi.fn(),
      listar: vi.fn(),
    },
  },
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
    pessoas: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testDetail = {
  id: 'fat1', cartaoId: 'c1', cartaoNome: 'Nubank', competencia: '2026-07',
  dataFechamento: '2026-07-25', dataVencimento: '2026-08-05', valorTotal: 3500,
  dataPagamento: null, statusCodigo: 'ABERTA' as const, statusNome: 'Aberta', quantidadeItens: 2,
  contaBancariaPagamentoId: null, contaBancariaPagamentoNome: null, observacao: null,
};

const testItens = [
  {
    contaPagarId: 'item1', descricao: 'Supermercado', recebedorNome: 'Extra', responsavelNome: null,
    dataCompra: '2026-07-10', valorLiquido: 2000, statusCodigo: 'PENDENTE',
    numeroParcela: 1, quantidadeParcelas: 1, ehEstorno: false,
  },
  {
    contaPagarId: 'item2', descricao: 'Estorno extra', recebedorNome: 'Extra', responsavelNome: null,
    dataCompra: '2026-07-12', valorLiquido: 100, statusCodigo: 'LIQUIDADA',
    numeroParcela: 1, quantidadeParcelas: 1, ehEstorno: true,
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { financeiroApi } = await import('../../services/http/financeiro-api');
  vi.mocked(financeiroApi.faturas.obterPorId).mockResolvedValue(testDetail as Awaited<ReturnType<typeof financeiroApi.faturas.obterPorId>>);
  vi.mocked(financeiroApi.faturas.listarItens).mockResolvedValue({
    items: testItens, page: 1, pageSize: 1000, totalItems: 2, totalPages: 1,
  } as Awaited<ReturnType<typeof financeiroApi.faturas.listarItens>>);

  const { FaturaDetailPage } = await import('./FaturaDetailPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/faturas/fat1']}>
        <Routes>
          <Route path="/faturas/:id" element={<FaturaDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FaturaDetailPage — export', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export fetches all items and calls createXlsxBlob covering ehEstorno true/false (signedValue and "Estorno" label branches)', async () => {
    await renderPage();
    expect(await screen.findByText('Supermercado')).toBeInTheDocument();
    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
    const { financeiroApi } = await import('../../services/http/financeiro-api');
    expect(vi.mocked(financeiroApi.faturas.listarItens)).toHaveBeenCalledWith('fat1', { page: 1, pageSize: 1000 });
  }, 25000);

  it('PDF desktop export (isPwa=false) opens landscape HTML with all printColumn lambdas covered', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Supermercado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: any) => r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
    expect(html).toContain('Supermercado');
  }, 25000);

  it('PDF mobile export (isPwa=true) opens portrait HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Supermercado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: any) => r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).toContain('A4 portrait');
  }, 25000);
});
