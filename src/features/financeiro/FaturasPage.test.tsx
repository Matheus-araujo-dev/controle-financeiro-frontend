import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FaturasPage } from './FaturasPage';
import { financeiroApi } from '../../services/http/financeiro-api';

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

describe('FaturasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads invoices, reacts to search and renders detail links', async () => {
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
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
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
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
      });

    render(
      <MemoryRouter>
        <FaturasPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Visa Corporate')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Detalhar' })).toHaveAttribute('href', '/faturas/f1');

    await userEvent.type(screen.getByPlaceholderText('Buscar por cartao ou competencia'), 'abril');

    await waitFor(() =>
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'abril'
        })
      )
    );
  }, 10000);

  it('renders the error state and allows retry', async () => {
    vi.mocked(financeiroApi.faturas.listar)
      .mockRejectedValueOnce(new Error('Falha ao carregar faturas'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });

    render(
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
});
