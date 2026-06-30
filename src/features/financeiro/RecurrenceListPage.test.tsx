import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { financeiroApi } from '../../services/http/financeiro-api';
import { RecurrenceListPage } from './RecurrenceListPage';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    recorrencias: {
      listar: vi.fn()
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
});
