import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    recorrencias: {
      listar: vi.fn(),
      pausar: vi.fn(),
      retomar: vi.fn(),
      obterPorId: vi.fn(),
    },
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const testRows = [
  {
    id: 'rec1', tipoPeriodicidade: 1, tipoDia: 1, diaOrdemMensal: 5,
    dataInicio: '2025-01-05', dataFim: null, ativa: true, permiteEdicaoOcorrenciaIndividual: false,
    observacao: null, contaOrigemTipo: 'ContaReceber' as const,
    contaOrigemId: 'cr1', descricao: 'Aluguel Recebido', valorLiquido: 2500, pessoaNome: 'João', responsavelNome: 'Ana',
  },
  {
    id: 'rec2', tipoPeriodicidade: 1, tipoDia: 1, diaOrdemMensal: 10,
    dataInicio: '2025-03-10', dataFim: '2026-12-31', ativa: false, permiteEdicaoOcorrenciaIndividual: true,
    observacao: 'obs', contaOrigemTipo: 'ContaPagar' as const,
    contaOrigemId: 'cp1', descricao: 'Internet', valorLiquido: 120, pessoaNome: 'Vivo', responsavelNome: null,
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { financeiroApi } = await import('../../services/http/financeiro-api');
  vi.mocked(financeiroApi.recorrencias.listar).mockResolvedValue({
    items: testRows, page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
  } as Awaited<ReturnType<typeof financeiroApi.recorrencias.listar>>);

  const { RecurrenceListPage } = await import('./RecurrenceListPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <RecurrenceListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RecurrenceListPage — export (XLSX + PDF desktop only, no mobile)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: vi.fn(), close: vi.fn() },
    } as unknown as Window);
  });
  afterEach(() => vi.restoreAllMocks());

  it('XLSX export calls createXlsxBlob covering all lambdas (ContaReceber/ContaPagar, ativa true/false, dataFim null/non-null, responsavelNome null/non-null)', async () => {
    await renderPage();
    expect(await screen.findByText('Aluguel Recebido')).toBeInTheDocument();
    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF export opens print window regardless of isPwa (desktop-only export, no mobile routing)', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Aluguel Recebido')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());
    const html: string = (window.open as ReturnType<typeof vi.fn>).mock.results
      .flatMap((r: { value: { document: { write: ReturnType<typeof vi.fn> } } | null }) =>
        r.value?.document.write.mock?.calls ?? []).flat()[0] ?? '';
    expect(html).not.toContain('A4 portrait');
  }, 25000);
});
