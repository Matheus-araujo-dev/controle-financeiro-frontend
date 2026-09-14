import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as printReportShared from '../../shared/export/printReportShared';

vi.mock('../../shared/export/printReportShared', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/printReportShared')>('../../shared/export/printReportShared');
  return { ...actual, openInWindow: vi.fn() };
});

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { listar: vi.fn() },
    contasReceber: { listar: vi.fn() },
  },
}));

vi.mock('../../shared/export/workbook', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/workbook')>('../../shared/export/workbook');
  return { ...actual, createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])), downloadBlob: vi.fn() };
});

const pagarRows = [
  {
    id: 'cp1', descricao: 'Aluguel', recebedorNome: 'Maria', pagadorNome: null,
    dataVencimento: '2026-07-15', valorLiquido: 1200, statusCodigo: 'PENDENTE', statusNome: 'Pendente',
    ehRecorrente: false, numeroParcela: null, quantidadeParcelas: null,
    responsavelNome: null, formaPagamentoNome: null, numeroDocumento: null,
  },
];

const receberRows = [
  {
    id: 'cr1', descricao: 'Consultoria', pagadorNome: 'Empresa X', recebedorNome: null,
    dataVencimento: '2026-07-20', valorLiquido: 3000, statusCodigo: 'LIQUIDADA', statusNome: 'Liquidada',
    ehRecorrente: false, numeroParcela: null, quantidadeParcelas: null,
    responsavelNome: null, formaPagamentoNome: null, numeroDocumento: null,
  },
];

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

async function renderPage() {
  const { financeiroApi } = await import('../../services/http/financeiro-api');
  vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue({
    items: pagarRows, page: 1, pageSize: 300, totalItems: 1, totalPages: 1,
  } as unknown as Awaited<ReturnType<typeof financeiroApi.contasPagar.listar>>);
  vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue({
    items: receberRows, page: 1, pageSize: 300, totalItems: 1, totalPages: 1,
  } as unknown as Awaited<ReturnType<typeof financeiroApi.contasReceber.listar>>);

  const { AgendaPage } = await import('./AgendaPage');
  const qc = createQC();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AgendaPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AgendaPage — export', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(printReportShared.openInWindow).mockClear();
  });

  it('XLSX export calls createXlsxBlob covering both ContaPagar and ContaReceber rows (signedValue ternary both branches)', async () => {
    await renderPage();
    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    const { createXlsxBlob } = await import('../../shared/export/workbook');
    const prev = vi.mocked(createXlsxBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() => expect(vi.mocked(createXlsxBlob).mock.calls.length).toBeGreaterThan(prev));
  }, 25000);

  it('PDF desktop export (isPwa=false) opens landscape HTML', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(vi.mocked(printReportShared.openInWindow)).toHaveBeenCalled());
    const html: string = vi.mocked(printReportShared.openInWindow).mock.calls[0][0];
    expect(html).not.toContain('A4 portrait');
  }, 25000);

  it('PDF mobile export (isPwa=true) opens portrait HTML grouped by date', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    await renderPage();
    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() => expect(vi.mocked(printReportShared.openInWindow)).toHaveBeenCalled());
    const html: string = vi.mocked(printReportShared.openInWindow).mock.calls[0][0];
    expect(html).toContain('A4 portrait');
  }, 25000);
});
