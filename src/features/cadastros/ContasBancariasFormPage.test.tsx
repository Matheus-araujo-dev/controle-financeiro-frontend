import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { ContasBancariasFormPage } from './ContasBancariasFormPage';

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

describe('ContasBancariasFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it('creates a new bank account while preserving the existing payload contract', async () => {
    vi.mocked(cadastrosApi.contasBancarias.criar).mockResolvedValue({} as never);

    render(
      <MemoryRouter initialEntries={['/contas-bancarias/novo']}>
        <Routes>
          <Route path="/contas-bancarias/novo" element={<ContasBancariasFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(await screen.findByLabelText('Nome da conta'), 'Conta Principal');
    await userEvent.type(screen.getByLabelText('Banco'), 'Bradesco');
    await userEvent.type(screen.getByLabelText('Agencia'), '0001');
    await userEvent.type(screen.getByLabelText('Numero da conta'), '12345-6');
    await userEvent.click(screen.getByRole('button', { name: 'Corrente' }));

    const saldoInput = screen.getByLabelText('Saldo inicial');
    fireEvent.focus(saldoInput);
    fireEvent.change(saldoInput, { target: { value: '1500' } });
    fireEvent.blur(saldoInput);

    fireEvent.change(screen.getByLabelText('Data do saldo inicial'), {
      target: { value: '2026-04-10' }
    });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar conta' }));

    await waitFor(() =>
      expect(cadastrosApi.contasBancarias.criar).toHaveBeenCalledWith({
        nome: 'Conta Principal',
        banco: 'Bradesco',
        agencia: '0001',
        numeroConta: '12345-6',
        tipoConta: 'Corrente',
        saldoInicial: 1500,
        dataSaldoInicial: '2026-04-10',
        limiteCartoesCompartilhado: null,
        ativo: true
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/contas-bancarias');
  }, 30000);

  it('loads detail data and submits updates from the dedicated layout', async () => {
    vi.mocked(cadastrosApi.contasBancarias.obterPorId).mockResolvedValue({
      id: 'cb-9',
      nome: 'Conta Empresa',
      banco: 'Santander',
      agencia: '4321',
      numeroConta: '99887-6',
      tipoConta: 'Investimento',
      saldoInicial: 25000,
      dataSaldoInicial: '2026-04-01',
      limiteCartoesCompartilhado: 10000,
      limiteCartoesComprometido: 2500,
      limiteCartoesDisponivel: 7500,
      ativo: true,
      createdAtUtc: '2026-04-10T10:00:00Z',
      updatedAtUtc: '2026-04-10T10:00:00Z'
    } as never);
    vi.mocked(cadastrosApi.contasBancarias.atualizar).mockResolvedValue({} as never);

    render(
      <MemoryRouter initialEntries={['/contas-bancarias/cb-9']}>
        <Routes>
          <Route path="/contas-bancarias/:id" element={<ContasBancariasFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Conta Empresa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Santander')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome da conta'), {
      target: { value: 'Conta Empresa Premium' }
    });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alteracoes' }));

    await waitFor(() =>
      expect(cadastrosApi.contasBancarias.atualizar).toHaveBeenCalledWith('cb-9', {
        nome: 'Conta Empresa Premium',
        banco: 'Santander',
        agencia: '4321',
        numeroConta: '99887-6',
        tipoConta: 'Investimento',
        saldoInicial: 25000,
        dataSaldoInicial: '2026-04-01',
        limiteCartoesCompartilhado: 10000,
        ativo: true
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/contas-bancarias');
  }, 30000);
});
