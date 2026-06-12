import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CartoesFormPage } from './CartoesFormPage';
import { cadastrosApi } from '../../services/http/cadastros-api';

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

const contasBancariasResponse = {
  items: [
    {
      id: 'cb-1',
      nome: 'Bradesco PF',
      banco: 'Bradesco'
    }
  ],
  page: 1,
  pageSize: 100,
  totalItems: 1,
  totalPages: 1
};

describe('CartoesFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue(contasBancariasResponse as never);
  });

  it('submits creation payloads while keeping the optional bank account nullable', async () => {
    vi.mocked(cadastrosApi.cartoes.criar).mockResolvedValue({} as never);

    render(
      <MemoryRouter initialEntries={['/cartoes/novo']}>
        <Routes>
          <Route path="/cartoes/novo" element={<CartoesFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Nome do cartao'), 'Bradesco Smiles');
    await userEvent.type(screen.getByLabelText('Bandeira'), 'Visa');
    await userEvent.type(screen.getByLabelText('Numero final'), '2892');
    fireEvent.change(screen.getByLabelText('Dia de fechamento'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Dia de vencimento'), { target: { value: '15' } });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar cartao' }));

    await waitFor(() =>
      expect(cadastrosApi.cartoes.criar).toHaveBeenCalledWith({
        nome: 'Bradesco Smiles',
        bandeira: 'Visa',
        numeroFinal: '2892',
        diaFechamentoFatura: 5,
        diaVencimentoFatura: 15,
        contaBancariaPagamentoPadraoId: null,
        limiteCredito: null,
        ativo: true
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/cartoes');
  }, 30000);

  it('loads card detail and submits updates from the dedicated edit layout', async () => {
    vi.mocked(cadastrosApi.cartoes.obterPorId).mockResolvedValue({
      id: 'cartao-1',
      nome: 'Nubank Platinum',
      bandeira: 'Mastercard',
      numeroFinal: '9901',
      diaFechamentoFatura: 2,
      diaVencimentoFatura: 9,
      contaBancariaPagamentoPadraoId: 'cb-1',
      limiteCredito: 8500,
      usaLimiteCompartilhado: false,
      limiteEfetivo: 8500,
      limiteComprometido: 1200,
      limiteDisponivel: 7300,
      ativo: true,
      createdAtUtc: '2026-04-18T10:00:00Z',
      updatedAtUtc: '2026-04-18T10:00:00Z'
    });
    vi.mocked(cadastrosApi.cartoes.atualizar).mockResolvedValue({} as never);

    render(
      <MemoryRouter initialEntries={['/cartoes/cartao-1']}>
        <Routes>
          <Route path="/cartoes/:id" element={<CartoesFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Nubank Platinum')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mastercard')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9901')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome do cartao'), { target: { value: 'Nubank Black' } });
    fireEvent.change(screen.getByLabelText('Conta bancaria padrao'), { target: { value: 'cb-1' } });
    fireEvent.change(screen.getByLabelText('Dia de vencimento'), { target: { value: '12' } });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alteracoes' }));

    await waitFor(() =>
      expect(cadastrosApi.cartoes.atualizar).toHaveBeenCalledWith('cartao-1', {
        nome: 'Nubank Black',
        bandeira: 'Mastercard',
        numeroFinal: '9901',
        diaFechamentoFatura: 2,
        diaVencimentoFatura: 12,
        contaBancariaPagamentoPadraoId: 'cb-1',
        limiteCredito: 8500,
        ativo: true
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/cartoes');
  }, 30000);

  it('shows schema validation messages and updates the live preview before submit', async () => {
    render(
      <MemoryRouter initialEntries={['/cartoes/novo']}>
        <Routes>
          <Route path="/cartoes/novo" element={<CartoesFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Nome do cartao'), 'Cartao Inter');
    await userEvent.type(screen.getByLabelText('Bandeira'), 'Elo');
    await userEvent.type(screen.getByLabelText('Numero final'), '7788');

    expect(screen.getByText('Cartao Inter')).toBeInTheDocument();
    expect(screen.getByText('ELO')).toBeInTheDocument();
    expect(screen.getByText(/7788$/)).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Nome do cartao'));
    await userEvent.clear(screen.getByLabelText('Bandeira'));
    await userEvent.clear(screen.getByLabelText('Numero final'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar cartao' }));

    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Bandeira é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Número final deve possuir 4 dígitos.')).toBeInTheDocument();
    expect(cadastrosApi.cartoes.criar).not.toHaveBeenCalled();
  }, 30000);

  it('navigates back on cancel without submitting', async () => {
    render(
      <MemoryRouter initialEntries={['/cartoes/novo']}>
        <Routes>
          <Route path="/cartoes/novo" element={<CartoesFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(cadastrosApi.cartoes.criar).not.toHaveBeenCalled();
    expect(cadastrosApi.cartoes.atualizar).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/cartoes');
  });
});
