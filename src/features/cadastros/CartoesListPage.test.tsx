import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { formatCurrencyBRL } from '../../shared/currency';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { CartoesListPage } from './CartoesListPage';

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      ativar: vi.fn(),
      inativar: vi.fn()
    },
    formasPagamento: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    },
    contasBancarias: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    },
    cartoes: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    }
  }
}));

vi.mock('../../components/data/AppDataTable', () => ({
  AppDataTable: ({
    columns,
    dataSource,
    emptyMessage,
    errorMessage,
    onRetry,
    onTableChange,
    pagination
  }: {
    columns: Array<{
      key?: string;
      dataIndex?: string;
      render?: (value: unknown, record: Record<string, unknown>) => ReactNode;
    }>;
    dataSource: Array<Record<string, unknown>>;
    emptyMessage?: string;
    errorMessage?: string;
    onRetry?: () => void;
    onTableChange?: (pagination: { current: number; pageSize: number }, filters: unknown, sorter: unknown) => void;
    pagination?: { current?: number; pageSize?: number; total?: number };
  }) => (
    <div data-testid="cartoes-table-mock">
      <button
        type="button"
        onClick={() =>
          onTableChange?.(
            { current: 2, pageSize: 50 },
            {},
            {
              columnKey: 'limiteEfetivo',
              order: 'descend'
            }
          )
        }
      >
        Simular ordenação
      </button>
      <button type="button" onClick={onRetry}>
        Recarregar tabela
      </button>
      <div data-testid="mock-pagination">
        {pagination?.current}-{pagination?.pageSize}-{pagination?.total}
      </div>
      {errorMessage ? <div>{errorMessage}</div> : null}
      {!dataSource.length ? <div>{emptyMessage}</div> : null}
      {dataSource.map((record) => (
        <section key={String(record.id)} data-testid={`card-row-${record.id}`}>
          {columns.map((column, index) => (
            <div key={column.key ?? `${record.id}-${index}`}>
              {column.render
                ? column.render(column.dataIndex ? record[column.dataIndex] : undefined, record)
                : String(column.dataIndex ? record[column.dataIndex] : '')}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}));

const cardsResponse = {
  items: [
    {
      id: 'c1',
      nome: 'Infinity Black',
      bandeira: 'Visa',
      numeroFinal: '4582',
      diaFechamentoFatura: 8,
      diaVencimentoFatura: 15,
      contaBancariaPagamentoPadraoId: null,
      limiteCredito: 15000,
      usaLimiteCompartilhado: false,
      limiteEfetivo: 15000,
      limiteComprometido: 2550,
      limiteDisponivel: 12450,
      ativo: true
    },
    {
      id: 'c2',
      nome: 'Platinum Rewards',
      bandeira: 'Mastercard',
      numeroFinal: '9901',
      diaFechamentoFatura: 2,
      diaVencimentoFatura: 9,
      contaBancariaPagamentoPadraoId: null,
      limiteCredito: 8500,
      usaLimiteCompartilhado: true,
      limiteEfetivo: 8500,
      limiteComprometido: 7300,
      limiteDisponivel: 1200,
      ativo: true
    }
  ],
  page: 1,
  pageSize: 20,
  totalItems: 2,
  totalPages: 1
};

function renderPage() {
  return render(
    <MemoryRouter>
      <CartoesListPage />
    </MemoryRouter>
  );
}

describe('CartoesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue(cardsResponse);
  });

  it('renders the redesigned cards dashboard and keeps edit actions available', async () => {
    renderPage();

    expect(await screen.findByText('Gestão de Cartões')).toBeInTheDocument();
    expect(screen.getByText('Histórico de cartões')).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyBRL(23500))).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyBRL(9850))).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyBRL(13650))).toBeInTheDocument();
    expect(screen.getByText('Próximo Vencimento')).toBeInTheDocument();
    expect(screen.getAllByText('Dia 09').length).toBeGreaterThan(0);
    expect(screen.getByText('Infinity Black')).toBeInTheDocument();
    expect(screen.getByText('Platinum Rewards')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Editar' })[0]).toHaveAttribute('href', '/cartoes/c1');
  });

  it('updates the list request when search, brand and status filters change', async () => {
    renderPage();

    expect(await screen.findByText('Infinity Black')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Buscar por nome, bandeira ou final'), {
      target: { value: 'reward' }
    });
    fireEvent.change(screen.getByPlaceholderText('Ex: Visa, Mastercard, Elo'), {
      target: { value: 'Master' }
    });
    fireEvent.change(screen.getByDisplayValue('Todos os status'), {
      target: { value: 'true' }
    });

    await waitFor(() =>
      expect(cadastrosApi.cartoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          search: 'reward',
          bandeira: 'Master',
          ativo: true
        })
      )
    );
  });

  it('propagates pagination and sorting changes to the API filters', async () => {
    renderPage();

    expect(await screen.findByText('Infinity Black')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Simular ordenação' }));

    await waitFor(() =>
      expect(cadastrosApi.cartoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 50,
          sortBy: 'limiteEfetivo',
          sortDirection: 'Desc'
        })
      )
    );
  });
});
