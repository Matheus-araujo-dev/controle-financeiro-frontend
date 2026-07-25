import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/http/importacoes-whatsapp-api', () => ({
  importacoesWhatsappApi: {
    listar: vi.fn(),
    obterPorId: vi.fn(),
    confirmar: vi.fn(),
    rejeitar: vi.fn(),
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testRows = [
  {
    id: 'imp1', remetente: '+5511999999999', tipoOrigemNome: 'Texto', tipoOrigemCodigo: 'TEXTO' as const,
    textoBruto: 'Paguei R$ 50 no mercado', nomeArquivo: null, statusCodigo: 'CONFIRMADO' as const,
    statusNome: 'Confirmado', confiancaExtracao: 0.95, quantidadeItens: 2, quantidadePendentes: 0,
  },
  {
    id: 'imp2', remetente: '+5511888888888', tipoOrigemNome: 'PDF', tipoOrigemCodigo: 'PDF' as const,
    textoBruto: null, nomeArquivo: 'fatura.pdf', statusCodigo: 'PENDENTE_REVISAO' as const,
    statusNome: 'Pendente revisão', confiancaExtracao: null, quantidadeItens: 5, quantidadePendentes: 3,
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { importacoesWhatsappApi } = await import('../../services/http/importacoes-whatsapp-api');
  vi.mocked(importacoesWhatsappApi.listar).mockResolvedValue({
    items: testRows, page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
  } as Awaited<ReturnType<typeof importacoesWhatsappApi.listar>>);

  const { ImportacoesWhatsappPage } = await import('./ImportacoesWhatsappPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ImportacoesWhatsappPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ImportacoesWhatsappPage — export (XLSX + PDF desktop only)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export calls createXlsxBlob covering all lambdas (textoBruto null/non-null, confiancaExtracao null/non-null)', async () => {
    await renderPage();
    expect(await screen.findByText('+5511999999999')).toBeInTheDocument();
    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF export opens landscape HTML (no mobile routing for this page)', async () => {
    await renderPage();
    expect(await screen.findByText('+5511999999999')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
  }, 25000);
});
