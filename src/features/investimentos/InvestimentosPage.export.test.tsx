import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/http/investimentos-api', () => ({
  investimentosApi: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    encerrar: vi.fn(),
    reativar: vi.fn(),
    atualizarValorAtual: vi.fn(),
    obterPorId: vi.fn(),
  },
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
    pessoas: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
    responsaveis: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testRows = [
  {
    id: 'inv1', nome: 'Tesouro IPCA+', emissor: 'Tesouro Nacional', tipo: 1, tipoLabel: 'Renda Fixa',
    liquidez: 2, liquidezLabel: 'No vencimento', valorInvestido: 5000, valorAtual: 5400, rendimento: 400,
    rendimentoPercent: 8, dataAplicacao: '2025-01-10', dataVencimento: '2027-01-10', taxaAnual: 6.5,
    contaBancariaVinculadaId: 'cb1', contaBancariaNome: 'Nubank', encerrado: false, createdAtUtc: '2025-01-10T00:00:00Z',
  },
  {
    id: 'inv2', nome: 'CDB XP', emissor: null, tipo: 1, tipoLabel: 'Renda Fixa',
    liquidez: 1, liquidezLabel: 'Diária', valorInvestido: 2000, valorAtual: 2100, rendimento: 100,
    rendimentoPercent: 5, dataAplicacao: '2025-03-01', dataVencimento: null, taxaAnual: null,
    contaBancariaVinculadaId: 'cb2', contaBancariaNome: 'XP', encerrado: true, createdAtUtc: '2025-03-01T00:00:00Z',
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { investimentosApi } = await import('../../services/http/investimentos-api');
  vi.mocked(investimentosApi.listar).mockResolvedValue({
    items: testRows, page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
  } as ReturnType<typeof investimentosApi.listar> extends Promise<infer T> ? T : never);

  const { InvestimentosPage } = await import('./InvestimentosPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <InvestimentosPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { qc };
}

describe('InvestimentosPage — export', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export calls createXlsxBlob covering all column lambdas (emissor null/non-null, dataVencimento null/non-null, taxaAnual null/non-null, encerrado true/false)', async () => {
    await renderPage();
    expect(await screen.findByText('Tesouro IPCA+')).toBeInTheDocument();

    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF desktop export (isPwa=false) calls window.open with landscape HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Tesouro IPCA+')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
  }, 25000);

  it('PDF mobile export (isPwa=true) calls openMobilePrintReport with portrait HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Tesouro IPCA+')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).toContain('A4 portrait');
  }, 25000);
});
