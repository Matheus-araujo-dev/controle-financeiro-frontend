/**
 * PROD-04: Intent-based quick launch labels ("Vou pagar", "Vou receber", "Transferir").
 * PROD-05: "Salvar e lançar outro" button — saves and resets transient fields.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickLaunchButton, QuickLaunchModal } from './QuickLaunchButton';
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
  QuickAddPessoaModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="Nova pessoa" /> : null)
}));

vi.mock('../../features/cadastros/quick-add/QuickAddFormaPagamentoModal', () => ({
  QuickAddFormaPagamentoModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="Nova forma" /> : null)
}));

vi.mock('../../features/cadastros/quick-add/QuickAddContaGerencialModal', () => ({
  QuickAddContaGerencialModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="Nova conta gerencial" /> : null)
}));

vi.mock('../../features/cadastros/quick-add/QuickAddCartaoModal', () => ({
  QuickAddCartaoModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="Novo cartao" /> : null)
}));

vi.mock('../../features/cadastros/quick-add/QuickAddContaBancariaModal', () => ({
  QuickAddContaBancariaModal: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="Nova conta bancaria" /> : null)
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

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { criar: vi.fn(), listar: vi.fn(), obterPorId: vi.fn() },
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

const pessoasResponse = {
  items: [
    { id: 'p1', nome: 'Mercado', ehResponsavel: false, ehRecebedor: true },
    { id: 'r1', nome: 'Responsavel', ehResponsavel: true, ehRecebedor: false }
  ]
};

const recebedoresResponse = {
  items: [{ id: 'p1', nome: 'Mercado', ehResponsavel: false, ehRecebedor: true }]
};

const responsaveisResponse = {
  items: [{ id: 'r1', nome: 'Responsavel', ehResponsavel: true, ehRecebedor: false }]
};

const pagadoresResponse = {
  items: [{ id: 'r1', nome: 'Responsavel', ehPagador: true }]
};

const formasResponse = {
  items: [{ id: 'f-pix', nome: 'Pix', ehCartao: false }]
};

const cartoesResponse = { items: [] };

const despesasResponse = {
  items: [{ id: 'cd1', codigo: '1.1', descricao: 'Mercado', aceitaLancamentos: true }]
};

const receitasResponse = {
  items: [{ id: 'cr1', codigo: '2.1', descricao: 'Salario', aceitaLancamentos: true }]
};

const contasBancariasResponse = {
  items: [
    { id: 'cb1', nome: 'Conta Corrente' },
    { id: 'cb2', nome: 'Conta Poupança' }
  ]
};

function mockSuccessfulOptions() {
  vi.mocked(cadastrosApi.pessoas.listar).mockImplementation((filters: Record<string, unknown>) => {
    if (filters.ehRecebedor === true) return Promise.resolve(recebedoresResponse as never);
    if (filters.ehResponsavel === true) return Promise.resolve(responsaveisResponse as never);
    if (filters.ehPagador === true) return Promise.resolve(pagadoresResponse as never);
    return Promise.resolve(pessoasResponse as never);
  });
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

describe('PROD-04: Intent-based labels', () => {
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

  it('renders intent-based labels: "Vou pagar", "Vou receber", "Transferir"', async () => {
    const { dialog } = await openQuickLaunch();

    expect(within(dialog).getByRole('button', { name: /Vou pagar/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Vou receber/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Transferir/i })).toBeInTheDocument();
  });

  it('"Vou pagar" is selected by default and shows pagar form', async () => {
    const { dialog } = await openQuickLaunch();

    const vouPagarBtn = within(dialog).getByRole('button', { name: /Vou pagar/i });
    // Should be visually selected (has primary styling)
    expect(vouPagarBtn.className).toMatch(/bg-primary/);

    // Pagar form: shows recebedor field
    expect(within(dialog).getByLabelText('Recebedor')).toBeInTheDocument();
  });

  it('clicking "Vou receber" switches to receber form', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.click(within(dialog).getByRole('button', { name: /Vou receber/i }));

    // Receber form: shows "Responsável" and "Pagador" instead of "Recebedor"
    await waitFor(() =>
      expect(within(dialog).getByLabelText('Responsável')).toBeInTheDocument()
    );
  });

  it('clicking "Transferir" switches to transfer form', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.click(within(dialog).getByRole('button', { name: /Transferir/i }));

    await waitFor(() =>
      expect(within(dialog).getByLabelText(/Conta origem/i)).toBeInTheDocument()
    );
    expect(within(dialog).getByLabelText(/Conta destino/i)).toBeInTheDocument();
  });

  it('tipo buttons have Material Symbols icons', async () => {
    const { dialog } = await openQuickLaunch();

    // Each button should contain an icon span
    const buttons = [
      within(dialog).getByRole('button', { name: /Vou pagar/i }),
      within(dialog).getByRole('button', { name: /Vou receber/i }),
      within(dialog).getByRole('button', { name: /Transferir/i })
    ];

    for (const btn of buttons) {
      const icon = btn.querySelector('.material-symbols-outlined');
      expect(icon).toBeTruthy();
    }
  });
});

describe('PROD-05: Salvar e lançar outro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.className = '';
    mockSuccessfulOptions();
    vi.mocked(financeiroApi.contasPagar.criar).mockResolvedValue({ id: 'new-1' } as never);
    vi.mocked(financeiroApi.contasReceber.criar).mockResolvedValue({ id: 'new-2' } as never);
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue({ totalItems: 0, items: [], page: 1, pageSize: 5, totalPages: 0 } as never);
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue({ totalItems: 0, items: [], page: 1, pageSize: 5, totalPages: 0 } as never);
  });

  it('shows "Salvar e lançar outro" button for pagar tipo', async () => {
    const { dialog } = await openQuickLaunch();

    expect(within(dialog).getByRole('button', { name: /Salvar e lan.ar outro/i })).toBeInTheDocument();
  });

  it('hides "Salvar e lançar outro" for transferência tipo', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.click(within(dialog).getByRole('button', { name: /Transferir/i }));

    await waitFor(() =>
      expect(within(dialog).queryByRole('button', { name: /Salvar e lan.ar outro/i })).not.toBeInTheDocument()
    );
  });

  it('hides "Salvar e lançar outro" for reembolso mode', async () => {
    render(
      <QuickLaunchModal
        onClose={vi.fn()}
        isReembolso
        initialValues={{
          tipo: 'pagar',
          pessoaId: 'p1',
          pessoaNome: 'Mercado',
          responsavelId: 'r1',
          valor: 100,
          dataVencimento: '2026-09-20',
          descricao: 'Reembolso test'
        }}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(cadastrosApi.pessoas.listar).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: /Salvar e lan.ar outro/i })).not.toBeInTheDocument();
  });

  it('submits and resets transient fields, keeping stable fields', async () => {
    const { user, dialog } = await openQuickLaunch();

    // Fill out a complete pagar form
    await user.type(within(dialog).getByPlaceholderText(/mercado/i), 'Compra primeira');
    await user.type(within(dialog).getByLabelText('Valor'), '150');
    await user.selectOptions(await within(dialog).findByLabelText('Recebedor'), 'p1');
    await user.selectOptions(within(dialog).getByLabelText(/adicionar respons.vel/i), 'r1');
    await user.selectOptions(within(dialog).getByLabelText('Forma de pagamento'), 'f-pix');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'cd1');

    // Click "Salvar e lançar outro"
    await user.click(within(dialog).getByRole('button', { name: /Salvar e lan.ar outro/i }));

    // Should have called criar
    await waitFor(() => expect(financeiroApi.contasPagar.criar).toHaveBeenCalledTimes(1));

    // Verify success notification
    expect(notify).toHaveBeenCalledWith('success', expect.stringMatching(/lan.amento criado/i), 'Compra primeira');

    // Modal should still be open (not closed)
    expect(screen.getByRole('dialog', { name: /lan.amento r.pido/i })).toBeInTheDocument();

    // Transient fields should be reset
    await waitFor(() => {
      // Description should be empty
      const descInput = within(dialog).getByPlaceholderText(/mercado/i);
      expect(descInput).toHaveValue('');
    });

    // Stable fields should be preserved (recebedor, forma de pagamento, categoria remain selected)
    expect(within(dialog).getByLabelText('Recebedor')).toHaveValue('p1');
    expect(within(dialog).getByLabelText('Forma de pagamento')).toHaveValue('f-pix');
    expect(within(dialog).getByLabelText('Categoria')).toHaveValue('cd1');
  }, 30000);

  it('"Salvar e lançar outro" is disabled when form is incomplete', async () => {
    const { dialog } = await openQuickLaunch();

    // Without filling any fields, button should be disabled
    const btn = within(dialog).getByRole('button', { name: /Salvar e lan.ar outro/i });
    expect(btn).toBeDisabled();
  });

  it('shows "Salvar e lançar outro" for receber tipo', async () => {
    const { user, dialog } = await openQuickLaunch();

    await user.click(within(dialog).getByRole('button', { name: /Vou receber/i }));

    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /Salvar e lan.ar outro/i })).toBeInTheDocument()
    );
  });
});
