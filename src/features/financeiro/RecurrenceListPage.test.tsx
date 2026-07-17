import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { financeiroApi } from '../../services/http/financeiro-api';
import { notify } from '../../store/notification-store';
import { RecurrenceListPage } from './RecurrenceListPage';
import { selectDateInDateInput } from '../../test/date-input';

vi.mock('../../store/notification-store', () => ({ notify: vi.fn() }));

vi.mock('../../shared/export/workbook', () => ({
  downloadBlob: vi.fn(),
  createXlsxBlob: vi.fn().mockReturnValue(new Blob(['xlsx'])),
  createCsvBlob: vi.fn().mockReturnValue(new Blob(['csv'])),
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    recorrencias: {
      listar: vi.fn(),
      pausar: vi.fn(),
      retomar: vi.fn()
    }
  }
}));

const recorrenciaPagar = {
  id: 'rec-1',
  tipoPeriodicidade: 'Mensal',
  tipoDia: 'DiaFixo',
  diaOrdemMensal: 8,
  dataInicio: '2026-06-08',
  dataFim: '2026-12-08',
  ativa: true,
  permiteEdicaoOcorrenciaIndividual: true,
  observacao: 'Aluguel principal',
  contaOrigemTipo: 'ContaPagar',
  contaOrigemId: 'cp-1',
  descricao: 'Aluguel da sede',
  valorLiquido: 450,
  pessoaNome: 'Fornecedor Fase 3',
  responsavelNome: 'Responsável Fase 3'
};

const recorrenciaReceber = {
  id: 'rec-2',
  tipoPeriodicidade: 'Mensal',
  tipoDia: 'DiaUtil',
  diaOrdemMensal: 5,
  dataInicio: '2026-06-05',
  dataFim: null,
  ativa: true,
  permiteEdicaoOcorrenciaIndividual: false,
  observacao: null,
  contaOrigemTipo: 'ContaReceber',
  contaOrigemId: 'cr-1',
  descricao: 'Contrato de consultoria',
  valorLiquido: 1200,
  pessoaNome: 'Cliente Fase 3',
  responsavelNome: 'Matheus'
};

function mockListar(items: Array<typeof recorrenciaPagar | typeof recorrenciaReceber>) {
  vi.mocked(financeiroApi.recorrencias.listar).mockResolvedValue({
    items,
    page: 1,
    pageSize: 20,
    totalItems: items.length,
    totalPages: 1,
    summary: {
      totalRegistros: items.length,
      valorTotal: items.reduce((sum, item) => sum + item.valorLiquido, 0)
    }
  } as never);
}

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    <MemoryRouter>
      <RecurrenceListPage />
    </MemoryRouter>,
    { wrapper: Wrapper }
  );
}

