import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovimentacoesPage } from './MovimentacoesPage';
import { financeiroApi } from '../../services/http/financeiro-api';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    movimentacoes: {
      listar: vi.fn(),
      obterPorId: vi.fn()
    }
  }
}));

describe('MovimentacoesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads data and applies search and select filters', async () => {
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
          observacao: 'Recebimento do cliente'
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
    });

    render(<MovimentacoesPage />);

    expect(await screen.findByText('Recebimento do cliente')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Buscar por observacao'), 'cliente vip');

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'cliente vip'
        })
      )
    );
  }, 10000);

  it('renders the error state and retries loading', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar)
      .mockRejectedValueOnce(new Error('Falha ao buscar movimentacoes'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0
      });

    render(<MovimentacoesPage />);

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha ao buscar movimentacoes')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(financeiroApi.movimentacoes.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });
});
