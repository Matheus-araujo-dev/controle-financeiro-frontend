import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { PageState } from '../../components/states/PageState';
import { ListPageShell } from '../../components/layout/ListPageShell';
import { SummaryCard } from '../../components/layout/SummaryCard';
import { ComboBox } from '../../components/forms/ComboBox';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { planosApi } from '../../services/http/planos-api';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { formatCurrencyBRL } from '../../shared/currency';
import type { PlanoResumo } from '../../types/planos';

// ── Modal de criação/edição ──────────────────────────────────────────────────

type PlanoFormData = {
  nome: string;
  descricao: string;
  valorMensal: number | null;
  numParcelas: string;
  contaBancariaCaixaId: string;
  formaPagamentoId: string;
  recebedorId: string;
  contaGerencialId: string;
};

const emptyForm = (): PlanoFormData => ({
  nome: '',
  descricao: '',
  valorMensal: null,
  numParcelas: '',
  contaBancariaCaixaId: '',
  formaPagamentoId: '',
  recebedorId: '',
  contaGerencialId: ''
});

function planoToForm(p: PlanoResumo): PlanoFormData {
  return {
    nome: p.nome,
    descricao: p.descricao ?? '',
    valorMensal: p.valorMensal,
    numParcelas: String(p.numParcelas),
    contaBancariaCaixaId: p.contaBancariaCaixaId,
    formaPagamentoId: p.formaPagamentoId ?? '',
    recebedorId: p.recebedorId ?? '',
    contaGerencialId: p.contaGerencialId ?? ''
  };
}

interface PlanoModalProps {
  plano?: PlanoResumo;
  onClose: () => void;
  onSaved: () => void;
}

