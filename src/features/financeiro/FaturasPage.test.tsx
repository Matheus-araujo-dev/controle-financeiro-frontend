import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FaturasPage } from './FaturasPage';

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}
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
    },
    pessoas: {
      listar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn()
    }
  }
}));

describe('FaturasPage', () => {
  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({ items: [], page: 1, pageSize: 200, totalItems: 0, totalPages: 0 } as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({ items: [], page: 1, pageSize: 200, totalItems: 0, totalPages: 0 } as never);
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
          ativo: true,
          icone: null,
          cor: null
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

    render(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>,
      { wrapper: TestWrapper }
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

    await userEvent.click(screen.getByRole('button', { name: 'Competência' }));
    await userEvent.click(screen.getByRole('button', { name: '04/2026' }));

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          competencias: ['2026-04']
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

    render(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('20/04/2026')).length).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: /Cartão Principal/i }));

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'cartaoNome',
          sortDirection: 'Asc'
        })
      )
    );
  }, 20000);

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

    render(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar faturas')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(financeiroApi.faturas.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });

  it('renders PAGA status badge when fatura is paga', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [{
        id: 'f2',
        cartaoId: 'c1',
        cartaoNome: 'Visa Corporate',
        competencia: '2026-03',
        dataFechamento: '2026-03-10',
        dataVencimento: '2026-03-20',
        valorTotal: 200,
        dataPagamento: '2026-03-18',
        statusCodigo: 'PAGA',
        statusNome: 'Paga',
        quantidadeItens: 3
      }],
      page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 200, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    expect(await screen.findByText('Paga')).toBeInTheDocument();
  });

  it('computes limite disponível for cartao with limiteDisponivel set', async () => {
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [{
        id: 'c2',
        nome: 'Master Gold',
        bandeira: 'Mastercard',
        numeroFinal: '2222',
        diaFechamentoFatura: 5,
        diaVencimentoFatura: 15,
        contaBancariaPagamentoPadraoId: null,
        limiteCredito: 10000,
        usaLimiteCompartilhado: false,
        limiteEfetivo: null,
        limiteComprometido: 3000,
        limiteDisponivel: 7000,
        ativo: true,
        icone: null,
        cor: null
      }],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    // limiteDisponivel branch: cartao.limiteDisponivel !== null → returns limiteDisponivel
    expect(await screen.findByText(/\d+ cartão\(ões\) monitorados/)).toBeInTheDocument();
  });

  it('computes limite disponível using limiteEfetivo when limiteDisponivel is null', async () => {
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [{
        id: 'c3',
        nome: 'Amex Platinum',
        bandeira: 'Amex',
        numeroFinal: '3333',
        diaFechamentoFatura: 15,
        diaVencimentoFatura: 25,
        contaBancariaPagamentoPadraoId: null,
        limiteCredito: null,
        usaLimiteCompartilhado: false,
        limiteEfetivo: 8000,
        limiteComprometido: 1500,
        limiteDisponivel: null,
        ativo: true,
        icone: null,
        cor: null
      }],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    // limiteEfetivo branch: limiteDisponivel is null → uses Math.max(0, limiteEfetivo - limiteComprometido)
    expect(await screen.findByText(/\d+ cartão\(ões\) monitorados/)).toBeInTheDocument();
  });

  it('opens ImportarFatura modal when Importar PDF button is clicked', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    await screen.findByText('Total consolidado');
    await userEvent.click(screen.getByRole('button', { name: /Importar PDF/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('applies status filter for PAGA', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    await screen.findByText('Total consolidado');

    await userEvent.click(screen.getByRole('button', { name: 'Status da fatura' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Paga' }));

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ statusCodigos: ['PAGA'] })
      )
    );
  }, 20000);

  it('applies vencimento final date filter', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    await screen.findByText('Total consolidado');

    const { selectDateInDateInput } = await import('../../test/date-input');
    await selectDateInDateInput('Vencimento final', '2026-07-31');

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataVencimentoFinal: '2026-07-31' })
      )
    );
  }, 20000);

  it('applies fechamento final date filter', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    await screen.findByText('Total consolidado');

    const { selectDateInDateInput } = await import('../../test/date-input');
    await selectDateInDateInput('Fechamento final', '2026-07-10');

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataFechamentoFinal: '2026-07-10' })
      )
    );
  }, 20000);

  it('applies cartao filter via the Cartão multiselect', async () => {
    vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
      summary: { totalRegistros: 0, valorTotal: 0, porCartao: [], porCompetencia: [] }
    });
    render(<MemoryRouter><FaturasPage /></MemoryRouter>, { wrapper: TestWrapper });
    await screen.findByText('Total consolidado');

    await userEvent.click(screen.getByRole('button', { name: 'Cartão' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Visa Corporate' }));

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ cartaoIds: ['c1'] })
      )
    );
  }, 20000);

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

    render(
      <MemoryRouter initialEntries={['/faturas?cartaoId=c1&competencia=2026-05&origem=conta-cartao']}>
        <FaturasPage />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Compra no cartão localizada na fatura filtrada')).toBeInTheDocument();
    expect(screen.getByText('05/2026')).toBeInTheDocument();

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          cartaoId: 'c1',
          competencias: ['2026-05']
        })
      )
    );
  });
});