describe('RecurrenceListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeiroApi.recorrencias.pausar).mockResolvedValue({} as never);
    vi.mocked(financeiroApi.recorrencias.retomar).mockResolvedValue({} as never);
  });

  it('renders recurrence summary split between revenue and expense', async () => {
    mockListar([recorrenciaPagar, recorrenciaReceber]);

    renderPage();

    expect(await screen.findByText('Aluguel da sede')).toBeInTheDocument();
    expect(screen.getByText('Contrato de consultoria')).toBeInTheDocument();
    expect(screen.getByText('Receitas mensais')).toBeInTheDocument();
    expect(screen.getByText('Despesas mensais')).toBeInTheDocument();
    expect(screen.getAllByText('R$1.200,00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R$450,00').length).toBeGreaterThan(0);
  });

  it('filters recurring items by search', async () => {
    mockListar([recorrenciaPagar, recorrenciaReceber]);

    renderPage();

    await screen.findByText('Aluguel da sede');

    await userEvent.type(screen.getByLabelText('Busca de recorrências'), 'consultoria');

    await waitFor(() =>
      expect(financeiroApi.recorrencias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'consultoria',
          page: 1
        })
      )
    );
  });

  it('requests server-side sorting when clicking on the description header', async () => {
    mockListar([recorrenciaReceber, recorrenciaPagar]);

    renderPage();

    await screen.findByText('Contrato de consultoria');

    await userEvent.click(screen.getByRole('columnheader', { name: /descrição/i }));

    await waitFor(() =>
      expect(financeiroApi.recorrencias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'descricao',
          sortDirection: 'Asc'
        })
      )
    );
  });

  it('renders the status badge and the detail action for each recurrence', async () => {
    mockListar([recorrenciaReceber]);

    renderPage();

    await screen.findByText('Contrato de consultoria');

    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Detalhar' })).toHaveAttribute('href', '/recorrencias/rec-2');
  });

  it('pauses an active recurrence and notifies success', async () => {
    mockListar([recorrenciaPagar]);
    vi.mocked(financeiroApi.recorrencias.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0 }
    } as never);

    mockListar([recorrenciaPagar]);

    renderPage();

    await screen.findByText('Aluguel da sede');

    await userEvent.click(screen.getByRole('button', { name: /Pausar/i }));

    await waitFor(() => expect(financeiroApi.recorrencias.pausar).toHaveBeenCalledWith('rec-1'));
    expect(notify).toHaveBeenCalledWith('success', 'Recorrência pausada.');
  }, 15000);

  it('resumes a paused recurrence and notifies success', async () => {
    const recorrenciaPausada = { ...recorrenciaPagar, ativa: false };
    mockListar([recorrenciaPausada]);

    renderPage();

    await screen.findByText('Aluguel da sede');

    await userEvent.click(screen.getByRole('button', { name: /Retomar/i }));

    await waitFor(() => expect(financeiroApi.recorrencias.retomar).toHaveBeenCalledWith('rec-1'));
    expect(notify).toHaveBeenCalledWith('success', 'Recorrência retomada.');
  }, 15000);

  it('notifies error when toggle fails', async () => {
    vi.mocked(financeiroApi.recorrencias.pausar).mockRejectedValueOnce(new Error('falha'));
    mockListar([recorrenciaPagar]);

    renderPage();

    await screen.findByText('Aluguel da sede');

    await userEvent.click(screen.getByRole('button', { name: /Pausar/i }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith('error', 'Falha ao alterar status da recorrência.'));
  }, 15000);

  it('filters by tipo and status', async () => {
    mockListar([recorrenciaPagar, recorrenciaReceber]);

    renderPage();

    await screen.findByText('Aluguel da sede');

    await userEvent.click(screen.getByLabelText('Tipo'));
    await userEvent.click(await screen.findByRole('button', { name: 'Despesa' }));

    await waitFor(() =>
      expect(financeiroApi.recorrencias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: 'Pagar' })
      )
    );

    await userEvent.click(screen.getByLabelText('Status'));
    await userEvent.click(await screen.findByRole('button', { name: 'Ativa' }));

    await waitFor(() =>
      expect(financeiroApi.recorrencias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ ativa: true })
      )
    );
  }, 30000);

  it('renders error state with retry', async () => {
    vi.mocked(financeiroApi.recorrencias.listar)
      .mockRejectedValueOnce(new Error('Conexão falhou'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        summary: { totalRegistros: 0, valorTotal: 0 }
      } as never);

    renderPage();

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText(/Conex.o falhou/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(financeiroApi.recorrencias.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });

  it('applies dataReferenciaInicial date filter', async () => {
    mockListar([recorrenciaReceber]);
    renderPage();
    await screen.findByText('Contrato de consultoria');
    await selectDateInDateInput('Início de', '2026-07-01');
    await waitFor(() =>
      expect(financeiroApi.recorrencias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataReferenciaInicial: '2026-07-01' })
      )
    );
  }, 20000);

  it('applies dataReferenciaFinal date filter', async () => {
    mockListar([recorrenciaReceber]);
    renderPage();
    await screen.findByText('Contrato de consultoria');
    await selectDateInDateInput('Início até', '2026-12-01');
    await waitFor(() =>
      expect(financeiroApi.recorrencias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataReferenciaFinal: '2026-12-01' })
      )
    );
  }, 20000);

  it('triggers export and covers exportColumns lambdas including null responsavelNome and null dataFim', async () => {
    const { downloadBlob } = await import('../../shared/export/workbook');
    const itemNullFields = { ...recorrenciaPagar, responsavelNome: null, dataFim: null };
    mockListar([recorrenciaReceber, itemNullFields]);
    renderPage();
    await screen.findByText('Contrato de consultoria');
    const prevCallCount = vi.mocked(downloadBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadBlob).mock.calls.length).toBeGreaterThan(prevCallCount)
    );
  }, 15000);
});