function PlanoModal({ plano, onClose, onSaved }: PlanoModalProps) {
  const isEditing = !!plano;
  const [form, setForm] = useState<PlanoFormData>(plano ? planoToForm(plano) : emptyForm());
  const [error, setError] = useState<string>();

  const { data: contasData } = useQuery({
    queryKey: ['contas-bancarias', 'options'],
    queryFn: () => cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 10 * 60_000
  });

  const { data: formasData } = useQuery({
    queryKey: ['formas-pagamento', 'options'],
    queryFn: () => cadastrosApi.formasPagamento.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 10 * 60_000
  });

  const { data: pessoasData } = useQuery({
    queryKey: ['pessoas', 'options'],
    queryFn: () => cadastrosApi.pessoas.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 10 * 60_000
  });

  const { data: contasGerenciaisData } = useQuery({
    queryKey: ['contas-gerenciais', 'options'],
    queryFn: () => cadastrosApi.contasGerenciais.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 10 * 60_000
  });

  const contasOptions = (contasData?.items ?? []).map((c) => ({ label: c.nome, value: c.id }));
  const formasOptions = (formasData?.items ?? []).map((f) => ({ label: f.nome, value: f.id }));
  const pessoasOptions = (pessoasData?.items ?? []).map((p) => ({ label: p.nome, value: p.id }));
  const contasGerenciaisOptions = (contasGerenciaisData?.items ?? []).map((c) => ({ label: `${c.codigo} — ${c.descricao}`, value: c.id }));

  const criarMutation = useMutation({
    mutationFn: () =>
      planosApi.criar({
        nome: form.nome,
        descricao: form.descricao || undefined,
        valorMensal: form.valorMensal!,
        numParcelas: Number(form.numParcelas),
        contaBancariaCaixaId: form.contaBancariaCaixaId,
        formaPagamentoId: form.formaPagamentoId || undefined,
        recebedorId: form.recebedorId || undefined,
        contaGerencialId: form.contaGerencialId || undefined
      }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  const atualizarMutation = useMutation({
    mutationFn: () =>
      planosApi.atualizar(plano!.id, {
        nome: form.nome,
        descricao: form.descricao || undefined,
        valorMensal: form.valorMensal!,
        numParcelas: Number(form.numParcelas),
        formaPagamentoId: form.formaPagamentoId || undefined,
        recebedorId: form.recebedorId || undefined,
        contaGerencialId: form.contaGerencialId || undefined
      }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  const saving = criarMutation.isPending || atualizarMutation.isPending;

  const canSave =
    form.nome.trim() &&
    (form.valorMensal ?? 0) > 0 &&
    Number(form.numParcelas) > 0 &&
    (!isEditing ? form.contaBancariaCaixaId : true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (isEditing) atualizarMutation.mutate();
    else criarMutation.mutate();
  }

  const meses = Number(form.numParcelas) || 0;
  const totalPrevisto = (form.valorMensal ?? 0) * meses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline text-xl font-extrabold text-on-surface">
            {isEditing ? 'Editar plano' : 'Novo plano de poupança'}
          </h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-on-surface-variant hover:bg-white/10">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Reserva de emergência"
              className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Descrição</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Opcional"
              className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Valor mensal *</label>
              <CurrencyInput
                value={form.valorMensal}
                onChange={(v) => setForm((f) => ({ ...f, valorMensal: v }))}
                placeholder="R$ 0,00"
                className="h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nº de parcelas *</label>
              <input
                type="number"
                min={1}
                max={360}
                value={form.numParcelas}
                onChange={(e) => setForm((f) => ({ ...f, numParcelas: e.target.value }))}
                placeholder="12"
                className="h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Conta caixa *</label>
              <ComboBox
                options={contasOptions}
                value={form.contaBancariaCaixaId}
                onChange={(v) => setForm((f) => ({ ...f, contaBancariaCaixaId: v ?? '' }))}
                placeholder="Selecione a conta destino"
              />
            </div>
          )}

          <div className="rounded-2xl border border-white/5 bg-surface-container p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">receipt_long</span>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Gerar conta a pagar ao adiantar</p>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Quando os três campos abaixo estiverem preenchidos, cada parcela adiantada criará automaticamente uma conta a pagar.
            </p>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Forma de pagamento</label>
              <ComboBox
                options={formasOptions}
                value={form.formaPagamentoId}
                onChange={(v) => setForm((f) => ({ ...f, formaPagamentoId: v ?? '' }))}
                placeholder="Selecione (opcional)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Recebedor</label>
              <ComboBox
                options={pessoasOptions}
                value={form.recebedorId}
                onChange={(v) => setForm((f) => ({ ...f, recebedorId: v ?? '' }))}
                placeholder="Selecione (opcional)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Conta gerencial</label>
              <ComboBox
                options={contasGerenciaisOptions}
                value={form.contaGerencialId}
                onChange={(v) => setForm((f) => ({ ...f, contaGerencialId: v ?? '' }))}
                placeholder="Selecione (opcional)"
              />
            </div>
          </div>

          {totalPrevisto > 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs font-bold text-on-surface-variant">Meta total prevista</p>
              <p className="font-headline text-xl font-extrabold text-primary">{formatCurrencyBRL(totalPrevisto)}</p>
              <p className="text-xs text-on-surface-variant">{meses} meses × {formatCurrencyBRL(form.valorMensal ?? 0)}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={!canSave || saving} className="flex-1">
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar plano'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de retirada ─────────────────────────────────────────────────────────

interface RetiradaModalProps {
  plano: PlanoResumo;
  onClose: () => void;
  onSaved: () => void;
}

function RetiradaModal({ plano, onClose, onSaved }: RetiradaModalProps) {
  const [valor, setValor] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: () => planosApi.retirarDinheiro(plano.id, valor!),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e: Error) => setError(e.message)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-surface-container-low p-6 shadow-2xl">
        <h2 className="mb-4 font-headline text-lg font-extrabold text-on-surface">Retirar do plano</h2>
        <p className="mb-4 text-sm text-on-surface-variant">
          Disponível: <span className="font-bold text-primary">{formatCurrencyBRL(plano.totalAcumulado)}</span>
        </p>
        {error && <div className="mb-3 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</div>}
        <CurrencyInput
          value={valor}
          onChange={setValor}
          placeholder="Valor a retirar"
          className="mb-4 h-10 w-full rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
        />
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            type="button"
            variant="primary"
            disabled={!valor || valor <= 0 || mutation.isPending}
            onClick={() => { setError(undefined); mutation.mutate(); }}
            className="flex-1"
          >
            {mutation.isPending ? 'Retirando...' : 'Retirar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Card de plano ─────────────────────────────────────────────────────────────

interface PlanoCardProps {
  plano: PlanoResumo;
  onEditar: () => void;
  onAdiantar: () => void;
  onRetirar: () => void;
  onCancelar: () => void;
  loading: boolean;
}

function getStatusBadge(plano: PlanoResumo) {
  if (plano.cancelado) return { label: 'Cancelado', cls: 'bg-error/15 text-error' };
  if (plano.concluido) return { label: 'Concluído', cls: 'bg-primary/15 text-primary' };
  return { label: 'Ativo', cls: 'bg-warning/15 text-warning' };
}

function PlanoCard({ plano, onEditar, onAdiantar, onRetirar, onCancelar, loading }: PlanoCardProps) {
  const pct = plano.numParcelas > 0 ? (plano.parcelasPagas / plano.numParcelas) * 100 : 0;
  const status = getStatusBadge(plano);
  const podeOperar = !plano.cancelado && !plano.concluido;

  return (
    <div className={`flex flex-col gap-4 rounded-3xl border p-5 transition-all ${plano.cancelado ? 'border-white/5 bg-surface-container opacity-60' : 'border-white/5 bg-surface-container-low hover:border-primary/20'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
            <h3 className="font-headline text-base font-extrabold text-on-surface truncate">{plano.nome}</h3>
          </div>
          {plano.descricao && <p className="mt-0.5 text-xs text-on-surface-variant truncate">{plano.descricao}</p>}
          <p className="mt-1 text-xs text-on-surface-variant">{plano.contaBancariaNome}</p>
          {plano.formaPagamentoId && plano.recebedorId && plano.contaGerencialId && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5">
              <span className="material-symbols-outlined text-[11px] text-primary">receipt_long</span>
              <span className="text-[10px] font-bold text-primary">Gera conta a pagar</span>
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${status.cls}`}>{status.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Acumulado</p>
          <p className="mt-1 font-headline text-sm font-extrabold text-primary">{formatCurrencyBRL(plano.totalAcumulado)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Meta</p>
          <p className="mt-1 font-headline text-sm font-extrabold text-on-surface">{formatCurrencyBRL(plano.valorTotal)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parcelas</p>
          <p className="mt-1 font-headline text-sm font-extrabold text-on-surface">{plano.parcelasPagas}/{plano.numParcelas}</p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-on-surface-variant">Progresso</span>
          <span className="font-bold text-primary">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full transition-all ${plano.concluido ? 'bg-primary' : pct >= 80 ? 'bg-warning' : 'bg-primary/60'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-on-surface-variant">{formatCurrencyBRL(plano.valorMensal)}/mês</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {podeOperar && !plano.concluido && (
          <button
            type="button"
            onClick={onAdiantar}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Adiantar parcela
          </button>
        )}
        {podeOperar && plano.totalAcumulado > 0 && (
          <button
            type="button"
            onClick={onRetirar}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning transition-colors hover:bg-warning/20 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">output</span>
            Retirar
          </button>
        )}
        {podeOperar && (
          <button
            type="button"
            onClick={onEditar}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:border-primary/20 hover:text-primary"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Editar
          </button>
        )}
        {podeOperar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-error/20 bg-error/5 px-3 py-1.5 text-xs font-bold text-error transition-colors hover:bg-error/15 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PlanosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCancelados, setShowCancelados] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<PlanoResumo>();
  const [retirando, setRetirando] = useState<PlanoResumo>();

  const query = {
    page: 1,
    pageSize: 50,
    search: search || undefined,
    cancelado: showCancelados ? undefined : false
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['planos', query],
    queryFn: () => planosApi.listar(query),
    staleTime: 30_000
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['planos'] });

  const adiantarMutation = useMutation({
    mutationFn: (id: string) => planosApi.adiantarParcela(id),
    onSuccess: invalidate
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => planosApi.cancelar(id),
    onSuccess: invalidate
  });

  const planos = data?.items ?? [];
  const ativos = planos.filter((p) => !p.cancelado && !p.concluido).length;
  const concluidos = planos.filter((p) => p.concluido).length;
  const totalAcumulado = planos.filter((p) => !p.cancelado).reduce((s, p) => s + p.totalAcumulado, 0);

  if (isLoading && !data) return <PageState state="loading" title="Carregando planos" />;
  if (error && !data) return <PageState state="error" title="Erro ao carregar planos" subtitle={(error as Error).message} />;

  return (
    <>
      {(modalOpen || editando) && (
        <PlanoModal
          plano={editando}
          onClose={() => { setModalOpen(false); setEditando(undefined); }}
          onSaved={invalidate}
        />
      )}
      {retirando && (
        <RetiradaModal
          plano={retirando}
          onClose={() => setRetirando(undefined)}
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
            Novo plano
          </Button>
        }
        summary={
          <>
            <SummaryCard
              label="Planos ativos"
              value={ativos}
              icon={<span className="material-symbols-outlined text-base">savings</span>}
            />
            <SummaryCard
              label="Concluídos"
              value={concluidos}
              accent="primary"
              icon={<span className="material-symbols-outlined text-base">check_circle</span>}
            />
            <SummaryCard
              label="Total acumulado"
              value={formatCurrencyBRL(totalAcumulado)}
              accent="primary"
              icon={<span className="material-symbols-outlined text-base">account_balance_wallet</span>}
            />
          </>
        }
        filters={
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plano..."
              className="h-10 min-w-[200px] flex-1 rounded-xl border border-white/10 bg-surface-container px-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCancelados((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${showCancelados ? 'border-primary/30 bg-primary/15 text-primary' : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-primary/20 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              {showCancelados ? 'Ocultando cancelados' : 'Ver cancelados'}
            </button>
          </div>
        }
      >
        {planos.length === 0 ? (
          <PageState
            state="empty"
            title="Nenhum plano encontrado"
            subtitle="Crie um plano de poupança para começar a guardar dinheiro com metas."
            actionLabel="Criar primeiro plano"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planos.map((plano) => (
              <PlanoCard
                key={plano.id}
                plano={plano}
                loading={adiantarMutation.isPending || cancelarMutation.isPending}
                onEditar={() => setEditando(plano)}
                onAdiantar={() => adiantarMutation.mutate(plano.id)}
                onRetirar={() => setRetirando(plano)}
                onCancelar={() => {
                  if (confirm(`Cancelar o plano "${plano.nome}"?`)) cancelarMutation.mutate(plano.id);
                }}
              />
            ))}
          </div>
        )}
      </ListPageShell>
    </>
  );
}
