import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConciliacaoPage } from './ConciliacaoPage';
import { conciliacaoApi } from '../../services/http/conciliacao-api';

vi.mock('../../services/http/conciliacao-api', () => ({
  conciliacaoApi: {
    listar: vi.fn(),
    confirmarVinculo: vi.fn()
  }
}));

describe('ConciliacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads extrato items, applies search and confirms a suggested match', async () => {
    vi.mocked(conciliacaoApi.listar).mockResolvedValue({
      items: [
        {
          itemImportadoWhatsappId: 'iw1',
          importacaoWhatsappId: 'import1',
          remetente: '5511944443333',
          descricaoExtrato: 'Extrato pix recebido cliente 80,00 2026-04-08',
          valorSugerido: 80,
          dataSugerida: '2026-04-08',
          statusConciliacaoCodigo: 'PENDENTE',
          statusConciliacaoNome: 'Pendente',
          movimentacaoConciliadaId: null,
          movimentacaoConciliadaDescricao: null,
          candidatas: [
            {
              movimentacaoFinanceiraId: 'm1',
              dataMovimentacao: '2026-04-08',
              tipo: 'Entrada',
              natureza: 'Realizada',
              valor: 80,
              statusCodigo: 'EFETIVADA',
              observacao: 'Recebimento conciliacao',
              score: 140
            }
          ]
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    });
    vi.mocked(conciliacaoApi.confirmarVinculo).mockResolvedValue({
      itemImportadoWhatsappId: 'iw1',
      importacaoWhatsappId: 'import1',
      remetente: '5511944443333',
      descricaoExtrato: 'Extrato pix recebido cliente 80,00 2026-04-08',
      valorSugerido: 80,
      dataSugerida: '2026-04-08',
      statusConciliacaoCodigo: 'CONCILIADO',
      statusConciliacaoNome: 'Conciliado',
      movimentacaoConciliadaId: 'm1',
      movimentacaoConciliadaDescricao: 'Recebimento conciliacao',
      candidatas: []
    });

    render(<ConciliacaoPage />);

    expect(await screen.findByText('5511944443333')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conciliar Recebimento conciliacao' })).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Buscar por remetente ou descrição do extrato'), 'pix');

    await waitFor(() =>
      expect(conciliacaoApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'pix'
        })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: 'Conciliar Recebimento conciliacao' }));

    await waitFor(() =>
      expect(conciliacaoApi.confirmarVinculo).toHaveBeenCalledWith('iw1', {
        movimentacaoFinanceiraId: 'm1',
        observacao: 'Conciliação manual assistida via tela'
      })
    );

    expect(await screen.findByText('Último vínculo confirmado para o item iw1.')).toBeInTheDocument();
    expect(await screen.findByText('Conciliado')).toBeInTheDocument();
  }, 40000);

  it('renders the error state and retries loading', async () => {
    vi.mocked(conciliacaoApi.listar)
      .mockRejectedValueOnce(new Error('Falha ao carregar conciliação'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });

    render(<ConciliacaoPage />);

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar conciliação')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(conciliacaoApi.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });
});
