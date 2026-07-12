import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { ComboBox } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { formatCurrencyBRL } from '../../shared/currency';
import { QuickAddContaBancariaModal } from '../cadastros/quick-add/QuickAddContaBancariaModal';
import { QuickAddFormaPagamentoModal } from '../cadastros/quick-add/QuickAddFormaPagamentoModal';
import type { FinanceiroLiquidacaoFormValues, MeioPagamento, SelectOption } from './module-config';

type Props = {
  open: boolean;
  descricao: string;
  valorLiquido: number;
  valorPago?: number | null;
  formaPagamentoId?: string | null;
  ehRecorrente: boolean;
  contaBancariaOptions: SelectOption[];
  formaPagamentoOptions: SelectOption[];
  defaultContaBancariaId?: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirmar: (values: FinanceiroLiquidacaoFormValues) => void;
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

type Step = 'form' | 'opcoes';

export function LiquidarModal({
  open,
  descricao,
  valorLiquido,
  valorPago,
  formaPagamentoId,
  ehRecorrente,
  contaBancariaOptions,
  formaPagamentoOptions,
  defaultContaBancariaId,
  loading,
  error,
  onClose,
  onConfirmar
}: Props) {
  const valorRestante = valorPago != null ? valorLiquido - valorPago : valorLiquido;

  const [step, setStep] = useState<Step>('form');
  const [data, setData] = useState(todayIso());
  const [paymentRows, setPaymentRows] = useState<MeioPagamento[]>([
    { contaBancariaId: defaultContaBancariaId ?? '', formaPagamentoId: formaPagamentoId ?? '', valor: valorRestante }
  ]);
  const [extraContasBancarias, setExtraContasBancarias] = useState<SelectOption[]>([]);
  const [extraFormasPagamento, setExtraFormasPagamento] = useState<SelectOption[]>([]);
  // Tracks which row a QuickAdd modal targets
  const [addContaBancariaRowIdx, setAddContaBancariaRowIdx] = useState<number | null>(null);
  const [addFormaPagamentoRowIdx, setAddFormaPagamentoRowIdx] = useState<number | null>(null);

  // opções step 2
  const [atualizarValorConta, setAtualizarValorConta] = useState(true);
  const [atualizarRecorrencia, setAtualizarRecorrencia] = useState(false);
  const [cancelarValorRestante, setCancelarValorRestante] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('form');
      setData(todayIso());
      setPaymentRows([
        { contaBancariaId: defaultContaBancariaId ?? '', formaPagamentoId: formaPagamentoId ?? '', valor: valorRestante }
      ]);
      setAtualizarValorConta(true);
      setAtualizarRecorrencia(false);
      setCancelarValorRestante(false);
      setExtraContasBancarias([]);
      setExtraFormasPagamento([]);
    }
  }, [open, valorRestante, defaultContaBancariaId, formaPagamentoId]);

  const allContasBancarias = [...extraContasBancarias, ...contaBancariaOptions.filter(o => !extraContasBancarias.some(e => e.value === o.value))];
  const allFormasPagamento = [...extraFormasPagamento, ...formaPagamentoOptions.filter(o => !extraFormasPagamento.some(e => e.value === o.value))];

  if (!open) return null;

  const valorLiq = paymentRows.reduce((sum, r) => sum + r.valor, 0);
  const primaryRow = paymentRows[0] ?? { contaBancariaId: '', formaPagamentoId: '', valor: 0 };
  const valorFinal = (valorPago ?? 0) + valorLiq;
  const diferenca = valorLiq - valorRestante;
  const isIgual = Math.abs(diferenca) < 0.01;
  const isMaior = diferenca > 0.01;
  const isMenor = diferenca < -0.01;
  const multiRow = paymentRows.length > 1;

  function updateRow(idx: number, patch: Partial<MeioPagamento>) {
    setPaymentRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  function addRow() {
    setPaymentRows((prev) => [
      ...prev,
      { contaBancariaId: defaultContaBancariaId ?? '', formaPagamentoId: formaPagamentoId ?? '', valor: 0 }
    ]);
  }

  function removeRow(idx: number) {
    setPaymentRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function avancarOuConfirmar() {
    if (!primaryRow.contaBancariaId || valorLiq <= 0) return;
    if (isIgual) {
      submitLiquidacao();
    } else {
      setStep('opcoes');
    }
  }

  function submitLiquidacao() {
    onConfirmar({
      valorLiquidacao: valorLiq,
      dataLiquidacao: data,
      contaBancariaId: primaryRow.contaBancariaId,
      formaPagamentoId: primaryRow.formaPagamentoId,
      atualizarValorConta: isMaior ? atualizarValorConta : false,
      atualizarRecorrencia,
      cancelarValorRestante: isMenor ? cancelarValorRestante : false,
      meiosPagamento: multiRow ? paymentRows : undefined
    });
  }

  const fieldLabel = 'text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block';
  const fieldClass =
    'w-full rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/60';

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Liquidar lançamento</p>
            <h3 className="font-headline text-lg font-bold text-on-surface leading-tight">{descricao}</h3>
            {valorPago != null && (
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Já pago: <strong className="text-primary">{formatCurrencyBRL(valorPago)}</strong>
                {' · '}Restante: <strong>{formatCurrencyBRL(valorRestante)}</strong>
              </p>
            )}
          </div>
        </div>

        {step === 'form' ? (
          <div className="space-y-4">
            {/* Date — single for all rows */}
            <div>
              <label className={fieldLabel}>Data do pagamento</label>
              <DateInput
                mode="date"
                value={data}
                onChange={(v) => { if (v && v <= todayIso()) setData(v); }}
              />
            </div>

            {/* Payment rows */}
            {paymentRows.map((row, idx) => (
              <div key={idx} className={multiRow ? 'rounded-2xl border border-white/8 bg-surface-container p-4 space-y-3' : 'space-y-4'}>
                {multiRow && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Meio {idx + 1}
                    </span>
                    {paymentRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-on-surface-variant hover:text-error transition-colors"
                        aria-label={`Remover meio ${idx + 1}`}
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                )}

                {!multiRow && (
                  <div>
                    <label className={fieldLabel}>Valor pago</label>
                    <CurrencyInput
                      value={row.valor}
                      onChange={(v) => updateRow(idx, { valor: v ?? 0 })}
                      className={fieldClass}
                    />
                    {!isIgual && (
                      <p className={`mt-1 text-xs font-medium ${isMaior ? 'text-warning' : 'text-on-surface-variant'}`}>
                        {isMaior
                          ? `${formatCurrencyBRL(diferenca)} acima do valor original`
                          : `${formatCurrencyBRL(Math.abs(diferenca))} abaixo do valor original`}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className={fieldLabel}>Conta bancária</label>
                  <ComboBox
                    value={row.contaBancariaId}
                    placeholder="Selecionar conta..."
                    options={allContasBancarias.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={(v) => updateRow(idx, { contaBancariaId: v })}
                    onAddNew={() => setAddContaBancariaRowIdx(idx)}
                    addNewLabel="Nova conta bancária"
                  />
                </div>

                <div>
                  <label className={fieldLabel}>Forma de pagamento</label>
                  <ComboBox
                    value={row.formaPagamentoId}
                    placeholder="Selecionar..."
                    options={allFormasPagamento.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={(v) => updateRow(idx, { formaPagamentoId: v })}
                    onAddNew={() => setAddFormaPagamentoRowIdx(idx)}
                    addNewLabel="Nova forma de pagamento"
                  />
                </div>

                {multiRow && (
                  <div>
                    <label className={fieldLabel}>Valor</label>
                    <CurrencyInput
                      value={row.valor}
                      onChange={(v) => updateRow(idx, { valor: v ?? 0 })}
                      className={fieldClass}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Multi-row total + diff */}
            {multiRow && (
              <div className="space-y-1 px-1">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Total</span>
                  <span className="font-bold text-on-surface">{formatCurrencyBRL(valorLiq)}</span>
                </div>
                {!isIgual && (
                  <p className={`text-xs font-medium ${isMaior ? 'text-warning' : 'text-on-surface-variant'}`}>
                    {isMaior
                      ? `${formatCurrencyBRL(diferenca)} acima do valor original`
                      : `${formatCurrencyBRL(Math.abs(diferenca))} abaixo do valor original`}
                  </p>
                )}
              </div>
            )}

            {/* Add row button */}
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Dividir em mais meios de pagamento
            </button>

            {error ? <p className="text-sm font-medium text-error">{error}</p> : null}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button
                type="button"
                variant="primary"
                disabled={!primaryRow.contaBancariaId || valorLiq <= 0 || loading}
                loading={loading && isIgual}
                onClick={avancarOuConfirmar}
              >
                {isIgual ? 'Confirmar' : 'Próximo'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Resumo */}
            <div className="rounded-2xl bg-surface-container p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Valor pago agora</span>
                <span className="font-bold text-on-surface">{formatCurrencyBRL(valorLiq)}</span>
              </div>
              {valorPago != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Total já liquidado</span>
                  <span className="font-bold text-primary">{formatCurrencyBRL(valorFinal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Valor original</span>
                <span className="font-bold text-on-surface">{formatCurrencyBRL(valorLiquido)}</span>
              </div>
            </div>

            {/* Opções para valor MAIOR */}
            {isMaior && (
              <div className="space-y-3">
                <p className={fieldLabel}>O valor pago é maior que o original</p>
                <ToggleOption
                  checked={atualizarValorConta}
                  onChange={setAtualizarValorConta}
                  label="Atualizar valor da conta"
                  description={`Conta passa a valer ${formatCurrencyBRL(valorLiq)}`}
                />
                {ehRecorrente && atualizarValorConta && (
                  <ToggleOption
                    checked={atualizarRecorrencia}
                    onChange={setAtualizarRecorrencia}
                    label="Atualizar valor da recorrência"
                    description="Próximas parcelas geradas usarão o novo valor"
                  />
                )}
              </div>
            )}

            {/* Opções para valor MENOR */}
            {isMenor && (
              <div className="space-y-3">
                <p className={fieldLabel}>O que fazer com o restante?</p>
                <div className="space-y-2">
                  <RadioOption
                    checked={!cancelarValorRestante}
                    onChange={() => setCancelarValorRestante(false)}
                    label="Manter em aberto"
                    description={`Conta fica com ${formatCurrencyBRL(valorLiquido - valorFinal)} em aberto (status Parcial)`}
                  />
                  <RadioOption
                    checked={cancelarValorRestante}
                    onChange={() => setCancelarValorRestante(true)}
                    label="Cancelar o restante"
                    description={`Conta é dada como quitada por ${formatCurrencyBRL(valorFinal)}`}
                  />
                </div>
                {ehRecorrente && cancelarValorRestante && (
                  <ToggleOption
                    checked={atualizarRecorrencia}
                    onChange={setAtualizarRecorrencia}
                    label="Atualizar valor da recorrência"
                    description="Próximas parcelas geradas usarão o valor pago"
                  />
                )}
              </div>
            )}

            {error ? <p className="text-sm font-medium text-error">{error}</p> : null}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setStep('form')}>Voltar</Button>
              <Button
                type="button"
                variant="primary"
                loading={loading}
                disabled={loading}
                onClick={submitLiquidacao}
              >
                Confirmar liquidação
              </Button>
            </div>
          </div>
        )}
      </div>
      <QuickAddModalsForLiquidar
        addContaBancariaOpen={addContaBancariaRowIdx !== null}
        addFormaPagamentoOpen={addFormaPagamentoRowIdx !== null}
        onContaBancariaClose={() => setAddContaBancariaRowIdx(null)}
        onFormaPagamentoClose={() => setAddFormaPagamentoRowIdx(null)}
        onContaBancariaSuccess={(id, label) => {
          setExtraContasBancarias((prev) => [{ value: id, label }, ...prev.filter((o) => o.value !== id)]);
          if (addContaBancariaRowIdx !== null) updateRow(addContaBancariaRowIdx, { contaBancariaId: id });
          setAddContaBancariaRowIdx(null);
        }}
        onFormaPagamentoSuccess={(id, label) => {
          setExtraFormasPagamento((prev) => [{ value: id, label }, ...prev.filter((o) => o.value !== id)]);
          if (addFormaPagamentoRowIdx !== null) updateRow(addFormaPagamentoRowIdx, { formaPagamentoId: id });
          setAddFormaPagamentoRowIdx(null);
        }}
      />
    </div>
  );
}

function QuickAddModalsForLiquidar({
  addContaBancariaOpen,
  addFormaPagamentoOpen,
  onContaBancariaClose,
  onFormaPagamentoClose,
  onContaBancariaSuccess,
  onFormaPagamentoSuccess,
}: {
  addContaBancariaOpen: boolean;
  addFormaPagamentoOpen: boolean;
  onContaBancariaClose: () => void;
  onFormaPagamentoClose: () => void;
  onContaBancariaSuccess: (id: string, label: string) => void;
  onFormaPagamentoSuccess: (id: string, label: string) => void;
}) {
  return (
    <>
      <QuickAddContaBancariaModal
        open={addContaBancariaOpen}
        onClose={onContaBancariaClose}
        onSuccess={onContaBancariaSuccess}
      />
      <QuickAddFormaPagamentoModal
        open={addFormaPagamentoOpen}
        onClose={onFormaPagamentoClose}
        onSuccess={onFormaPagamentoSuccess}
      />
    </>
  );
}

function ToggleOption({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        checked
          ? 'border-primary/40 bg-primary/8'
          : 'border-white/10 bg-surface-container hover:border-white/20'
      }`}
    >
      <span
        className={`material-symbols-outlined text-xl mt-0.5 ${checked ? 'text-primary' : 'text-on-surface-variant'}`}
        style={{ fontVariationSettings: checked ? "'FILL' 1" : "'FILL' 0" }}
      >
        {checked ? 'toggle_on' : 'toggle_off'}
      </span>
      <div>
        <p className={`text-sm font-bold ${checked ? 'text-primary' : 'text-on-surface'}`}>{label}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </button>
  );
}

function RadioOption({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        checked
          ? 'border-primary/40 bg-primary/8'
          : 'border-white/10 bg-surface-container hover:border-white/20'
      }`}
    >
      <span
        className={`material-symbols-outlined text-xl mt-0.5 ${checked ? 'text-primary' : 'text-on-surface-variant'}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {checked ? 'radio_button_checked' : 'radio_button_unchecked'}
      </span>
      <div>
        <p className={`text-sm font-bold ${checked ? 'text-primary' : 'text-on-surface'}`}>{label}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </button>
  );
}
