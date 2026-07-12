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
    contasGerenciais: { listar: vi.fn() }
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { criar: vi.fn() },
    contasReceber: { criar: vi.fn() }
  }
}));

vi.mock('../../store/notification-store', () => ({
  notify: vi.fn()
}));

vi.mock('../../services/http/api-error', () => ({
  getApiErrorMessage: () => 'Erro de API'
}));

const pessoasResponse = {
  items: [
    { id: 'p1', nome: 'Mercado', ehResponsavel: false },
    { id: 'r1', nome: 'Responsavel', ehResponsavel: true }
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
    await user.selectOptions(within(dialog).getByLabelText(/respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-card');
    await user.selectOptions(within(dialog).getByLabelText('Conta gerencial'), 'cd1');

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
    await user.selectOptions(within(dialog).getByLabelText(/respons.vel/i), 'r1');
    await user.click(within(dialog).getByRole('button', { name: 'Nova forma de pagamento' }));
    await user.click(screen.getByRole('button', { name: 'Salvar forma' }));
    await user.click(within(dialog).getByRole('button', { name: 'Nova conta gerencial' }));
    expect(screen.getByRole('dialog', { name: 'Nova conta gerencial Receita' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar conta' }));

    await user.click(within(dialog).getByRole('button', { name: /^Lan./i }));

    await waitFor(() => expect(financeiroApi.contasReceber.criar).toHaveBeenCalledTimes(1));
    expect(financeiroApi.contasReceber.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: 'Servico prestado',
        valorOriginal: 300,
        pagadorId: 'p-new',
        responsavelId: 'r1',
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
    await user.selectOptions(within(dialog).getByLabelText(/respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-pix');
    await user.selectOptions(within(dialog).getByLabelText('Conta gerencial'), 'cd1');

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

    await user.selectOptions(await within(dialog).findByLabelText('Conta gerencial'), 'cd1');

    await waitFor(() => {
      const select = within(dialog).getByLabelText(/respons.vel/i) as HTMLSelectElement;
      expect(select.value).toBe('r1');
    });
  });

  it('renders "Já liquidada?" toggle inline alongside the payment form (not full-row)', async () => {
    const { dialog } = await openQuickLaunch();

    const toggle = await within(dialog).findByRole('switch');
    // The toggle must NOT be in a md:col-span-2 container (it's now inline, sharing a row)
    expect(toggle.closest('[class*="col-span-2"]')).toBeNull();
  });
});
