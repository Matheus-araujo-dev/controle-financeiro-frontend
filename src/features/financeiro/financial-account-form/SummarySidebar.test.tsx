import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SummarySidebar } from './SummarySidebar';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

function makeMockForm(overrides: Partial<Record<string, unknown>> = {}): FinancialAccountFormApi {
  return {
    id: undefined,
    isSubmitting: false,
    actionLoading: false,
    isValid: true,
    valorLiquido: 1000,
    watchedValues: {
      valorOriginal: 1000,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      formaPagamentoId: 'fp1',
      dataVencimento: '2026-08-01',
      dataLiquidacao: '',
    } as never,
    detailStatus: undefined,
    detailFaturaStatus: undefined,
    faturaLocked: false,
    errorMessage: undefined,
    onCancel: vi.fn(),
    cancelar: vi.fn().mockResolvedValue(undefined),
    estornar: vi.fn().mockResolvedValue(undefined),
    origemCompraPlanejadaId: undefined,
    exibeRecorrencia: false,
    grupoParcelamentoId: undefined,
    numeroParcela: undefined,
    totalRateios: 1000,
    pendingValues: null,
    onConfirmApenas: vi.fn().mockResolvedValue(undefined),
    onConfirmAlterarFuturas: vi.fn().mockResolvedValue(undefined),
    clearPendingScope: vi.fn(),
    contaVinculada: null,
    pendingPropagation: null,
    propagarParaVinculada: vi.fn().mockResolvedValue(undefined),
    dismissPropagation: vi.fn(),
    control: {} as never,
    handleSubmit: vi.fn() as never,
    errors: {} as never,
    fields: [],
    append: vi.fn(),
    remove: vi.fn(),
    formaPagamentoBehavior: { ehCartao: false, baixarAutomaticamente: false } as never,
    canEdit: true,
    canAlterarFuturas: false,
    recurringStartDatePreview: null,
    automaticRecurringStartPreview: null,
    loading: false,
    cardInvoicePreview: null,
    pessoaOptions: [],
    responsavelOptions: [],
    formaPagamentoOptions: [],
    contaBancariaOptions: [],
    cartaoOptions: [],
    rateioOptions: [],
    setValue: vi.fn(),
    pendingDuplicateValues: null,
    duplicateItems: [],
    createDespiteDuplicate: vi.fn(),
    cancelDuplicateCheck: vi.fn(),
    pendingFaturaIndisponivelValues: null,
    faturaIndisponivelMessage: null,
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
    ...overrides,
  } as unknown as FinancialAccountFormApi;
}

function renderSidebar(overrides: Partial<Record<string, unknown>> = {}) {
  return render(
    <MemoryRouter>
      <SummarySidebar form={makeMockForm(overrides)} />
    </MemoryRouter>
  );
}

