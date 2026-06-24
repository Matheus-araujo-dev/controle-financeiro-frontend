import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FaturasPage } from './FaturasPage';
import { financeiroApi } from '../../services/http/financeiro-api';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { selectDateInDateInput } from '../../test/date-input';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: {},
    contasReceber: {},
    movimentacoes: {},
    faturas: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      pagar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    cartoes: {
      listar: vi.fn()
    }
  }
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });
}

function renderWithQueryClient(ui: Parameters<typeof render>[0]) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      {ui}
    </QueryClientProvider>
  );
}
describe('FaturasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [
        {
          id: 'c1',
          nome: 'Visa Corporate',
          bandeira: 'Visa',
          numeroFinal: '1111',
          diaFechamentoFatura: 10,
          diaVencimentoFatura: 20,
          contaBancariaPagamentoPadraoId: null,
          limiteCredito: null,
          usaLimiteCompartilhado: false,
          limiteEfetivo: null,
          limiteComprometido: 0,
          limiteDisponivel: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    });
  });

  it('loads invoices, renders summaries and applies search/filter changes', async () => {
    vi.mocked(financeiroApi.faturas.listar)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'f1',
            cartaoId: 'c1',
            cartaoNome: 'Visa Corporate',
            competencia: '2026-04',
            dataFechamento: '2026-04-10',
            dataVencimento: '2026-04-20',
            valorTotal: 150,
            dataPagamento: null,
            statusCodigo: 'ABERTA',
            statusNome: 'Aberta',
            quantidadeItens: 2
          }
        ],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        summary: {
          totalRegistros: 1,
          valorTotal: 150,
          porCartao: [
            {
              chave: 'c1',
              label: 'Visa Corporate',
              quantidadeFaturas: 1,
              valorTotal: 150
            }
          ],
          porCompetencia: [
            {
              chave: '2026-04',
              label: '2026-04',
              quantidadeFaturas: 1,
              valorTotal: 150
            }
          ]
        }
      })
      .mockResolvedValue({
        items: [
          {
            id: 'f1',
            cartaoId: 'c1',
            cartaoNome: 'Visa Corporate',
            competencia: '2026-04',
            dataFechamento: '2026-04-10',
            dataVencimento: '2026-04-20',
            valorTotal: 150,
            dataPagamento: null,
            statusCodigo: 'ABERTA',
            statusNome: 'Aberta',
            quantidadeItens: 2
          }
        ],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        summary: {
          totalRegistros: 1,
          valorTotal: 150,
          porCartao: [
            {
              chave: 'c1',
              label: 'Visa Corporate',
              quantidadeFaturas: 1,
              valorTotal: 150
            }
          ],
          porCompetencia: [
            {
              chave: '2026-04',
              label: '2026-04',
              quantidadeFaturas: 1,
              valorTotal: 150
            }
          ]
        }
      });

    renderWithQueryClient(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Total consolidado')).toBeInTheDocument();
    expect((await screen.findAllByText('20/04/2026')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Faturas filtradas')).toBeInTheDocument();
    expect(screen.getAllByText('R$150,00').length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByPlaceholderText(/Buscar por cart/i), 'abril');

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'abril'
        })
      )
    );

    await userEvent.type(screen.getAllByLabelText('Competência')[0], '042026');

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          competencia: '2026-04'
        })
      )
    );

    await selectDateInDateInput('Fechamento inicial', '2026-04-01');

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataFechamentoInicial: '2026-04-01'
        })
      )
    );
  }, 30000);

  it('envia a ordenacao por cartao ao clicar no cabecalho', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [
        {
          id: 'f1',
          cartaoId: 'c1',
          cartaoNome: 'Visa Corporate',
          competencia: '2026-04',
          dataFechamento: '2026-04-10',
          dataVencimento: '2026-04-20',
          valorTotal: 150,
          dataPagamento: null,
          statusCodigo: 'ABERTA',
          statusNome: 'Aberta',
          quantidadeItens: 2
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalRegistros: 1,
        valorTotal: 150,
        porCartao: [
          {
            chave: 'c1',
            label: 'Visa Corporate',
            quantidadeFaturas: 1,
            valorTotal: 150
          }
        ],
        porCompetencia: [
          {
            chave: '2026-04',
            label: '2026-04',
            quantidadeFaturas: 1,
            valorTotal: 150
          }
        ]
      }
    });

    renderWithQueryClient(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(financeiroApi.faturas.listar).toHaveBeenCalledTimes(1));

    await userEvent.click(await screen.findByRole('button', { name: /Cartão Principal/i }));

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'cartaoNome',
          sortDirection: 'Asc'
        })
      )
    );
  });

  it('renders the error state and allows retry', async () => {
    vi.mocked(financeiroApi.faturas.listar)
      .mockRejectedValueOnce(new Error('Falha ao carregar faturas'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        summary: {
          totalRegistros: 0,
          valorTotal: 0,
          porCartao: [],
          porCompetencia: []
        }
      });

    renderWithQueryClient(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar faturas')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(financeiroApi.faturas.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });

  it('initializes filters from the URL query string', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        valorTotal: 0,
        porCartao: [],
        porCompetencia: []
      }
    });

    renderWithQueryClient(
      <MemoryRouter initialEntries={['/faturas?cartaoId=c1&competencia=2026-05&origem=conta-cartao']}>
        <FaturasPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Compra no cartão localizada na fatura filtrada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('05/2026')).toBeInTheDocument();

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          cartaoId: 'c1',
          competencia: '2026-05'
        })
      )
    );
  });
});
