import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { ContasBancariasListPage } from './ContasBancariasListPage';

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

const contasBancariasResponse = {
  items: [
    {
      id: 'cb-1',
      nome: 'Conta Principal',
      banco: 'Bradesco',
      agencia: '0001',
      numeroConta: '12345-6',
      tipoConta: 'Corrente',
      saldoInicial: 5000,
      dataSaldoInicial: '2026-04-10',
      limiteCartoesCompartilhado: 10000,
      limiteCartoesComprometido: 3200,
      limiteCartoesDisponivel: 6800,
      ativo: true
    },
    {
      id: 'cb-2',
      nome: 'Reserva',
      banco: 'Nubank',
      agencia: '0002',
      numeroConta: '98765-4',
      tipoConta: 'Investimento',
      saldoInicial: 12000,
      dataSaldoInicial: '2026-04-12',
      limiteCartoesCompartilhado: null,
      limiteCartoesComprometido: 0,
      limiteCartoesDisponivel: null,
      ativo: false
    }
  ],
  page: 1,
  pageSize: 20,
  totalItems: 12,
  totalPages: 2
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ContasBancariasListPage />
    </MemoryRouter>
  );
}

describe('ContasBancariasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue(contasBancariasResponse as never);
  });

  it('renders the dedicated banking dashboard and keeps edit actions available', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Contas Bancarias' })).toBeInTheDocument();
    expect(screen.getByText('Saldo total consolidado')).toBeInTheDocument();
    expect(screen.getByText('Credito disponivel')).toBeInTheDocument();
    expect(screen.getByText('Contas ativas')).toBeInTheDocument();
    expect(screen.getByText('Conta Principal')).toBeInTheDocument();
    expect(screen.getByText('Bradesco')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Editar' })[0]).toHaveAttribute('href', '/contas-bancarias/cb-1');
  });

  it('updates the request when search, bank, status and pagination change', async () => {
    renderPage();

    expect(await screen.findByText('Conta Principal')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Buscar por banco, conta ou status...'), {
      target: { value: 'brad' }
    });
    fireEvent.change(screen.getByPlaceholderText('Banco'), {
      target: { value: 'Bra' }
    });
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'true' }
    });

    await waitFor(() =>
      expect(cadastrosApi.contasBancarias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          search: 'brad',
          banco: 'Bra',
          ativo: true
        })
      )
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() =>
      expect(cadastrosApi.contasBancarias.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2
        })
      )
    );
  });
});
