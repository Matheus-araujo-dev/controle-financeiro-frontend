import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickLaunchButton } from './QuickLaunchButton';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { notify } from '../../store/notification-store';

vi.mock('../forms/DateInput', () => ({
  DateInput: ({ ariaLabel, value, onChange }: { ariaLabel: string; value: string; onChange: (value: string) => void }) => (
    <input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} />
  )
}));

vi.mock('../forms/ComboBox', () => ({
  ComboBox: ({
    value,
    onChange,
    options,
    placeholder,
    addNewLabel,
    onAddNew,
    'aria-label': ariaLabel
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
    placeholder?: string;
    addNewLabel?: string;
    onAddNew?: () => void;
    'aria-label': string;
  }) => (
    <div>
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder ?? 'Selecionar'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {onAddNew ? (
        <button type="button" onClick={onAddNew}>
          {addNewLabel}
        </button>
      ) : null}
    </div>
  )
}));

vi.mock('../../shared/CurrencyInput', () => ({
  CurrencyInput: ({ value, onChange }: { value: number; onChange: (value: number | null) => void }) => (
    <input aria-label="Valor" value={value || ''} onChange={(event) => onChange(Number(event.target.value) || null)} />
  )
}));

vi.mock('../../features/cadastros/quick-add/QuickAddPessoaModal', () => ({
  QuickAddPessoaModal: ({
    open,
    onClose,
    onSuccess
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: (newId: string, label: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Nova pessoa">
        <button type="button" onClick={() => onSuccess('p-new', 'Pessoa nova')}>
          Salvar pessoa
        </button>
        <button type="button" onClick={onClose}>
          Fechar pessoa
        </button>
      </div>
    ) : null
}));

vi.mock('../../features/cadastros/quick-add/QuickAddFormaPagamentoModal', () => ({
  QuickAddFormaPagamentoModal: ({
    open,
    onClose,
    onSuccess
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: (newId: string, label: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Nova forma de pagamento">
        <button type="button" onClick={() => onSuccess('f-new', 'Pix novo')}>
          Salvar forma
        </button>
        <button type="button" onClick={onClose}>
          Fechar forma
        </button>
      </div>
    ) : null
}));

vi.mock('../../features/cadastros/quick-add/QuickAddContaGerencialModal', () => ({
  QuickAddContaGerencialModal: ({
    open,
    onClose,
    onSuccess,
    defaultTipo
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: (newId: string, label: string) => void;
    defaultTipo: string;
  }) =>
    open ? (
      <div role="dialog" aria-label={`Nova conta gerencial ${defaultTipo}`}>
        <button type="button" onClick={() => onSuccess('cg-new', `${defaultTipo} nova`)}>
          Salvar conta
        </button>
        <button type="button" onClick={onClose}>
          Fechar conta
        </button>
      </div>
    ) : null
}));

vi.mock('../../features/cadastros/quick-add/QuickAddCartaoModal', () => ({
  QuickAddCartaoModal: ({
    open,
    onClose,
    onSuccess
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: (newId: string, label: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Novo cartao">
        <button type="button" onClick={() => onSuccess('card-new', 'Cartao novo')}>
          Salvar cartao
        </button>
        <button type="button" onClick={onClose}>
          Fechar cartao
        </button>
      </div>
    ) : null
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: { listar: vi.fn() },
    formasPagamento: { listar: vi.fn() },
    cartoes: { listar: vi.fn() },
    contasGerenciais: { listar: vi.fn() },
    contasBancarias: { listar: vi.fn() }
  }
}));

vi.mock('../../features/cadastros/quick-add/QuickAddContaBancariaModal', () => ({
  QuickAddContaBancariaModal: ({
    open,
    onClose,
    onSuccess
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: (newId: string, label: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Nova conta bancaria">
        <button type="button" onClick={() => onSuccess('cb-new', 'Conta nova')}>
          Salvar conta bancaria
        </button>
        <button type="button" onClick={onClose}>
          Fechar conta bancaria
        </button>
      </div>
    ) : null
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { criar: vi.fn(), listar: vi.fn() },
    contasReceber: { criar: vi.fn(), listar: vi.fn() },
    transferencias: { criar: vi.fn() }
  }
}));

vi.mock('../../store/notification-store', () => ({
  notify: vi.fn()
}));

vi.mock('../../services/http/api-error', () => ({
  getApiErrorMessage: () => 'Erro de API',
  isFaturaIndisponivelError: () => false
}));

const contasBancariasResponse = {
  items: [
    { id: 'cb1', nome: 'Conta Corrente' },
    { id: 'cb2', nome: 'Conta Poupança' }
  ]
};

const pessoasResponse = {
  items: [
    { id: 'p1', nome: 'Mercado', ehResponsavel: false, ehRecebedor: true },
    { id: 'r1', nome: 'Responsavel', ehResponsavel: true, ehRecebedor: false },
    { id: 'r2', nome: 'Responsavel Dois', ehResponsavel: true, ehRecebedor: false }
  ]
};

const formasResponse = {
  items: [
    { id: 'f-card', nome: 'Cartao', ehCartao: true },
    { id: 'f-pix', nome: 'Pix', ehCartao: false }
  ]
};

const cartoesResponse = {
  items: [{ id: 'c1', nome: 'Visa', numeroFinal: '1234' }]
};

const despesasResponse = {
  items: [
    { id: 'cd1', codigo: '1.1', descricao: 'Mercado', aceitaLancamentos: true },
    { id: 'cd-sintetica', codigo: '1', descricao: 'Despesas', aceitaLancamentos: false }
  ]
};

const receitasResponse = {
  items: [{ id: 'cr1', codigo: '2.1', descricao: 'Salario', aceitaLancamentos: true }]
};

function mockSuccessfulOptions() {
  vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue(pessoasResponse as never);
  vi.mocked(cadastrosApi.formasPagamento.listar).mockResolvedValue(formasResponse as never);
  vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue(cartoesResponse as never);
  vi.mocked(cadastrosApi.contasGerenciais.listar).mockImplementation((filters: { tipo?: string }) =>
    Promise.resolve((filters.tipo === 'Receita' ? receitasResponse : despesasResponse) as never)
  );
  vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue(contasBancariasResponse as never);
}

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

async function openQuickLaunch() {
  const user = userEvent.setup();
  render(
    <>
      <main data-testid="admin-shell" aria-hidden="false" />
      <QuickLaunchButton>Adicionar</QuickLaunchButton>
    </>,
    { wrapper: Wrapper }
  );

  await user.click(screen.getByRole('button', { name: /lan.amento r.pido/i }));
  const dialog = await screen.findByRole('dialog', { name: /lan.amento r.pido/i });
  await waitFor(() => expect(cadastrosApi.pessoas.listar).toHaveBeenCalled());
  return { user, dialog };
}

describe('QuickLaunchButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.className = '';
    mockSuccessfulOptions();
    vi.mocked(financeiroApi.contasPagar.criar).mockResolvedValue({} as never);
    vi.mocked(financeiroApi.contasReceber.criar).mockResolvedValue({} as never);
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue({ totalItems: 0, items: [], page: 1, pageSize: 5, totalPages: 0 } as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue({ totalItems: 0, items: [], page: 1, pageSize: 5, totalPages: 0 } as never);
  });

  it('opens the modal, isolates the shell and closes with escape', async () => {
    const { user } = await openQuickLaunch();

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body).toHaveClass('quick-launch-open');
    expect(screen.getByTestId('admin-shell')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('admin-shell')).toHaveAttribute('inert');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /lan.amento r.pido/i })).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
    expect(document.body).not.toHaveClass('quick-launch-open');
    expect(screen.getByTestId('admin-shell')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByTestId('admin-shell')).not.toHaveAttribute('inert');
  });

  it('creates a payable entry and requires card when the payment method is card-based', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.type(within(dialog).getByPlaceholderText(/mercado/i), 'Compra do mes');
    await user.type(within(dialog).getByLabelText('Valor'), '120');
    await user.selectOptions(await within(dialog).findByLabelText('Recebedor'), 'p1');
    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-card');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'cd1');

    expect(within(dialog).getByLabelText(/cart.o de cr.dito/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /^Lan./i })).toBeDisabled();

    await user.selectOptions(within(dialog).getByLabelText(/cart.o de cr.dito/i), 'c1');
    await user.click(within(dialog).getByRole('button', { name: /^Lan./i }));

    await waitFor(() => expect(financeiroApi.contasPagar.criar).toHaveBeenCalledTimes(1));
    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: 'Compra do mes',
        valorOriginal: 120,
        recebedorId: 'p1',
        responsavelCompraId: 'r1',
        formaPagamentoId: 'f-card',
        cartaoId: 'c1',
        rateios: [{ contaGerencialId: 'cd1', valor: 120 }]
      })
    );
    expect(notify).toHaveBeenCalledWith('success', expect.stringMatching(/lan.amento criado/i), 'Compra do mes');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /lan.amento r.pido/i })).not.toBeInTheDocument());
  });

  it('uses quick-add selections for receivable entries and keeps the modal open on API errors', async () => {
    vi.mocked(financeiroApi.contasReceber.criar).mockRejectedValueOnce(new Error('falha'));
    const { user, dialog } = await openQuickLaunch();

    await user.click(within(dialog).getByRole('button', { name: /conta a receber/i }));
    await user.type(within(dialog).getByPlaceholderText(/sal.rio/i), 'Servico prestado');
    await user.type(within(dialog).getByLabelText('Valor'), '300');

    await user.click(within(dialog).getAllByRole('button', { name: 'Nova pessoa' })[0]);
    await user.click(screen.getByRole('button', { name: 'Salvar pessoa' }));
    await user.selectOptions(within(dialog).getByLabelText(/adicionar pagador/i), 'r1');
    await user.click(within(dialog).getByRole('button', { name: 'Nova forma de pagamento' }));
    await user.click(screen.getByRole('button', { name: 'Salvar forma' }));
    await user.click(within(dialog).getByRole('button', { name: 'Nova categoria' }));
    expect(screen.getByRole('dialog', { name: 'Nova conta gerencial Receita' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar conta' }));

    await user.click(within(dialog).getByRole('button', { name: /^Lan./i }));

    await waitFor(() => expect(financeiroApi.contasReceber.criar).toHaveBeenCalledTimes(1));
    expect(financeiroApi.contasReceber.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: 'Servico prestado',
        valorOriginal: 300,
        pagadorId: 'r1',
        responsavelId: 'p-new',
        formaPagamentoId: 'f-new',
        cartaoId: null,
        rateios: [{ contaGerencialId: 'cg-new', valor: 300 }]
      })
    );
    expect(notify).toHaveBeenCalledWith('error', expect.stringMatching(/falha ao criar lan.amento/i), 'Erro de API');
    expect(screen.getByRole('dialog', { name: /lan.amento r.pido/i })).toBeInTheDocument();
  });

  it('notifies when option loading fails', async () => {
    vi.mocked(cadastrosApi.pessoas.listar).mockRejectedValueOnce(new Error('falha'));

    await openQuickLaunch();

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('error', expect.stringMatching(/falha ao carregar op..es do lan.amento r.pido/i))
    );
  });

  it('passes quantidadeParcelas in the API payload', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.type(within(dialog).getByPlaceholderText(/mercado/i), 'Teste parcelas');
    await user.type(within(dialog).getByLabelText('Valor'), '300');
    fireEvent.change(within(dialog).getByLabelText('Número de parcelas'), { target: { value: '3' } });
    await user.selectOptions(await within(dialog).findByLabelText('Recebedor'), 'p1');
    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-pix');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'cd1');

    await user.click(within(dialog).getByRole('button', { name: /^Lan./i }));

    await waitFor(() => expect(financeiroApi.contasPagar.criar).toHaveBeenCalledTimes(1));
    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({ quantidadeParcelas: 3 })
    );
  });

  it('auto-fills responsável from conta gerencial responsavelPadraoId', async () => {
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockImplementation((filters: { tipo?: string }) => {
      if (filters.tipo === 'Receita') return Promise.resolve(receitasResponse as never);
      return Promise.resolve({
        items: [
          { id: 'cd1', codigo: '1.1', descricao: 'Mercado', aceitaLancamentos: true, responsavelPadraoId: 'r1' }
        ]
      } as never);
    });

    const { user, dialog } = await openQuickLaunch();

    await user.selectOptions(await within(dialog).findByLabelText('Categoria'), 'cd1');

    // Auto-fill adds responsável as a chip — verify via the remove button's aria-label
    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: /Remover Responsavel/i })).toBeInTheDocument();
    });
  });

  it('renders "Já liquidada?" toggle inline alongside the payment form (not full-row)', async () => {
    const { dialog } = await openQuickLaunch();

    const toggle = await within(dialog).findByRole('switch', { name: /j. liquidada/i });
    // The toggle must NOT be in a md:col-span-2 container (it's now inline, sharing a row)
    expect(toggle.closest('[class*="col-span-2"]')).toBeNull();
  });

  it('switches to transferencia tipo and submits a transfer', async () => {
    vi.mocked(financeiroApi.transferencias.criar).mockResolvedValue(undefined as never);
    const { user, dialog } = await openQuickLaunch();

    await user.click(within(dialog).getByRole('button', { name: /transfer.ncia/i }));

    // Should now show conta origem/destino selects
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/Conta origem/i)).toBeInTheDocument()
    );

    await user.type(within(dialog).getByLabelText('Valor'), '500');
    await user.selectOptions(within(dialog).getByLabelText(/Conta origem/i), 'cb1');
    await user.selectOptions(within(dialog).getByLabelText(/Conta destino/i), 'cb2');

    await user.click(within(dialog).getByRole('button', { name: /^Transferir$/i }));

    await waitFor(() => expect(financeiroApi.transferencias.criar).toHaveBeenCalledTimes(1));
    expect(financeiroApi.transferencias.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        contaBancariaOrigemId: 'cb1',
        contaBancariaDestinoId: 'cb2',
        valor: 500
      })
    );
    expect(notify).toHaveBeenCalledWith('success', 'Transferência registrada');
  });

  it('mostra chips com QLValorInput para multiplos responsaveis e envia responsaveisAdicionaisIds', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.type(within(dialog).getByPlaceholderText(/mercado/i), 'Rateio teste');
    await user.type(within(dialog).getByLabelText('Valor'), '200');
    await user.selectOptions(await within(dialog).findByLabelText('Recebedor'), 'p1');

    // Selecionar auto-adiciona (não há botão add externo)
    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r1');

    // Chip do primeiro responsável aparece
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /Remover Responsavel$/i })).toBeInTheDocument()
    );

    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r2');

    // Chip do segundo responsável aparece e QLValorInputs ficam visíveis (count > 1)
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /Remover Responsavel Dois/i })).toBeInTheDocument()
    );
    // Dois inputs de valor devem existir (QLValorInput para cada responsável)
    const valorInputs = within(dialog).getAllByDisplayValue(/R\$/);
    expect(valorInputs.length).toBeGreaterThanOrEqual(2);

    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-pix');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'cd1');
    await user.click(within(dialog).getByRole('button', { name: /^Lan./i }));

    await waitFor(() => expect(financeiroApi.contasPagar.criar).toHaveBeenCalledTimes(1));
    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        responsaveisAdicionaisIds: ['r1', 'r2']
      })
    );
  });

  it('remove responsavel secundario mantendo o primario como chip', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.selectOptions(await within(dialog).findByLabelText(/adicionar respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r2');

    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /Remover Responsavel Dois/i })).toBeInTheDocument()
    );

    // Remove o secundário (else branch em removeResp)
    await user.click(within(dialog).getByRole('button', { name: /Remover Responsavel Dois/i }));

    await waitFor(() =>
      expect(within(dialog).queryByRole('button', { name: /Remover Responsavel Dois/i })).not.toBeInTheDocument()
    );
    // Primário permanece
    expect(within(dialog).getByRole('button', { name: /Remover Responsavel$/i })).toBeInTheDocument();
    // Com apenas 1 responsável, nenhum QLValorInput deve aparecer (count <= 1)
    expect(within(dialog).queryAllByDisplayValue(/R\$/).length).toBe(0);
  });

  it('fecha QuickAdd modals via handler onClose sem salvar', async () => {
    const { user, dialog } = await openQuickLaunch();

    // Abre QuickAddPessoa e fecha via onClose
    await user.click(within(dialog).getAllByRole('button', { name: 'Nova pessoa' })[0]);
    expect(screen.getByRole('dialog', { name: 'Nova pessoa' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fechar pessoa' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova pessoa' })).not.toBeInTheDocument());

    // Abre QuickAddFormaPagamento e fecha via onClose
    await user.click(within(dialog).getByRole('button', { name: 'Nova forma de pagamento' }));
    expect(screen.getByRole('dialog', { name: 'Nova forma de pagamento' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fechar forma' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nova forma de pagamento' })).not.toBeInTheDocument());

    // Abre QuickAddContaGerencial e fecha via onClose
    await user.click(within(dialog).getByRole('button', { name: 'Nova categoria' }));
    await user.click(screen.getByRole('button', { name: 'Fechar conta' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nova conta gerencial/i })).not.toBeInTheDocument());
  });

  it('QLValorInput: focus mostra valor raw, blur com novo valor distribui remainder e envia valoresPorResponsavel', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.type(within(dialog).getByPlaceholderText(/mercado/i), 'Teste valor');
    await user.type(within(dialog).getByLabelText('Valor'), '200');
    await user.selectOptions(await within(dialog).findByLabelText('Recebedor'), 'p1');

    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r2');

    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /Remover Responsavel Dois/i })).toBeInTheDocument()
    );

    // Chip inputs mostram valor formatado (unfocused branch)
    const valorInputs = within(dialog).getAllByDisplayValue(/R\$/);
    expect(valorInputs).toHaveLength(2);

    // Focus no primeiro chip → mostra raw (focused branch)
    fireEvent.focus(valorInputs[0]);
    const rawInput = within(dialog).getAllByDisplayValue(/100[,.]00/)[0];
    fireEvent.change(rawInput, { target: { value: '150,00' } });
    fireEvent.blur(rawInput);

    // Após blur: handleValorChange distribui remainder (50) ao outro chip
    await waitFor(() => {
      const inputs = within(dialog).getAllByDisplayValue(/R\$/);
      expect(inputs).toHaveLength(2);
    });

    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-pix');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'cd1');
    await user.click(within(dialog).getByRole('button', { name: /^Lan./i }));

    await waitFor(() => expect(financeiroApi.contasPagar.criar).toHaveBeenCalledTimes(1));
    // valoresOk = true → payload inclui valoresPorResponsavel
    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        responsaveisAdicionaisIds: ['r1', 'r2'],
        valoresPorResponsavel: [150, 50]
      })
    );
  });

  it('shows confirm-close dialog when dirty form receives close request', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.type(within(dialog).getByPlaceholderText(/mercado/i), 'Teste');

    // Press escape to trigger requestClose on dirty form
    await user.keyboard('{Escape}');

    // Confirm close dialog should appear ("Descartar dados?")
    expect(await screen.findByText(/Descartar dados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar editando/i })).toBeInTheDocument();
    // Dismiss it
    await user.click(screen.getByRole('button', { name: /Continuar editando/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Descartar dados/i)).not.toBeInTheDocument();
    });
  });
});
