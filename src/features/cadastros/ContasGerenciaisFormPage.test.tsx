import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { ContasGerenciaisFormPage } from './ContasGerenciaisFormPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

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

const contasGerenciaisOptionsResponse = {
  items: [
    {
      id: 'cg-1',
      codigo: '3.01',
      descricao: 'Despesas Operacionais',
      tipo: 'Despesa' as const,
      contaPaiId: null,
      contaPaiDescricao: null,
      responsavelPadraoId: null,
      responsavelPadraoNome: null,
      ativo: true,
      aceitaLancamentos: false,
      ehPadraoRecebimentoFaturaCartao: false
    }
  ],
  page: 1,
  pageSize: 100,
  totalItems: 1,
  totalPages: 1
};

const pessoasResponse = {
  items: [
    {
      id: 'u-1',
      nome: 'Matheus',
      tipoPessoa: 'Fisica',
      cpfCnpj: null,
      email: null,
      telefone: null,
      ativo: true
    }
  ],
  page: 1,
  pageSize: 100,
  totalItems: 1,
  totalPages: 1
};

describe('ContasGerenciaisFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue(contasGerenciaisOptionsResponse as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue(pessoasResponse as never);
  });

  it('creates a new account while preserving code generation and null normalization', async () => {
    vi.mocked(cadastrosApi.contasGerenciais.criar).mockResolvedValue({} as never);

    render(
      <MemoryRouter initialEntries={['/contas-gerenciais/novo']}>
        <Routes>
          <Route path="/contas-gerenciais/novo" element={<ContasGerenciaisFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText('Conta pai'), {
      target: { value: 'cg-1' }
    });

    await waitFor(() => expect(screen.getByLabelText('Codigo da conta')).toHaveValue('3.01.01'));

    await userEvent.type(screen.getByLabelText('Descricao da conta'), 'Salarios');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar conta' })[0]);

    await waitFor(() =>
      expect(cadastrosApi.contasGerenciais.criar).toHaveBeenCalledWith({
        codigo: '3.01.01',
        descricao: 'Salarios',
        tipo: 'Despesa',
        contaPaiId: 'cg-1',
        responsavelPadraoId: null,
        ativo: true,
        ehPadraoRecebimentoFaturaCartao: false
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/contas-gerenciais');
  }, 30000);

  it('loads detail data and submits updates from the dedicated layout', async () => {
    vi.mocked(cadastrosApi.contasGerenciais.obterPorId).mockResolvedValue({
      id: 'cg-9',
      codigo: '1.01.03',
      descricao: 'Receita de Servicos',
      tipo: 'Receita',
      contaPaiId: null,
      contaPaiDescricao: null,
      responsavelPadraoId: 'u-1',
      responsavelPadraoNome: 'Matheus',
      ativo: true,
      aceitaLancamentos: true,
      ehPadraoRecebimentoFaturaCartao: true,
      createdAtUtc: '2026-04-10T10:00:00Z',
      updatedAtUtc: '2026-04-10T10:00:00Z'
    } as never);
    vi.mocked(cadastrosApi.contasGerenciais.atualizar).mockResolvedValue({} as never);

    render(
      <MemoryRouter initialEntries={['/contas-gerenciais/cg-9']}>
        <Routes>
          <Route path="/contas-gerenciais/:id" element={<ContasGerenciaisFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('1.01.03')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Receita de Servicos')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Descricao da conta'), {
      target: { value: 'Receita de Consultoria' }
    });
    fireEvent.change(screen.getByLabelText('Responsavel padrao'), {
      target: { value: 'u-1' }
    });

    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar alteracoes' })[0]);

    await waitFor(() =>
      expect(cadastrosApi.contasGerenciais.atualizar).toHaveBeenCalledWith('cg-9', {
        codigo: '1.01.03',
        descricao: 'Receita de Consultoria',
        tipo: 'Receita',
        contaPaiId: null,
        responsavelPadraoId: 'u-1',
        ativo: true,
        ehPadraoRecebimentoFaturaCartao: true
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/contas-gerenciais');
  }, 30000);
});
