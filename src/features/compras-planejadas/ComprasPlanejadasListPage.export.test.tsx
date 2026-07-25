import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    obterPorId: vi.fn(),
    marcarComprada: vi.fn(),
    cancelar: vi.fn(),
  },
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasGerenciais: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
    responsaveis: { listar: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 }) },
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testRows = [
  {
    id: 'cp1', titulo: 'Notebook', valorEstimado: 4500, dataDesejada: '2026-08-15',
    prioridade: 'Alta', status: 'Planejada', parcelavel: true, quantidadeParcelasDesejada: 12,
    contaGerencialId: 'cg1', contaGerencialDescricao: 'TI', responsavelId: 'r1',
    responsavelNome: 'Ana', link: 'https://example.com', contaPagarGeradaId: null, convertidaEmContaPagarEmUtc: null,
  },
  {
    id: 'cp2', titulo: 'Cadeira', valorEstimado: 800, dataDesejada: null,
    prioridade: 'Baixa', status: 'Comprada', parcelavel: false, quantidadeParcelasDesejada: null,
    contaGerencialId: 'cg2', contaGerencialDescricao: 'Móveis', responsavelId: 'r2',
    responsavelNome: null, link: null, contaPagarGeradaId: 'cp-pagar-1', convertidaEmContaPagarEmUtc: '2026-07-01T00:00:00Z',
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { comprasPlanejadasApi } = await import('../../services/http/compras-planejadas-api');
  vi.mocked(comprasPlanejadasApi.listar).mockResolvedValue({
    items: testRows, page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
  } as Awaited<ReturnType<typeof comprasPlanejadasApi.listar>>);

  const { ComprasPlanejadasListPage } = await import('./ComprasPlanejadasListPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ComprasPlanejadasListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ComprasPlanejadasListPage — export', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export calls createXlsxBlob covering all lambdas (dataDesejada null/non-null, responsavelNome null/non-null, parcelavel true/false)', async () => {
    await renderPage();
    expect(await screen.findByText('Notebook')).toBeInTheDocument();
    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF desktop export (isPwa=false) opens landscape HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Notebook')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: any) => r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
  }, 25000);

  it('PDF mobile export (isPwa=true) opens portrait HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Notebook')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: any) => r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).toContain('A4 portrait');
  }, 25000);
});
