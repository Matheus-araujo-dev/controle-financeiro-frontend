import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovimentacoesPage } from './MovimentacoesPage';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { selectDateInDateInput } from '../../test/date-input';

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: {
      listar: vi.fn()
    },
    pessoas: {
      listar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    movimentacoes: {
      listar: vi.fn(),
      obterPorId: vi.fn()
    }
  }
}));

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<MovimentacoesPage />, { wrapper: Wrapper });
}

describe('MovimentacoesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [
        {
          id: 'cb1',
          nome: 'Conta principal',
          banco: 'Banco Exemplo'
        },
        {
          id: 'cb2',
          nome: 'Conta reserva',
          banco: 'Banco Exemplo'
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 2,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [
        {
          id: 'rp1',
          nome: 'Michelle',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        },
        {
          id: 'rp2',
          nome: 'Vilani',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 2,
      totalPages: 1
    } as never);
  });

  it('loads data, removes redundant summary items and applies search filters', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [
        {
          id: 'm1',
          dataMovimentacao: '2026-04-20',
          tipo: 'Entrada',
          natureza: 'Realizada',
          statusCodigo: 'ATIVA',
          statusNome: 'Ativa',
          valor: 120,
          contaBancariaId: 'cb1',
          contaBancariaNome: 'Conta principal',
          contaPagarId: null,
          contaReceberId: 'cr1',
          faturaCartaoId: null,
          observacao: 'Recebimento do cliente',
          responsavelNome: 'Michelle'
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalRegistros: 1,
        totalEntradas: 120,
        totalSaidas: 0,
        saldoLiquido: 120
      }
    });

    renderPage();

    expect(await screen.findByText('Recebimento do cliente')).toBeInTheDocument();
    expect((await screen.findAllByText('20/04/2026')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Conta principal')).toBeInTheDocument();
    expect(screen.queryByText(/Registros filtrados/i)).not.toBeInTheDocument();
    expect(screen.getByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('Saídas')).toBeInTheDocument();
    expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
    expect(screen.getAllByText('R$120,00').length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByPlaceholderText(/Filtrar por observa/i), 'cliente vip');

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'cliente vip'
        })
      )
    );
  }, 40000);

  it('filters movimentacoes by periodo', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0
      }
    });

    renderPage();

    await selectDateInDateInput('Data inicial', '2026-04-01');
    await selectDateInDateInput('Data final', '2026-04-30');

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: '2026-04-01',
          dataFinal: '2026-04-30'
        })
      )
    );
  });

  it('filters movimentacoes by conta bancaria', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0
      }
    });

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Filtro de conta banc/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Conta principal - Banco Exemplo' }));

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          contaBancariaIds: ['cb1']
        })
      )
    );
  });

  it('filters movimentacoes by responsavel', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0
      }
    });

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Filtro de respons/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Michelle' }));

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          responsavelIds: ['rp1']
        })
      )
    );
  });

  it('renders the error state and retries loading', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar)
      .mockRejectedValueOnce(new Error('Falha ao buscar movimentacoes'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        summary: {
          totalRegistros: 0,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoLiquido: 0
        }
      });

    renderPage();

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText(/Falha ao buscar movimenta/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(financeiroApi.movimentacoes.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });
});