describe('SummarySidebar', () => {
  it('renders "Confirmar" for new form (no id)', () => {
    renderSidebar();
    // Mobile footer button + desktop sidebar button
    const buttons = screen.getAllByRole('button', { name: /Confirmar/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Atualizar" text for existing record', () => {
    renderSidebar({ id: 'existing-id' });
    const labels = screen.getAllByText(/Atualizar/i);
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows conta vinculada section when contaVinculada is Receber', () => {
    renderSidebar({
      contaVinculada: {
        id: 'cv1',
        descricao: 'Reembolso Viagem',
        tipo: 'Receber',
        valorLiquido: 500,
        dataVencimento: '2026-08-15',
      },
    });
    expect(screen.getByText('Reembolso Viagem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver conta vinculada/i })).toBeInTheDocument();
    expect(screen.getByText(/A receber/)).toBeInTheDocument();
  });

  it('shows conta vinculada section when contaVinculada is Pagar', () => {
    renderSidebar({
      contaVinculada: {
        id: 'cv2',
        descricao: 'Despesa Vinculada',
        tipo: 'Pagar',
        valorLiquido: 200,
        dataVencimento: '2026-09-01',
      },
    });
    expect(screen.getByText('Despesa Vinculada')).toBeInTheDocument();
    expect(screen.getByText(/A pagar/)).toBeInTheDocument();
  });

  it('shows faturaLocked warning with "liquidada" when PAGA', () => {
    renderSidebar({ id: 'c1', faturaLocked: true, detailFaturaStatus: 'PAGA' });
    expect(screen.getByText(/liquidada/)).toBeInTheDocument();
  });

  it('shows faturaLocked warning with "fechada" for non-PAGA status', () => {
    renderSidebar({ id: 'c1', faturaLocked: true, detailFaturaStatus: 'FECHADA' });
    expect(screen.getByText(/fechada/)).toBeInTheDocument();
  });

  it('shows "Cancelar Título" button for PENDENTE status', () => {
    renderSidebar({ id: 'c1', detailStatus: 'PENDENTE', faturaLocked: false });
    expect(screen.getByRole('button', { name: /Cancelar Título/i })).toBeInTheDocument();
  });

  it('shows "Cancelar Título" button for EM_FATURA status', () => {
    renderSidebar({ id: 'c1', detailStatus: 'EM_FATURA', faturaLocked: false });
    expect(screen.getByRole('button', { name: /Cancelar Título/i })).toBeInTheDocument();
  });

  it('opens ConfirmDialog when clicking "Cancelar Título" (simple case)', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    expect(screen.getByText('Confirmar Cancelamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sim, cancelar/i })).toBeInTheDocument();
  });

  it('calls cancelar when confirming from ConfirmDialog', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, cancelar/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith(undefined));
  });

  it('dismisses ConfirmDialog on "Voltar"', async () => {
    renderSidebar({ id: 'c1', detailStatus: 'PENDENTE', faturaLocked: false });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    expect(screen.getByText('Confirmar Cancelamento')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Voltar/i }));
    expect(screen.queryByText('Confirmar Cancelamento')).not.toBeInTheDocument();
  });

  it('opens RecorrenciaCancelDialog for recurring items', async () => {
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      exibeRecorrencia: true,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    expect(screen.getByText(/Cancelar lancamento recorrente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nao, manter recorrencia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sim, pausar recorrencia/i })).toBeInTheDocument();
  });

  it('calls cancelar with pausarRecorrenciaRelacionada=false from RecorrenciaCancelDialog', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      exibeRecorrencia: true,
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Nao, manter recorrencia/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith({ pausarRecorrenciaRelacionada: false }));
  });

  it('calls cancelar with pausarRecorrenciaRelacionada=true from RecorrenciaCancelDialog', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      exibeRecorrencia: true,
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, pausar recorrencia/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith({ pausarRecorrenciaRelacionada: true }));
  });

  it('opens PlannedPurchaseCancelDialog for planned purchase origin', async () => {
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      origemCompraPlanejadaId: 'pp-1',
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    expect(screen.getByText(/Cancelar titulo originado de compra planejada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nao, manter planejamento/i })).toBeInTheDocument();
  });

  it('calls cancelar with cancelarPlanejamentoRelacionado=false from PlannedPurchaseCancelDialog', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      origemCompraPlanejadaId: 'pp-1',
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Nao, manter planejamento/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith({ cancelarPlanejamentoRelacionado: false }));
  });

  it('calls cancelar with cancelarPlanejamentoRelacionado=true from PlannedPurchaseCancelDialog', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      origemCompraPlanejadaId: 'pp-1',
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, cancelar planejamento/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith({ cancelarPlanejamentoRelacionado: true }));
  });

  it('opens ParcelasCancelDialog for non-origin parcela', async () => {
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      grupoParcelamentoId: 'grp-1',
      numeroParcela: 3,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    expect(screen.getByText(/Cancelar parcela/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nao, apenas esta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sim, cancelar futuras/i })).toBeInTheDocument();
  });

  it('calls cancelar with cancelarParcelasFuturas=false from ParcelasCancelDialog', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      grupoParcelamentoId: 'grp-1',
      numeroParcela: 2,
      cancelar,
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Nao, apenas esta/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith({ cancelarParcelasFuturas: false }));
  });

  it('opens ContaVinculadaCancelDialog when contaVinculada is set and cancel clicked', async () => {
    // When contaVinculada is set, clicking "Cancelar Título" first shows ConfirmDialog,
    // then confirming calls iniciarCancelamento() which opens ContaVinculadaCancelDialog
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      contaVinculada: {
        id: 'cv1',
        descricao: 'Reembolso',
        tipo: 'Receber',
        valorLiquido: 500,
        dataVencimento: '2026-08-15',
      },
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, cancelar/i }));
    expect(screen.getByText(/Conta vinculada \(reembolso\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Não, só esta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sim, cancelar ambas/i })).toBeInTheDocument();
  });

  it('calls cancelar without cancelarContaVinculada from ContaVinculadaCancelDialog "só esta"', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      cancelar,
      contaVinculada: { id: 'cv1', descricao: 'Reembolso', tipo: 'Receber', valorLiquido: 500, dataVencimento: '2026-08-15' },
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, cancelar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Não, só esta/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalled());
  });

  it('calls cancelar with cancelarContaVinculada=true from "cancelar ambas"', async () => {
    const cancelar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      id: 'c1',
      detailStatus: 'PENDENTE',
      faturaLocked: false,
      cancelar,
      contaVinculada: { id: 'cv1', descricao: 'Reembolso', tipo: 'Receber', valorLiquido: 500, dataVencimento: '2026-08-15' },
    });
    await userEvent.click(screen.getByRole('button', { name: /Cancelar Título/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, cancelar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, cancelar ambas/i }));
    await waitFor(() => expect(cancelar).toHaveBeenCalledWith(expect.objectContaining({ cancelarContaVinculada: true })));
  });

  it('shows "Estornar Pagamento" button for LIQUIDADA status', () => {
    renderSidebar({ id: 'c1', detailStatus: 'LIQUIDADA', faturaLocked: false });
    expect(screen.getByRole('button', { name: /Estornar Pagamento/i })).toBeInTheDocument();
  });

  it('opens estorno ConfirmDialog when "Estornar Pagamento" is clicked', async () => {
    renderSidebar({ id: 'c1', detailStatus: 'LIQUIDADA', faturaLocked: false });
    await userEvent.click(screen.getByRole('button', { name: /Estornar Pagamento/i }));
    expect(screen.getByText(/Estornar Liquidacao/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sim, estornar/i })).toBeInTheDocument();
  });

  it('calls estornar when confirming estorno', async () => {
    const estornar = vi.fn().mockResolvedValue(undefined);
    renderSidebar({ id: 'c1', detailStatus: 'LIQUIDADA', faturaLocked: false, estornar });
    await userEvent.click(screen.getByRole('button', { name: /Estornar Pagamento/i }));
    await userEvent.click(screen.getByRole('button', { name: /Sim, estornar/i }));
    await waitFor(() => expect(estornar).toHaveBeenCalled());
  });

  it('shows ContaVinculadaPropagateDialog when pendingPropagation is set', () => {
    renderSidebar({
      pendingPropagation: {
        diff: [{ key: 'descricao', label: 'Descrição', from: 'Descrição Antiga', to: 'Descrição Nova' }],
        applyValues: {} as never,
      },
    });
    expect(screen.getByText(/Propagar alterações à conta vinculada/i)).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Descrição Antiga')).toBeInTheDocument();
    expect(screen.getByText('Descrição Nova')).toBeInTheDocument();
  });

  it('calls propagarParaVinculada when "Sim, propagar" is clicked', async () => {
    const propagarParaVinculada = vi.fn().mockResolvedValue(undefined);
    renderSidebar({
      pendingPropagation: {
        diff: [{ key: 'descricao', label: 'Descrição', from: 'Old', to: 'New' }],
        applyValues: {} as never,
      },
      propagarParaVinculada,
    });
    await userEvent.click(screen.getByRole('button', { name: /Sim, propagar/i }));
    await waitFor(() => expect(propagarParaVinculada).toHaveBeenCalled());
  });

  it('calls dismissPropagation when "Não propagar" is clicked', async () => {
    const dismissPropagation = vi.fn();
    renderSidebar({
      pendingPropagation: {
        diff: [{ key: 'descricao', label: 'Descrição', from: 'Old', to: 'New' }],
        applyValues: {} as never,
      },
      dismissPropagation,
    });
    await userEvent.click(screen.getByRole('button', { name: /Não propagar/i }));
    expect(dismissPropagation).toHaveBeenCalled();
  });

  it('shows RecorrenciaEscopoDialog when pendingValues is set', () => {
    renderSidebar({ pendingValues: { descricao: 'New' } as never });
    expect(screen.getByText(/Atualizar lançamento recorrente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apenas esta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Esta e as futuras/i })).toBeInTheDocument();
  });

  it('calls onConfirmApenas when "Apenas esta" is clicked in RecorrenciaEscopoDialog', async () => {
    const onConfirmApenas = vi.fn().mockResolvedValue(undefined);
    renderSidebar({ pendingValues: { descricao: 'New' } as never, onConfirmApenas });
    await userEvent.click(screen.getByRole('button', { name: /Apenas esta/i }));
    await waitFor(() => expect(onConfirmApenas).toHaveBeenCalled());
  });

  it('calls onConfirmAlterarFuturas when "Esta e as futuras" is clicked', async () => {
    const onConfirmAlterarFuturas = vi.fn().mockResolvedValue(undefined);
    renderSidebar({ pendingValues: { descricao: 'New' } as never, onConfirmAlterarFuturas });
    await userEvent.click(screen.getByRole('button', { name: /Esta e as futuras/i }));
    await waitFor(() => expect(onConfirmAlterarFuturas).toHaveBeenCalled());
  });

  it('does not show Cancelar Título for LIQUIDADA status', () => {
    renderSidebar({ id: 'c1', detailStatus: 'LIQUIDADA', faturaLocked: false });
    expect(screen.queryByRole('button', { name: /Cancelar Título/i })).not.toBeInTheDocument();
  });

  it('does not show action buttons when faturaLocked=true', () => {
    renderSidebar({ id: 'c1', detailStatus: 'PENDENTE', faturaLocked: true });
    expect(screen.queryByRole('button', { name: /Cancelar Título/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Estornar/i })).not.toBeInTheDocument();
  });

  it('shows error message in the mobile footer', () => {
    renderSidebar({ errorMessage: 'Falha ao salvar' });
    // Error appears in both mobile footer and FormActionPanel
    expect(screen.getAllByText('Falha ao salvar').length).toBeGreaterThanOrEqual(1);
  });
});
