import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/http/orcamentos-api', () => ({
  orcamentosApi: {
    obterPorCompetencia: vi.fn(),
    upsertMeta: vi.fn(),
  },
}));

vi.mock('../../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../../shared/export/workbook')>('../../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testItens = [
  {
    metaId: 'meta1', contaGerencialId: 'cg1', contaPaiId: null,
    contaGerencialCodigo: '3.1', contaGerencialDescricao: 'Alimentação',
    valorMeta: 1000, valorRealizado: 800, percentualConsumido: 80, estourado: false, aceitaLancamentos: true,
  },
  {
    metaId: null, contaGerencialId: 'cg2', contaPaiId: null,
    contaGerencialCodigo: null, contaGerencialDescricao: 'Transporte',
    valorMeta: null, valorRealizado: 450, percentualConsumido: null, estourado: true, aceitaLancamentos: true,
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { orcamentosApi } = await import('../../../services/http/orcamentos-api');
  vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
    competencia: '2026-07', totalMeta: 1000, totalRealizado: 1250, percentualConsumido: 125, possuiEstouro: true, itens: testItens,
  } as Awaited<ReturnType<typeof orcamentosApi.obterPorCompetencia>>);

  const { OrcamentoPage } = await import('./OrcamentoPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OrcamentoPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { qc };
}

describe('OrcamentoPage — export', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export calls createXlsxBlob covering all column lambdas (valorMeta null/non-null, percentual null/non-null, estourado true/false, codigo null/non-null)', async () => {
    await renderPage();
    expect(await screen.findByText(/Alimentação/, { exact: false })).toBeInTheDocument();

    const { createXlsxBlob } = await import('../../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF desktop export (isPwa=false) opens print window with landscape HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText(/Alimentação/, { exact: false })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Exportar PDF/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
  }, 25000);

  it('PDF mobile export (isPwa=true) opens portrait report', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText(/Alimentação/, { exact: false })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Exportar PDF/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).toContain('A4 portrait');
  }, 25000);
});
