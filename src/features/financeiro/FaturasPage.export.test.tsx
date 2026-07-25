import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    faturas: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      pagar: vi.fn(),
      fechar: vi.fn(),
      estornar: vi.fn(),
      listarItens: vi.fn(),
    },
  },
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    cartoes: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
    contasBancarias: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testRows = [
  {
    id: 'f1', cartaoId: 'c1', cartaoNome: 'Nubank', competencia: '2026-07',
    dataFechamento: '2026-07-25', dataVencimento: '2026-08-05', valorTotal: 2000,
    dataPagamento: null, statusCodigo: 'ABERTA' as const, statusNome: 'Aberta', quantidadeItens: 5,
  },
  {
    id: 'f2', cartaoId: 'c2', cartaoNome: 'XP', competencia: '2026-06',
    dataFechamento: '2026-06-25', dataVencimento: '2026-07-05', valorTotal: 1500,
    dataPagamento: '2026-07-01', statusCodigo: 'PAGA' as const, statusNome: 'Paga', quantidadeItens: 3,
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { financeiroApi } = await import('../../services/http/financeiro-api');
  vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
    items: testRows, page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
    summary: { totalRegistros: 2, valorTotal: 3500, porCartao: [], porCompetencia: [] },
  } as Awaited<ReturnType<typeof financeiroApi.faturas.listar>>);

  const { FaturasPage } = await import('./FaturasPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FaturasPage — export', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export calls createXlsxBlob covering all lambdas (dataPagamento null/non-null, statusCodigo ABERTA/PAGA)', async () => {
    await renderPage();
    expect(await screen.findByText('Nubank')).toBeInTheDocument();
    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF desktop export (isPwa=false) opens landscape HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Nubank')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
  }, 25000);

  it('PDF mobile export (isPwa=true) opens portrait HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Nubank')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).toContain('A4 portrait');
  }, 25000);
});
