import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../../services/http/financeiro-api', () => ({
  financeiroApi: {
    reembolsos: {
      criar: vi.fn(),
    },
  },
}));

vi.mock('../module-config', () => ({
  contasReceberModuleConfig: {
    loadRateioOptions: vi.fn().mockResolvedValue([
      { value: 'cg1', label: 'Receita Geral' },
    ]),
  },
}));

import { financeiroApi } from '../../../services/http/financeiro-api';
import { ReembolsoModal } from './ReembolsoModal';

const onClose = vi.fn();
const onSuccess = vi.fn();

const defaultProps = {
  open: true,
  contaId: 'conta-001',
  descricao: 'Conta teste',
  valorLiquido: 500,
  quantidadeParcelas: 1,
  dataVencimento: '2026-08-01',
  pessoaOptions: [
    { value: 'p1', label: 'Alice' },
    { value: 'p2', label: 'Bob' },
  ],
  formaPagamentoOptions: [
    { value: 'fp1', label: 'Pix', ehCartao: false, baixarAutomaticamente: false },
    { value: 'fp2', label: 'Dinheiro', ehCartao: false, baixarAutomaticamente: false },
  ],
  onClose,
  onSuccess,
};

function renderModal(props: Partial<typeof defaultProps> = {}) {
  return render(
    <MemoryRouter>
      <ReembolsoModal {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

/** Selects an option in a ComboBox by clicking the input then the option button. */
async function selectComboOption(user: ReturnType<typeof userEvent.setup>, ariaLabel: RegExp | string, optionText: string) {
  const input = screen.getByRole('combobox', { name: ariaLabel });
  await user.click(input);
  const option = await screen.findByRole('button', { name: optionText });
  await user.click(option);
}

describe('ReembolsoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open=false', () => {
    const { container } = renderModal({ open: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the modal dialog and origin banner when open=true', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: /Gerar reembolso/i })).toBeInTheDocument();
    expect(screen.getByText('Conta teste')).toBeInTheDocument();
  });

  it('does not show parcelarIgual when quantidadeParcelas=1', () => {
    renderModal({ quantidadeParcelas: 1 });
    expect(screen.queryByText(/Parcelar igual/i)).not.toBeInTheDocument();
  });

  it('shows parcelarIgual checkbox when quantidadeParcelas > 1', () => {
    renderModal({ quantidadeParcelas: 3 });
    expect(screen.getByText(/Parcelar igual/i)).toBeInTheDocument();
  });

  it('adds a pagador via ComboBox and shows the chip', async () => {
    renderModal();
    const user = userEvent.setup();
    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('removes a pagador chip via × button', async () => {
    renderModal();
    const user = userEvent.setup();
    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByText('Alice')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Remover Alice/i }));
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('shows divisão igualitária when 2+ pagadores are added', async () => {
    renderModal({ valorLiquido: 200 });
    const user = userEvent.setup();
    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await selectComboOption(user, /Adicionar pagador/i, 'Bob');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByText(/Valor dividido igualmente/i)).toBeInTheDocument();
  });

  it('shows error when no pagadores added on submit', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Gerar Reembolso/i }));
    await waitFor(() =>
      expect(screen.getByText(/Adicione ao menos um pagador/i)).toBeInTheDocument()
    );
  });

  it('shows error when valor field is cleared (empty = NaN)', async () => {
    renderModal();
    const valorInput = screen.getByPlaceholderText('0,00');
    fireEvent.change(valorInput, { target: { value: '' } });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Gerar Reembolso/i }));
    await waitFor(() =>
      expect(screen.getByText(/Informe um valor válido/i)).toBeInTheDocument()
    );
  });

  it('shows error when forma de pagamento is missing', async () => {
    renderModal();
    const user = userEvent.setup();
    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.click(screen.getByRole('button', { name: /Gerar Reembolso/i }));
    await waitFor(() =>
      expect(screen.getByText(/Selecione a forma de pagamento/i)).toBeInTheDocument()
    );
  });

  it('shows error when conta gerencial is missing', async () => {
    renderModal();
    const user = userEvent.setup();
    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await selectComboOption(user, /Forma de pagamento/i, 'Pix');
    await user.click(screen.getByRole('button', { name: /Gerar Reembolso/i }));
    await waitFor(() =>
      expect(screen.getByText(/Selecione a conta gerencial/i)).toBeInTheDocument()
    );
  });

  it('calls onSuccess after successful submission', async () => {
    const mockResult = {
      grupoReembolsoId: 'gr1',
      contasReceber: [
        { id: 'cr1', pagadorId: 'p1', pagadorNome: 'Alice', numeroParcela: 1, quantidadeParcelas: 1, valorLiquido: 500, dataVencimento: '2026-08-01', descricao: 'Reembolso: Conta teste' },
      ],
    };
    vi.mocked(financeiroApi.reembolsos.criar).mockResolvedValue(mockResult);

    renderModal();
    const user = userEvent.setup();

    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await selectComboOption(user, /Forma de pagamento/i, 'Pix');

    // Open conta gerencial, wait for async load, then select
    const cgInput = screen.getByRole('combobox', { name: /Conta gerencial/i });
    await user.click(cgInput);
    await screen.findByRole('button', { name: 'Receita Geral' });
    await user.click(screen.getByRole('button', { name: 'Receita Geral' }));

    await user.click(screen.getByRole('button', { name: /Gerar Reembolso/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(mockResult));
  });

  it('shows API error banner when criar fails', async () => {
    vi.mocked(financeiroApi.reembolsos.criar).mockRejectedValue(
      Object.assign(new Error('Erro server'), {
        isAxiosError: true,
        response: { data: { message: 'Conta já reembolsada' } },
      })
    );

    renderModal();
    const user = userEvent.setup();

    await selectComboOption(user, /Adicionar pagador/i, 'Alice');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await selectComboOption(user, /Forma de pagamento/i, 'Pix');

    const cgInput = screen.getByRole('combobox', { name: /Conta gerencial/i });
    await user.click(cgInput);
    await screen.findByRole('button', { name: 'Receita Geral' });
    await user.click(screen.getByRole('button', { name: 'Receita Geral' }));

    await user.click(screen.getByRole('button', { name: /Gerar Reembolso/i }));

    await waitFor(() =>
      expect(screen.getByText('Conta já reembolsada')).toBeInTheDocument()
    );
  });

  it('calls onClose when the Fechar (×) button is clicked', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancelar button is clicked', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
