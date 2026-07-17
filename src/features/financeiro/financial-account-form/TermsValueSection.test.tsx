import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { TermsValueSection } from './TermsValueSection';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { FinanceiroFormValues } from '../module-config';

function buildMockFormApi(
  form: ReturnType<typeof useForm<FinanceiroFormValues>>,
  overrides: Partial<FinancialAccountFormApi> = {}
): FinancialAccountFormApi {
  return {
    id: undefined,
    control: form.control,
    errors: {} as never,
    isSubmitting: false,
    isValid: true,
    actionLoading: false,
    canEdit: true,
    canAlterarFuturas: false,
    loading: false,
    valorLiquido: 1000,
    totalRateios: 1000,
    watchedValues: form.watch() as never,
    setValue: form.setValue as never,
    formaPagamentoBehavior: { ehCartao: false, baixarAutomaticamente: false } as never,
    fields: [],
    append: vi.fn(),
    remove: vi.fn(),
    handleSubmit: vi.fn() as never,
    errorMessage: undefined,
    detailStatus: undefined,
    detailFaturaStatus: undefined,
    faturaLocked: false,
    origemCompraPlanejadaId: undefined,
    exibeRecorrencia: false,
    grupoParcelamentoId: undefined,
    numeroParcela: undefined,
    recurringStartDatePreview: null,
    automaticRecurringStartPreview: null,
    cardInvoicePreview: null,
    pessoaOptions: [],
    responsavelOptions: [],
    formaPagamentoOptions: [],
    contaBancariaOptions: [],
    cartaoOptions: [],
    rateioOptions: [],
    pendingValues: null,
    pendingDuplicateValues: null,
    duplicateItems: [],
    pendingFaturaIndisponivelValues: null,
    faturaIndisponivelMessage: null,
    onCancel: vi.fn(),
    cancelar: vi.fn(),
    estornar: vi.fn(),
    onConfirmApenas: vi.fn(),
    onConfirmAlterarFuturas: vi.fn(),
    clearPendingScope: vi.fn(),
    createDespiteDuplicate: vi.fn(),
    cancelDuplicateCheck: vi.fn(),
    confirmarProximaFatura: vi.fn(),
    cancelarFaturaIndisponivel: vi.fn(),
    reloadPessoaOptions: vi.fn(),
    reloadResponsavelOptions: vi.fn(),
    reloadFormaPagamentoOptions: vi.fn(),
    reloadContaBancariaOptions: vi.fn(),
    reloadCartaoOptions: vi.fn(),
    reloadRateioOptions: vi.fn(),
    gerarReembolso: false,
    setGerarReembolso: vi.fn(),
    reembolsoData: null,
    clearReembolso: vi.fn(),
    contaVinculada: null,
    pendingPropagation: null,
    propagarParaVinculada: vi.fn(),
    dismissPropagation: vi.fn(),
    ...overrides,
  } as unknown as FinancialAccountFormApi;
}

function TermsWrapper({
  defaultValues,
  overrides,
  moduloLabel,
}: {
  defaultValues?: Partial<FinanceiroFormValues>;
  overrides?: Partial<FinancialAccountFormApi>;
  moduloLabel?: string;
}) {
  const form = useForm<FinanceiroFormValues>({
    defaultValues: {
      quantidadeParcelas: 1,
      valorOriginal: 100,
      dataVencimento: '2026-08-01',
      dataLiquidacao: '',
      formaPagamentoId: 'fp1',
      ...defaultValues,
    } as never,
  });

  const api = buildMockFormApi(form, {
    watchedValues: form.watch() as never,
    setValue: form.setValue as never,
    ...overrides,
  });

  return <TermsValueSection form={api} moduloLabel={moduloLabel} />;
}

describe('TermsValueSection', () => {
  it('renders default field labels (no cartão, 1 parcela)', () => {
    render(<TermsWrapper />);
    expect(screen.getByText('Data Emissão')).toBeInTheDocument();
    expect(screen.getByText('Data Vencimento')).toBeInTheDocument();
    expect(screen.getByText('Parcelas')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('shows "Já liquidada?" toggle for contas-pagar (not cartão, new form)', () => {
    render(<TermsWrapper />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText(/Já liquidada\?/i)).toBeInTheDocument();
  });

  it('shows "Já recebida?" toggle when moduloLabel=receber', () => {
    render(<TermsWrapper moduloLabel="receber" />);
    expect(screen.getByText(/Já recebida\?/i)).toBeInTheDocument();
  });

  it('shows Data de Liquidação label and Liquidada badge when switch toggled on', async () => {
    render(<TermsWrapper />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByText(/Data de Liquidação/i)).toBeInTheDocument();
    expect(screen.getByText('Liquidada')).toBeInTheDocument();
  });

  it('shows "Recebida" badge for moduloLabel=receber when toggled on', async () => {
    render(<TermsWrapper moduloLabel="receber" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByText('Recebida')).toBeInTheDocument();
    expect(screen.getByText(/Data de Recebimento/i)).toBeInTheDocument();
  });

  it('shows "Valor Total" label and parcela mode toggle buttons when qtdParcelas=3', () => {
    render(<TermsWrapper defaultValues={{ quantidadeParcelas: 3, valorOriginal: 300 }} />);
    expect(screen.getByText('Valor Total')).toBeInTheDocument();
    // Mode toggle buttons appear: ÷3x and ×3x
    expect(screen.getByTitle(/Total ÷ 3x/)).toBeInTheDocument();
    expect(screen.getByTitle(/Parcela × 3x/)).toBeInTheDocument();
  });

  it('switches to parcela mode and shows "Valor Parcela" label', async () => {
    render(<TermsWrapper defaultValues={{ quantidadeParcelas: 3, valorOriginal: 300 }} />);
    await userEvent.click(screen.getByTitle(/Parcela × 3x/));
    expect(screen.getByText('Valor Parcela')).toBeInTheDocument();
  });

  it('shows "Total:" annotation in parcela mode', async () => {
    render(<TermsWrapper defaultValues={{ quantidadeParcelas: 3, valorOriginal: 300 }} />);
    await userEvent.click(screen.getByTitle(/Parcela × 3x/));
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it('shows "Parcela:" annotation in total mode when qtdParcelas > 1', () => {
    render(<TermsWrapper defaultValues={{ quantidadeParcelas: 3, valorOriginal: 300 }} />);
    // Default is total mode; annotation shows per-parcela amount
    expect(screen.getByText(/Parcela:/)).toBeInTheDocument();
  });

  it('hides toggle and date fields for existing record (id set)', () => {
    render(<TermsWrapper overrides={{ id: 'existing-123' }} />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('hides date fields (emissão, vencimento) when ehCartao=true', () => {
    render(
      <TermsWrapper
        overrides={{
          formaPagamentoBehavior: { ehCartao: true, baixarAutomaticamente: false } as never,
        }}
      />
    );
    expect(screen.queryByText('Data Emissão')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Vencimento')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
