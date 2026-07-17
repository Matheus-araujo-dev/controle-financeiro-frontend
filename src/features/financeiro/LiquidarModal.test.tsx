import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiquidarModal } from './LiquidarModal';

vi.mock('../cadastros/quick-add/QuickAddContaBancariaModal', () => ({
  QuickAddContaBancariaModal: () => null
}));

vi.mock('../cadastros/quick-add/QuickAddFormaPagamentoModal', () => ({
  QuickAddFormaPagamentoModal: () => null
}));

const contaOptions = [
  { value: 'cb1', label: 'Conta Principal' },
  { value: 'cb2', label: 'Conta Reserva' }
];

const formaOptions = [
  { value: 'fp1', label: 'PIX' },
  { value: 'fp2', label: 'Boleto' }
];

function renderModal(overrides: Partial<React.ComponentProps<typeof LiquidarModal>> = {}) {
  const onClose = vi.fn();
  const onConfirmar = vi.fn();
  const result = render(
    <LiquidarModal
      open={true}
      descricao="Aluguel"
      valorLiquido={1000}
      valorPago={null}
      formaPagamentoId={null}
      ehRecorrente={false}
      contaBancariaOptions={contaOptions}
      formaPagamentoOptions={formaOptions}
      defaultContaBancariaId="cb1"
      loading={false}
      error={undefined}
      onClose={onClose}
      onConfirmar={onConfirmar}
      {...overrides}
    />
  );
  return { ...result, onClose, onConfirmar };
}

describe('LiquidarModal', () => {
  it('does not render when closed', () => {
    renderModal({ open: false });
    expect(screen.queryByText('Liquidar lançamento')).not.toBeInTheDocument();
  });

  it('renders header and description when open', () => {
    renderModal();
    expect(screen.getByText('Liquidar lançamento')).toBeInTheDocument();
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText(/Data do pagamento/i)).toBeInTheDocument();
  });

  it('shows valor pago ja pago info when valorPago is set', () => {
    renderModal({ valorPago: 400, valorLiquido: 1000 });
    expect(screen.getByText(/Já pago/i)).toBeInTheDocument();
    expect(screen.getByText(/Restante/i)).toBeInTheDocument();
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows error message when error prop is set', () => {
    renderModal({ error: 'Falha ao liquidar conta' });
    expect(screen.getByText('Falha ao liquidar conta')).toBeInTheDocument();
  });

  it('renders Confirmar button when valor equals valorLiquido (isIgual)', () => {
    // defaultContaBancariaId='cb1' and valor=1000=valorLiquido → isIgual=true
    renderModal();
    expect(screen.getByRole('button', { name: /Confirmar$/i })).toBeInTheDocument();
  });

  it('Confirmar button is disabled when no contaBancariaId', () => {
    renderModal({ defaultContaBancariaId: '' });
    const btn = screen.getByRole('button', { name: /Confirmar|Próximo/i });
    expect(btn).toBeDisabled();
  });

  it('calls onConfirmar with correct values on exact payment', async () => {
    const { onConfirmar } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /Confirmar$/i }));
    expect(onConfirmar).toHaveBeenCalledOnce();
    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({
        valorLiquidacao: 1000,
        contaBancariaId: 'cb1',
        atualizarValorConta: false,
        cancelarValorRestante: false
      })
    );
  });

  it('does not call onConfirmar when loading', async () => {
    const { onConfirmar } = renderModal({ loading: true });
    const btn = screen.getByRole('button', { name: /Confirmar/i });
    // button disabled while loading=true and isIgual=true
    expect(btn).toBeDisabled();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('shows Dividir em mais meios de pagamento button in form step', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /Dividir em mais meios/i })).toBeInTheDocument();
  });

  it('advances to step opcoes when valor is higher than valorLiquido', async () => {
    renderModal();
    // Find CurrencyInput by label "Valor pago"
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '1200,00');
    await userEvent.tab(); // trigger blur to parse

    expect(screen.getByRole('button', { name: /Próximo/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(screen.getByText(/maior que o original/i)).toBeInTheDocument();
    expect(screen.getByText(/Atualizar valor da conta/i)).toBeInTheDocument();
  });

  it('shows valor acima text when valor is higher', async () => {
    renderModal();
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '1500,00');
    await userEvent.tab();

    expect(screen.getByText(/acima do valor original/i)).toBeInTheDocument();
  });

  it('shows valor abaixo text when valor is lower', async () => {
    renderModal();
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '800,00');
    await userEvent.tab();

    expect(screen.getByText(/abaixo do valor original/i)).toBeInTheDocument();
  });

  it('goes to step opcoes with isMenor options when valor is lower', async () => {
    renderModal();
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '800,00');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(screen.getByText(/O que fazer com o restante/i)).toBeInTheDocument();
    expect(screen.getByText(/Manter em aberto/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancelar o restante/i)).toBeInTheDocument();
  });

  it('goes back from step opcoes to form on Voltar click', async () => {
    renderModal();
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '1200,00');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    expect(screen.getByText(/maior que o original/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Voltar/i }));
    expect(screen.getByText(/Data do pagamento/i)).toBeInTheDocument();
    expect(screen.queryByText(/maior que o original/i)).not.toBeInTheDocument();
  });

  it('calls onConfirmar from step opcoes with atualizarValorConta=true when maior', async () => {
    const { onConfirmar } = renderModal();
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '1200,00');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await userEvent.click(screen.getByRole('button', { name: /Confirmar liquidação/i }));

    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({
        atualizarValorConta: true,
        cancelarValorRestante: false
      })
    );
  });

  it('calls onConfirmar with cancelarValorRestante=true when option is selected on menor', async () => {
    const { onConfirmar } = renderModal();
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '800,00');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await userEvent.click(screen.getByText(/Cancelar o restante/i));
    await userEvent.click(screen.getByRole('button', { name: /Confirmar liquidação/i }));

    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelarValorRestante: true
      })
    );
  });

  it('shows atualizarRecorrencia toggle when ehRecorrente=true in isMaior step', async () => {
    renderModal({ ehRecorrente: true });
    const valorInput = screen.getByDisplayValue(/1\.000/);
    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '1200,00');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    expect(screen.getByText(/Atualizar valor da recorrência/i)).toBeInTheDocument();
  });

  it('shows multi-row total after clicking dividir', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: /Dividir em mais meios/i }));
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it('resets to step form when modal is reopened', () => {
    const { rerender, onConfirmar } = renderModal();
    // Close then reopen
    rerender(
      <LiquidarModal
        open={false}
        descricao="Aluguel"
        valorLiquido={1000}
        valorPago={null}
        formaPagamentoId={null}
        ehRecorrente={false}
        contaBancariaOptions={contaOptions}
        formaPagamentoOptions={formaOptions}
        defaultContaBancariaId="cb1"
        loading={false}
        onClose={vi.fn()}
        onConfirmar={onConfirmar}
      />
    );
    rerender(
      <LiquidarModal
        open={true}
        descricao="Aluguel"
        valorLiquido={1000}
        valorPago={null}
        formaPagamentoId={null}
        ehRecorrente={false}
        contaBancariaOptions={contaOptions}
        formaPagamentoOptions={formaOptions}
        defaultContaBancariaId="cb1"
        loading={false}
        onClose={vi.fn()}
        onConfirmar={onConfirmar}
      />
    );
    // Should be back to form step
    expect(screen.getByText(/Data do pagamento/i)).toBeInTheDocument();
    expect(screen.queryByText(/Confirmar liquidação/i)).not.toBeInTheDocument();
  });
});
