import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { PageState } from '../../components/states/PageState';
import { ListPageShell } from '../../components/layout/ListPageShell';
import { SummaryCard } from '../../components/layout/SummaryCard';
import { ComboBox } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { investimentosApi } from '../../services/http/investimentos-api';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { formatCurrencyBRL } from '../../shared/currency';
import {
  TipoInvestimentoLabels,
  LiquidezInvestimentoLabels,
  type InvestimentoResumo,
  type TipoInvestimento,
  type LiquidezInvestimento
} from '../../types/investimentos';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatPercent(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

const tipoOptions = (Object.entries(TipoInvestimentoLabels) as [string, string][]).map(([v, l]) => ({ value: v, label: l }));
const liquidezOptions = (Object.entries(LiquidezInvestimentoLabels) as [string, string][]).map(([v, l]) => ({ value: v, label: l }));

const tipoIcones: Record<TipoInvestimento, string> = {
  1: 'account_balance',
  2: 'trending_up',
  3: 'apartment',
  4: 'currency_bitcoin',
  5: 'attach_money'
};

// ── Modal criar/editar ────────────────────────────────────────────────────────

type FormData = {
  nome: string;
  emissor: string;
  tipo: string;
  liquidez: string;
  valorInvestido: number | null;
  dataAplicacao: string;
  dataVencimento: string;
  taxaAnual: number | null;
  contaBancariaVinculadaId: string;
};

const emptyForm = (): FormData => ({
  nome: '',
  emissor: '',
  tipo: '1',
  liquidez: '1',
  valorInvestido: null,
  dataAplicacao: new Date().toISOString().slice(0, 10),
  dataVencimento: '',
  taxaAnual: null,
  contaBancariaVinculadaId: ''
});

function invToForm(inv: InvestimentoResumo): FormData {
  return {
    nome: inv.nome,
    emissor: inv.emissor ?? '',
    tipo: String(inv.tipo),
    liquidez: String(inv.liquidez),
    valorInvestido: inv.valorInvestido,
    dataAplicacao: inv.dataAplicacao.slice(0, 10),
    dataVencimento: inv.dataVencimento?.slice(0, 10) ?? '',
    taxaAnual: inv.taxaAnual,
    contaBancariaVinculadaId: inv.contaBancariaVinculadaId
  };
}

interface InvModalProps {
  inv?: InvestimentoResumo;
  onClose: () => void;
  onSaved: () => void;
}

function InvModal({ inv, onClose, onSaved }: InvModalProps) {
  const isEditing = !!inv;
  const [form, setForm] = useState<FormData>(inv ? invToForm(inv) : emptyForm());
  const [error, setError] = useState<string>();

  const { data: contasData } = useQuery({
    queryKey: ['contas-bancarias', 'options'],
    queryFn: () => cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 10 * 60_000
  });

  const contasOptions = (contasData?.items ?? []).map((c) => ({ label: c.nome, value: c.id }));

  const criarMutation = useMutation({
    mutationFn: () =>
      investimentosApi.criar({
        nome: form.nome,
        emissor: form.emissor || undefined,
        tipo: Number(form.tipo) as TipoInvestimento,
        liquidez: Number(form.liquidez) as LiquidezInvestimento,
        valorInvestido: form.valorInvestido!,
        dataAplicacao: form.dataAplicacao,
        dataVencimento: form.dataVencimento || undefined,
        taxaAnual: form.taxaAnual ?? undefined,
        contaBancariaVinculadaId: form.contaBancariaVinculadaId
      }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  const atualizarMutation = useMutation({
    mutationFn: () =>
      investimentosApi.atualizar(inv!.id, {
        nome: form.nome,
        emissor: form.emissor || undefined,
        tipo: Number(form.tipo) as TipoInvestimento,
        liquidez: Number(form.liquidez) as LiquidezInvestimento,
        dataVencimento: form.dataVencimento || undefined,
        taxaAnual: form.taxaAnual ?? undefined
      }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  const saving = criarMutation.isPending || atualizarMutation.isPending;
  const canSave = form.nome.trim() && (!isEditing ? (form.valorInvestido ?? 0) > 0 && form.contaBancariaVinculadaId : true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (isEditing) atualizarMutation.mutate(); else criarMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-headline text-xl font-extrabold text-on-surface">
            {isEditing ? 'Editar investimento' : 'Novo investimento'}
          </h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-on-surface-variant hover:bg-white/10">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Tesouro SELIC 2027"
              className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Emissor</label>
            <input
              type="text"
              value={form.emissor}
              onChange={(e) => setForm((f) => ({ ...f, emissor: e.target.value }))}
              placeholder="Ex: Tesouro Nacional"
              className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tipo *</label>
              <ComboBox
                options={tipoOptions}
                value={form.tipo}
                onChange={(v) => setForm((f) => ({ ...f, tipo: v ?? '1' }))}
                placeholder="Tipo"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Liquidez *</label>
              <ComboBox
                options={liquidezOptions}
                value={form.liquidez}
                onChange={(v) => setForm((f) => ({ ...f, liquidez: v ?? '1' }))}
                placeholder="Liquidez"
              />
            </div>
          </div>
          {!isEditing && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Valor investido *</label>
              <CurrencyInput
                value={form.valorInvestido}
                onChange={(v) => setForm((f) => ({ ...f, valorInvestido: v }))}
                placeholder="R$ 0,00"
                className="h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {!isEditing && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Data aplicação *</label>
                <DateInput
                  value={form.dataAplicacao}
                  onChange={(v) => setForm((f) => ({ ...f, dataAplicacao: v ?? '' }))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Vencimento</label>
              <DateInput
                value={form.dataVencimento}
                onChange={(v) => setForm((f) => ({ ...f, dataVencimento: v ?? '' }))}
                className="h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Taxa anual (% a.a.)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.taxaAnual ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, taxaAnual: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Ex: 11.75"
              className="h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
            />
          </div>
          {!isEditing && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Conta vinculada *</label>
              <ComboBox
                options={contasOptions}
                value={form.contaBancariaVinculadaId}
                onChange={(v) => setForm((f) => ({ ...f, contaBancariaVinculadaId: v ?? '' }))}
                placeholder="Selecione a conta"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={!canSave || saving} className="flex-1">
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Investir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal atualizar valor ─────────────────────────────────────────────────────

function AtualizarValorModal({ inv, onClose, onSaved }: { inv: InvestimentoResumo; onClose: () => void; onSaved: () => void }) {
  const [valor, setValor] = useState<number | null>(inv.valorAtual);
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: () => investimentosApi.atualizarValorAtual(inv.id, valor!),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-surface-container-low p-6 shadow-2xl">
        <h2 className="mb-4 font-headline text-lg font-extrabold text-on-surface">Atualizar valor atual</h2>
        <p className="mb-4 text-sm text-on-surface-variant">Aplicado: <span className="font-bold text-primary">{formatCurrencyBRL(inv.valorInvestido)}</span></p>
        {error && <div className="mb-3 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</div>}
        <CurrencyInput
          value={valor}
          onChange={setValor}
          className="mb-4 h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
        />
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="button" variant="primary" disabled={!valor || mutation.isPending} onClick={() => { setError(undefined); mutation.mutate(); }} className="flex-1">
            {mutation.isPending ? 'Salvando...' : 'Atualizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal encerrar ────────────────────────────────────────────────────────────

function EncerrarModal({ inv, onClose, onSaved }: { inv: InvestimentoResumo; onClose: () => void; onSaved: () => void }) {
  const [valor, setValor] = useState<number | null>(inv.valorAtual);
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: () => investimentosApi.encerrar(inv.id, valor!),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-surface-container-low p-6 shadow-2xl">
        <h2 className="mb-1 font-headline text-lg font-extrabold text-on-surface">Encerrar investimento</h2>
        <p className="mb-4 text-xs text-on-surface-variant">Informe o valor de resgate para encerrar definitivamente.</p>
        {error && <div className="mb-3 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</div>}
        <CurrencyInput
          value={valor}
          onChange={setValor}
          className="mb-4 h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
        />
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="button" variant="danger" disabled={valor === null || valor < 0 || mutation.isPending} onClick={() => { setError(undefined); mutation.mutate(); }} className="flex-1">
            {mutation.isPending ? 'Encerrando...' : 'Encerrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Card de investimento ──────────────────────────────────────────────────────

function InvCard({ inv, onEditar, onAtualizarValor, onEncerrar }: {
  inv: InvestimentoResumo;
  onEditar: () => void;
  onAtualizarValor: () => void;
  onEncerrar: () => void;
}) {
  const positivo = inv.rendimento >= 0;
  const icone = tipoIcones[inv.tipo];

  return (
    <div className={`flex flex-col gap-4 rounded-3xl border p-5 transition-all ${inv.encerrado ? 'border-white/5 bg-surface-container opacity-60' : 'border-white/5 bg-surface-container-low hover:border-primary/20'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icone}</span>
            <h3 className="font-headline text-base font-extrabold text-on-surface truncate">{inv.nome}</h3>
          </div>
          {inv.emissor && <p className="mt-0.5 text-xs text-on-surface-variant">{inv.emissor}</p>}
          <p className="mt-1 text-xs text-on-surface-variant">{inv.contaBancariaNome}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{inv.tipoLabel}</span>
          {inv.encerrado && <span className="rounded-full bg-error/15 px-2.5 py-1 text-[10px] font-bold text-error">Encerrado</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Aplicado</p>
          <p className="mt-1 font-headline text-sm font-extrabold text-on-surface">{formatCurrencyBRL(inv.valorInvestido)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Atual</p>
          <p className="mt-1 font-headline text-sm font-extrabold text-primary">{formatCurrencyBRL(inv.valorAtual)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rendimento</p>
          <p className={`mt-1 font-headline text-sm font-extrabold ${positivo ? 'text-primary' : 'text-error'}`}>
            {formatPercent(inv.rendimentoPercent)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">event</span>
          {formatDate(inv.dataAplicacao)}
        </span>
        {inv.dataVencimento && (
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">event_available</span>
            {formatDate(inv.dataVencimento)}
          </span>
        )}
        {inv.taxaAnual && (
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">percent</span>
            {inv.taxaAnual.toFixed(2)}% a.a.
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">water_drop</span>
          {inv.liquidezLabel}
        </span>
      </div>

      {!inv.encerrado && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAtualizarValor}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"
          >
            <span className="material-symbols-outlined text-sm">update</span>
            Atualizar valor
          </button>
          <button
            type="button"
            onClick={onEditar}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:border-primary/20 hover:text-primary"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Editar
          </button>
          <button
            type="button"
            onClick={onEncerrar}
            className="inline-flex items-center gap-1.5 rounded-xl border border-error/20 bg-error/5 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/15"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            Encerrar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Banner de indicadores BCB ─────────────────────────────────────────────────

function IndicadoresBcbBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['investimentos', 'indicadores-bcb'],
    queryFn: () => investimentosApi.obterIndicadoresBcb(),
    staleTime: 6 * 60 * 60_000
  });

  if (isLoading || !data) return null;

  const items = [
    { label: 'SELIC', valor: data.selicAnual, icon: 'trending_up' },
    { label: 'CDI', valor: data.cdiAnual, icon: 'show_chart' },
    { label: 'IPCA 12m', valor: data.ipcaAcumulado12m, icon: 'price_change' }
  ].filter((i) => i.valor !== null);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">Indicadores BCB</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">{item.icon}</span>
          <span className="text-xs font-bold text-on-surface">{item.label}</span>
          <span className="text-xs font-extrabold text-primary">{item.valor!.toFixed(2)}% a.a.</span>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function InvestimentosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showEncerrados, setShowEncerrados] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<InvestimentoResumo>();
  const [atualizandoValor, setAtualizandoValor] = useState<InvestimentoResumo>();
  const [encerrando, setEncerrando] = useState<InvestimentoResumo>();

  const listQuery = {
    page: 1,
    pageSize: 50,
    search: search || undefined,
    tipo: tipoFiltro ? (Number(tipoFiltro) as TipoInvestimento) : undefined,
    encerrado: showEncerrados ? undefined : false
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['investimentos', listQuery],
    queryFn: () => investimentosApi.listar(listQuery),
    staleTime: 30_000
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['investimentos'] });
  const investimentos = data?.items ?? [];

  const totalAplicado = investimentos.filter((i) => !i.encerrado).reduce((s, i) => s + i.valorInvestido, 0);
  const totalAtual = investimentos.filter((i) => !i.encerrado).reduce((s, i) => s + i.valorAtual, 0);
  const rendimentoTotal = totalAtual - totalAplicado;

  if (isLoading && !data) return <PageState state="loading" title="Carregando investimentos" />;
  if (error && !data) return <PageState state="error" title="Erro ao carregar investimentos" subtitle={(error as Error).message} />;

  return (
    <>
      {(modalOpen || editando) && (
        <InvModal
          inv={editando}
          onClose={() => { setModalOpen(false); setEditando(undefined); }}
          onSaved={invalidate}
        />
      )}
      {atualizandoValor && (
        <AtualizarValorModal
          inv={atualizandoValor}
          onClose={() => setAtualizandoValor(undefined)}
          onSaved={invalidate}
        />
      )}
      {encerrando && (
        <EncerrarModal
          inv={encerrando}
          onClose={() => setEncerrando(undefined)}
          onSaved={invalidate}
        />
      )}

      <ListPageShell
        actions={
          <Button
            type="button"
            variant="primary"
            icon={<span className="material-symbols-outlined text-sm">add</span>}
            onClick={() => setModalOpen(true)}
          >
            Novo investimento
          </Button>
        }
        summary={
          <>
            <SummaryCard
              label="Total aplicado"
              value={formatCurrencyBRL(totalAplicado)}
              icon={<span className="material-symbols-outlined text-base">payments</span>}
            />
            <SummaryCard
              label="Valor atual"
              value={formatCurrencyBRL(totalAtual)}
              accent="primary"
              icon={<span className="material-symbols-outlined text-base">trending_up</span>}
            />
            <SummaryCard
              label="Rendimento total"
              value={`${formatCurrencyBRL(rendimentoTotal)} (${formatPercent(totalAplicado > 0 ? (rendimentoTotal / totalAplicado) * 100 : 0)})`}
              accent={rendimentoTotal >= 0 ? 'primary' : 'error'}
              icon={<span className="material-symbols-outlined text-base">percent</span>}
            />
          </>
        }
        filters={
          <div className="space-y-3">
            <IndicadoresBcbBanner />
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar investimento..."
                className="h-10 min-w-[200px] flex-1 rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
              />
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-surface-container px-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              >
                <option value="">Todos os tipos</option>
                {tipoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowEncerrados((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${showEncerrados ? 'border-primary/30 bg-primary/15 text-primary' : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-primary/20 hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                {showEncerrados ? 'Ocultando encerrados' : 'Ver encerrados'}
              </button>
            </div>
          </div>
        }
      >
        {investimentos.length === 0 ? (
          <PageState
            state="empty"
            title="Nenhum investimento encontrado"
            subtitle="Registre seus investimentos para acompanhar o desempenho da sua carteira."
            actionLabel="Registrar primeiro investimento"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {investimentos.map((inv) => (
              <InvCard
                key={inv.id}
                inv={inv}
                onEditar={() => setEditando(inv)}
                onAtualizarValor={() => setAtualizandoValor(inv)}
                onEncerrar={() => setEncerrando(inv)}
              />
            ))}
          </div>
        )}
      </ListPageShell>
    </>
  );
}
