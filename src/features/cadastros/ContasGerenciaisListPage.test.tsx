import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { ContasGerenciaisListPage } from './ContasGerenciaisListPage';

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

const contasGerenciaisResponse = {
  items: [
    {
      id: 'cg-1',
      codigo: '3.01',
      descricao: 'Despesas Operacionais',
      tipo: 'Despesa' as const,
      contaPaiId: null,
      contaPaiDescricao: null,
      responsavelPadraoId: 'u-1',
      responsavelPadraoNome: 'Diretoria Financeira',
      ativo: true,
      aceitaLancamentos: false,
      ehPadraoRecebimentoFaturaCartao: false
    },
    {
      id: 'cg-2',
      codigo: '3.01.01',
      descricao: 'Salarios',
      tipo: 'Despesa' as const,
      contaPaiId: 'cg-1',
      contaPaiDescricao: 'Despesas Operacionais',
      responsavelPadraoId: 'u-2',
      responsavelPadraoNome: 'Gestao de RH',
      ativo: true,
      aceitaLancamentos: true,
      ehPadraoRecebimentoFaturaCartao: false
    }
  ],
  page: 1,
  pageSize: 20,
  totalItems: 42,
  totalPages: 3
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ContasGerenciaisListPage />
    </MemoryRouter>
  );
}

describe('ContasGerenciaisListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue(contasGerenciaisResponse);
  });

  it('renders the dedicated hierarchy dashboard and keeps the edit actions available', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Contas Gerenciais' })).toBeInTheDocument();
    expect(screen.getByText('Total de contas')).toBeInTheDocument();
    expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    expect(screen.getByText('Estrutura ativa')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getAllByText('Despesas Operacionais').length).toBeGreaterThan(0);
    expect(screen.getByText('Salarios')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Editar' })[0]).toHaveAttribute('href', '/contas-gerenciais/cg-1');
  });

  it('updates the request when search, type, status and pagination change', async () => {
    renderPage();

    expect((await screen.findAllByText('Despesas Operacionais')).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Buscar por codigo ou descricao...'), {
      target: { value: 'sal' }
    });
    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'Despesa' }
    });
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'true' }
    });

    await waitFor(() =>
      expect(cadastrosApi.contasGerenciais.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          search: 'sal',
          tipo: 'Despesa',
          ativo: true
        })
      )
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() =>
      expect(cadastrosApi.contasGerenciais.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2
        })
      )
    );
  });
});
