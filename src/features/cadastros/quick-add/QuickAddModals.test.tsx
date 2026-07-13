import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { QuickAddCartaoModal } from './QuickAddCartaoModal';
import { QuickAddContaBancariaModal } from './QuickAddContaBancariaModal';
import { QuickAddFormaPagamentoModal } from './QuickAddFormaPagamentoModal';
import { QuickAddPessoaModal } from './QuickAddPessoaModal';

vi.mock('../../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    cartoes: {
      criar: vi.fn()
    },
    contasBancarias: {
      criar: vi.fn()
    },
    formasPagamento: {
      criar: vi.fn()
    },
    pessoas: {
      criar: vi.fn()
    }
  }
}));

describe('quick add modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a person with the selected type and resets the modal', async () => {
    vi.mocked(cadastrosApi.pessoas.criar).mockResolvedValue({
      id: 'p1',
      nome: 'Pessoa Teste',
      tipoPessoa: 'Juridica',
      cpfCnpj: '',
      email: '',
      telefone: '',
      observacao: '',
      chavesPix: [],
      ativo: true,
      ehPagador: true,
      ehRecebedor: true,
      ehResponsavel: true,
      contaGerencialDespesaId: null,
      contaGerencialReceitaId: null,
      createdAtUtc: '2026-06-21T00:00:00Z',
      updatedAtUtc: '2026-06-21T00:00:00Z'
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(<QuickAddPessoaModal open onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), { target: { value: '  Pessoa Teste  ' } });
    fireEvent.focus(screen.getByRole('combobox', { name: 'Tipo' }));
    fireEvent.click(screen.getByRole('button', { name: /jur/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    await waitFor(() =>
      expect(cadastrosApi.pessoas.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Pessoa Teste',
          tipoPessoa: 'Juridica',
          chavesPix: []
        })
      )
    );
    expect(onSuccess).toHaveBeenCalledWith('p1', 'Pessoa Teste');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the failure message when person creation fails', async () => {
    vi.mocked(cadastrosApi.pessoas.criar).mockRejectedValue(new Error('offline'));

    render(<QuickAddPessoaModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), { target: { value: 'Pessoa Teste' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    expect(await screen.findByText(/Falha ao salvar/i)).toBeInTheDocument();
  });

  it('creates a credit card and sanitizes the final digits', async () => {
    vi.mocked(cadastrosApi.cartoes.criar).mockResolvedValue({
      id: 'card1',
      nome: 'Cartao Teste',
      bandeira: 'Visa',
      numeroFinal: '1234',
      diaFechamentoFatura: 5,
      diaVencimentoFatura: 15,
      contaBancariaPagamentoPadraoId: null,
      limiteCredito: null,
      usaLimiteCompartilhado: false,
      limiteEfetivo: null,
      limiteComprometido: 0,
      limiteDisponivel: null,
      ativo: true,
      icone: null,
      cor: null,
      createdAtUtc: '2026-06-21T00:00:00Z',
      updatedAtUtc: '2026-06-21T00:00:00Z'
    });
    const onSuccess = vi.fn();

    render(<QuickAddCartaoModal open onClose={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Nubank Roxinho/i), { target: { value: '  Cartao Teste  ' } });
    fireEvent.change(screen.getByPlaceholderText(/Visa/i), { target: { value: '  Visa  ' } });
    fireEvent.change(screen.getByPlaceholderText('0000'), { target: { value: 'ab12c3456' } });
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '5' } });
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    await waitFor(() =>
      expect(cadastrosApi.cartoes.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Cartao Teste',
          bandeira: 'Visa',
          numeroFinal: '1234',
          diaFechamentoFatura: 5,
          diaVencimentoFatura: 15,
          ativo: true
        })
      )
    );
    expect(onSuccess).toHaveBeenCalledWith('card1', 'Cartao Teste - final 1234');
  });

  it('shows a friendly validation message for invalid credit card days', async () => {
    render(<QuickAddCartaoModal open onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Nubank Roxinho/i), { target: { value: 'Cartao Teste' } });
    fireEvent.change(screen.getByPlaceholderText(/Visa/i), { target: { value: 'Visa' } });
    fireEvent.change(screen.getByPlaceholderText('0000'), { target: { value: '1234' } });
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    expect(await screen.findByText('Dia de fechamento deve estar entre 1 e 31.')).toBeInTheDocument();
    expect(cadastrosApi.cartoes.criar).not.toHaveBeenCalled();
  });

  it('creates a bank account with the minimal payload', async () => {
    vi.mocked(cadastrosApi.contasBancarias.criar).mockResolvedValue({
      id: 'bank1',
      nome: 'Conta Teste',
      banco: 'Banco Teste',
      agencia: '',
      numeroConta: '',
      tipoConta: '',
      saldoInicial: 0,
      dataSaldoInicial: '2026-06-21',
      saldoAtual: 0,
      limiteCartoesCompartilhado: null,
      limiteCartoesComprometido: 0,
      limiteCartoesDisponivel: null,
      ativo: true,
      icone: null,
      cor: null,
      createdAtUtc: '2026-06-21T00:00:00Z',
      updatedAtUtc: '2026-06-21T00:00:00Z'
    });
    const onSuccess = vi.fn();

    render(<QuickAddContaBancariaModal open onClose={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Conta Corrente/i), { target: { value: '  Conta Teste  ' } });
    fireEvent.change(screen.getByPlaceholderText(/Bradesco/i), { target: { value: '  Banco Teste  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    await waitFor(() =>
      expect(cadastrosApi.contasBancarias.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Conta Teste',
          banco: 'Banco Teste',
          saldoInicial: 0,
          dataSaldoInicial: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          ativo: true
        })
      )
    );
    expect(onSuccess).toHaveBeenCalledWith('bank1', 'Conta Teste - Banco Teste');
  });

  it('creates a payment method with card and automatic settlement flags', async () => {
    vi.mocked(cadastrosApi.formasPagamento.criar).mockResolvedValue({
      id: 'fp1',
      nome: 'Debito Teste',
      tipo: 'Debito',
      ehCartao: true,
      baixarAutomaticamente: true,
      ativo: true,
      createdAtUtc: '2026-06-21T00:00:00Z',
      updatedAtUtc: '2026-06-21T00:00:00Z'
    });
    const onSuccess = vi.fn();

    render(<QuickAddFormaPagamentoModal open onClose={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Pix Pessoal/i), { target: { value: '  Debito Teste  ' } });
    fireEvent.focus(screen.getByRole('combobox', { name: 'Tipo' }));
    fireEvent.click(screen.getByRole('button', { name: /D.bito/i }));
    fireEvent.click(screen.getByRole('switch', { name: /cart.o de cr.dito/i }));
    fireEvent.click(screen.getByRole('switch', { name: /Baixa autom.tica/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    await waitFor(() =>
      expect(cadastrosApi.formasPagamento.criar).toHaveBeenCalledWith({
        nome: 'Debito Teste',
        tipo: 'Debito',
        ehCartao: true,
        baixarAutomaticamente: true,
        ativo: true
      })
    );
    expect(onSuccess).toHaveBeenCalledWith('fp1', 'Debito Teste');
  });
});
