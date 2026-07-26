import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ComboBox } from '../../../components/forms/ComboBox';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import { financeiroApi } from '../../../services/http/financeiro-api';
import { contasReceberModuleConfig } from '../module-config';
import type { RateioOption, SelectOption, FormaPagamentoOption } from '../module-config';
import type { CriarReembolsoResponse } from '../../../types/financeiro';
import { getApiErrorMessage } from '../../../services/http/api-error';

type PagadorEntry = { id: string; nome: string };

type ReembolsoModalProps = {
  open: boolean;
  contaId: string;
  descricao: string;
  valorLiquido: number;
  quantidadeParcelas: number;
  dataVencimento: string;
  pessoaOptions: SelectOption[];
  formaPagamentoOptions: FormaPagamentoOption[];
  onClose: () => void;
  onSuccess: (result: CriarReembolsoResponse) => void;
};

export function ReembolsoModal({
  open,
  contaId,
  descricao,
  valorLiquido,
  quantidadeParcelas,
  dataVencimento,
  pessoaOptions,
  formaPagamentoOptions,
  onClose,
  onSuccess
}: ReembolsoModalProps) {
  const [valorTotal, setValorTotal] = useState('');
  const [parcelarIgual, setParcelarIgual] = useState(false);
  const [pagadores, setPagadores] = useState<PagadorEntry[]>([]);
  const [addPagadorId, setAddPagadorId] = useState('');
  const [formaPagamentoId, setFormaPagamentoId] = useState('');
  const [dataVenc, setDataVenc] = useState('');
  const [descricaoReembolso, setDescricaoReembolso] = useState('');
  const [contaGerencialId, setContaGerencialId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [rateioOptions, setRateioOptions] = useState<RateioOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valorInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    setValorTotal(String(valorLiquido));
    setParcelarIgual(false);
    setPagadores([]);
    setAddPagadorId('');
    setFormaPagamentoId('');
    setDataVenc(dataVencimento);
    setDescricaoReembolso(`Reembolso: ${descricao}`);
    setContaGerencialId('');
    setObservacao('');
    setError(null);
    setTimeout(() => valorInputRef.current?.select(), 50);
    void contasReceberModuleConfig.loadRateioOptions().then(setRateioOptions);
  }, [open, valorLiquido, descricao, dataVencimento]);

  if (!open) return null;

  const pessoasDisponiveis = pessoaOptions.filter(
    (p) => !pagadores.some((pg) => pg.id === p.value)
  );

  function addPagador() {
    if (!addPagadorId) return;
    const opt = pessoaOptions.find((p) => p.value === addPagadorId);
    if (!opt) return;
    setPagadores((prev) => [...prev, { id: opt.value, nome: String(opt.label) }]);
    setAddPagadorId('');
  }

  function removePagador(id: string) {
    setPagadores((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const valor = parseFloat(valorTotal.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) { setError('Informe um valor válido.'); return; }
    if (pagadores.length === 0) { setError('Adicione ao menos um pagador.'); return; }
    if (!formaPagamentoId) { setError('Selecione a forma de pagamento.'); return; }
    if (!dataVenc) { setError('Informe a data de vencimento.'); return; }
    if (!contaGerencialId) { setError('Selecione a conta gerencial de receita.'); return; }

    setSubmitting(true);
    try {
      const result = await financeiroApi.reembolsos.criar({
        contaOrigemId: contaId,
        parcelarIgual,
        valorTotal: valor,
        pagadoresIds: pagadores.map((p) => p.id),
        formaPagamentoId,
        dataVencimento: dataVenc,
        descricao: descricaoReembolso,
        observacao: observacao.trim() || null,
        rateios: [{ contaGerencialId, valor }]
      });
      onSuccess(result);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Erro ao gerar reembolso.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Gerar reembolso"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-surface-container-low shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/8 bg-surface-container-low px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reembolso</p>
              <h2 className="font-headline text-base font-bold text-on-surface leading-tight">Gerar Reembolso</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-white/8"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Origin banner */}
        <div className="mx-5 mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Conta de origem</p>
          <p className="text-sm font-semibold text-on-surface leading-snug">{descricao}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {formatCurrencyBRL(valorLiquido)} · {quantidadeParcelas} parcela{quantidadeParcelas !== 1 ? 's' : ''} · venc. {formatDateBR(dataVencimento)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-5 pb-5 pt-4 space-y-4">

          {/* Valor total */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Valor Total do Reembolso</label>
            <input
              ref={valorInputRef}
              type="number"
              min="0.01"
              step="0.01"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-surface-container px-3 py-2.5 text-sm font-mono text-on-surface outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              placeholder="0,00"
            />
          </div>

          {/* Parcelar igual — only when original has multiple parcelas */}
          {quantidadeParcelas > 1 && (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/8 bg-surface-container px-4 py-3">
              <input
                type="checkbox"
                checked={parcelarIgual}
                onChange={(e) => setParcelarIgual(e.target.checked)}
                className="accent-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold text-on-surface">Parcelar igual à origem</p>
                <p className="text-xs text-on-surface-variant">
                  Divide o reembolso em {quantidadeParcelas} parcelas (uma por vencimento original)
                </p>
              </div>
            </label>
          )}

          {/* Pagadores */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Pagadores <span className="text-on-surface-variant/60 normal-case font-normal">(quem vai reembolsar)</span>
            </label>

            {pagadores.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pagadores.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {p.nome}
                    <button
                      type="button"
                      aria-label={`Remover ${p.nome}`}
                      onClick={() => removePagador(p.id)}
                      className="text-primary/60 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <ComboBox
                  aria-label="Adicionar pagador"
                  value={addPagadorId}
                  options={pessoasDisponiveis.map((p) => ({ label: String(p.label), value: p.value }))}
                  placeholder="Selecionar pagador..."
                  onChange={setAddPagadorId}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 rounded-xl px-3"
                onClick={addPagador}
                disabled={!addPagadorId}
              >
                <span className="material-symbols-outlined text-base">add</span>
              </Button>
            </div>

            {pagadores.length === 0 && (
              <p className="text-xs text-on-surface-variant/70 italic">Selecione e clique em + para adicionar pagadores.</p>
            )}
            {pagadores.length > 1 && (
              <p className="text-xs text-on-surface-variant">
                Valor dividido igualmente: {formatCurrencyBRL((parseFloat(valorTotal) || 0) / pagadores.length)} por pagador
              </p>
            )}
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Forma de Pagamento</label>
            <ComboBox
              aria-label="Forma de pagamento"
              value={formaPagamentoId}
              options={formaPagamentoOptions.map((f) => ({ label: f.label, value: f.value }))}
              placeholder="Selecionar..."
              onChange={setFormaPagamentoId}
            />
          </div>

          {/* Data de vencimento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Data de Vencimento</label>
            <input
              type="date"
              value={dataVenc}
              onChange={(e) => setDataVenc(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Descrição</label>
            <input
              type="text"
              value={descricaoReembolso}
              onChange={(e) => setDescricaoReembolso(e.target.value)}
              maxLength={200}
              className="w-full rounded-xl border border-white/12 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Conta gerencial */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Conta Gerencial (Receita)</label>
            <ComboBox
              aria-label="Conta gerencial"
              value={contaGerencialId}
              options={rateioOptions}
              placeholder="Selecionar..."
              onChange={setContaGerencialId}
            />
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Observação <span className="text-on-surface-variant/60 normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-white/12 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 px-3 py-2.5 text-error">
              <span className="material-symbols-outlined text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1 rounded-2xl" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1 rounded-2xl" loading={submitting} disabled={submitting}>
              Gerar Reembolso
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
