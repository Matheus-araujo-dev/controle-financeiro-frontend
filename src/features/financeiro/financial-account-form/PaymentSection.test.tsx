import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { PaymentSection } from './PaymentSection';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { FinanceiroFormValues } from '../module-config';

vi.mock('../../cadastros/quick-add/QuickAddFormaPagamentoModal', () => ({
  QuickAddFormaPagamentoModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">QuickAddForma</div> : null,
}));
vi.mock('../../cadastros/quick-add/QuickAddCartaoModal', () => ({
  QuickAddCartaoModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">QuickAddCartao</div> : null,
}));
vi.mock('../../cadastros/quick-add/QuickAddContaBancariaModal', () => ({
  QuickAddContaBancariaModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">QuickAddConta</div> : null,
}));

const reloadFormaPagamentoOptions = vi.fn().mockResolvedValue(undefined);
const reloadCartaoOptions = vi.fn().mockResolvedValue(undefined);
const reloadContaBancariaOptions = vi.fn().mockResolvedValue(undefined);

function PaymentWrapper({
  ehCartao = false,
  baixarAutomaticamente = false,
  dataLiquidacao = '',
  formaPagamentoOptions = [{ label: 'Dinheiro', value: 'fp1', ehCartao: false, baixarAutomaticamente: false }],
  cartaoOptions = [{ label: 'Visa', value: 'c1' }],
  contaBancariaOptions = [{ label: 'Conta Corrente', value: 'cb1' }],
}: {
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  dataLiquidacao?: string;
  formaPagamentoOptions?: { label: string; value: string; ehCartao?: boolean; baixarAutomaticamente?: boolean }[];
  cartaoOptions?: { label: string; value: string }[];
  contaBancariaOptions?: { label: string; value: string }[];
}) {
  const form = useForm<FinanceiroFormValues>({
    defaultValues: {
      formaPagamentoId: 'fp1',
      cartaoId: '',
      contaBancariaId: '',
      dataLiquidacao,
      dataCompra: '',
    } as never,
  });

  const api = {
    control: form.control,
    errors: {} as never,
    canEdit: true,
    formaPagamentoBehavior: { ehCartao, baixarAutomaticamente } as never,
    watchedValues: { dataLiquidacao } as never,
    formaPagamentoOptions,
    cartaoOptions,
    contaBancariaOptions,
    setValue: form.setValue as never,
    reloadFormaPagamentoOptions,
    reloadCartaoOptions,
    reloadContaBancariaOptions,
  } as unknown as FinancialAccountFormApi;

  return <PaymentSection form={api} />;
}

describe('PaymentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Forma de Pagamento field', () => {
    render(<PaymentWrapper />);
    expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
  });

  it('does not show Cartão or Conta fields for non-cartão payment', () => {
    render(<PaymentWrapper />);
    expect(screen.queryByText('Cartão de Crédito')).not.toBeInTheDocument();
    expect(screen.queryByText('Data da Compra')).not.toBeInTheDocument();
  });

  it('shows Cartão de Crédito and Data da Compra fields when ehCartao=true', () => {
    render(<PaymentWrapper ehCartao />);
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
    expect(screen.getByText('Data da Compra')).toBeInTheDocument();
  });

  it('shows Conta para Baixa field when baixarAutomaticamente=true', () => {
    render(<PaymentWrapper baixarAutomaticamente />);
    expect(screen.getByText('Conta para Baixa')).toBeInTheDocument();
  });

  it('shows Conta de Liquidação field when dataLiquidacao is set (non-cartão)', () => {
    render(<PaymentWrapper dataLiquidacao="2026-08-01" />);
    expect(screen.getByText('Conta de Liquidação')).toBeInTheDocument();
  });

  it('shows Data Liquidação field when baixarAutomaticamente=true (non-cartão)', () => {
    render(<PaymentWrapper baixarAutomaticamente />);
    expect(screen.getByText('Data Liquidação')).toBeInTheDocument();
  });

  it('opens QuickAddFormaPagamento modal when Adicionar Forma is clicked', async () => {
    render(<PaymentWrapper />);
    // The "Adicionar novo" button in the forma de pagamento ComboBox
    const addBtns = screen.getAllByRole('button', { name: /Adicionar novo/i });
    await userEvent.click(addBtns[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('QuickAddForma');
  });

  it('opens QuickAddCartao modal when Adicionar Cartão is clicked', async () => {
    render(<PaymentWrapper ehCartao />);
    const addBtns = screen.getAllByRole('button', { name: /Adicionar novo/i });
    // First is forma, second is cartão
    await userEvent.click(addBtns[1]);
    expect(screen.getByRole('dialog')).toHaveTextContent('QuickAddCartao');
  });

  it('opens QuickAddContaBancaria modal when Adicionar Conta is clicked', async () => {
    render(<PaymentWrapper baixarAutomaticamente />);
    const addBtns = screen.getAllByRole('button', { name: /Adicionar novo/i });
    // First is forma, second is conta
    await userEvent.click(addBtns[1]);
    expect(screen.getByRole('dialog')).toHaveTextContent('QuickAddConta');
  });
});
