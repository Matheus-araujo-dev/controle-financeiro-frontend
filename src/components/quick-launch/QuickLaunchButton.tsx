import { createPortal } from 'react-dom';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useQueries } from '@tanstack/react-query';
import { DateInput } from '../forms/DateInput';
import { ComboBox } from '../forms/ComboBox';
import { Button } from '../ui/Button';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { notify } from '../../store/notification-store';
import { getApiErrorMessage } from '../../services/http/api-error';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { formFieldClass, formLabelClass } from '../forms/FormPrimitives';
import { QuickAddPessoaModal } from '../../features/cadastros/quick-add/QuickAddPessoaModal';
import { QuickAddFormaPagamentoModal } from '../../features/cadastros/quick-add/QuickAddFormaPagamentoModal';
import { QuickAddContaGerencialModal } from '../../features/cadastros/quick-add/QuickAddContaGerencialModal';
import { QuickAddCartaoModal } from '../../features/cadastros/quick-add/QuickAddCartaoModal';
import { mapContaGerencialHierarchyData } from '../../shared/conta-gerencial';
import type { ComboBoxOption } from '../forms/ComboBox';

type Option = { label: string; value: string };
type ContaGerencialOption = ComboBoxOption;
type QuickLaunchTipo = 'pagar' | 'receber' | 'transferencia';
type QuickAddTarget = 'pessoaId' | 'responsavelId' | null;

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function mergeOption<T extends Option>(list: T[], next: T) {
  return [next, ...list.filter((item) => item.value !== next.value)];
}

export function QuickLaunchButton({
  className,
  style,
  icon,
  children
}: {
  className?: string;
  style?: CSSProperties;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        title="Lançamento rápido"
        aria-label="Lançamento rápido"
        onClick={() => setOpen(true)}
        variant="primary"
        size="md"
        icon={icon ?? <span className="material-symbols-outlined block text-lg leading-none">add</span>}
        className={className}
        style={style}
      >
        {children}
      </Button>
      {open ? <QuickLaunchModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

const BASE_QUERY = { page: 1, pageSize: 100, search: '' } as const;
const STALE_5MIN = 5 * 60_000;

function QuickLaunchModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [tipo, setTipo] = useState<QuickLaunchTipo>('pagar');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const initialDate = useRef(hojeISO());
  const [dataVencimento, setDataVencimento] = useState(initialDate.current);
  const [pessoaId, setPessoaId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [formaPagamentoId, setFormaPagamentoId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [contaGerencialId, setContaGerencialId] = useState('');
  // transferência
  const [contaOrigemId, setContaOrigemId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const lastAutoFilledContaRef = useRef<string | null>(null);

  const isDirty =
    descricao.trim() !== '' ||
    valor !== 0 ||
    pessoaId !== '' ||
    responsavelId !== '' ||
    formaPagamentoId !== '' ||
    contaGerencialId !== '' ||
    contaOrigemId !== '' ||
    contaDestinoId !== '' ||
    dataVencimento !== initialDate.current;

  const isDirtyRef = useRef(isDirty);
  const confirmCloseRef = useRef(confirmClose);
  isDirtyRef.current = isDirty;
  confirmCloseRef.current = confirmClose;

  function requestClose() {
    if (isDirtyRef.current) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }

  // Itens adicionados via QuickAdd nesta sessão (aparecem no topo da lista)
  const [extraPessoas, setExtraPessoas] = useState<Option[]>([]);
  const [extraFormas, setExtraFormas] = useState<Array<Option & { ehCartao: boolean }>>([]);
  const [extraCartoes, setExtraCartoes] = useState<Option[]>([]);
  const [extraContasDespesa, setExtraContasDespesa] = useState<ContaGerencialOption[]>([]);
  const [extraContasReceita, setExtraContasReceita] = useState<ContaGerencialOption[]>([]);

  const [quickAddPessoaTarget, setQuickAddPessoaTarget] = useState<QuickAddTarget>(null);
  const [quickAddFormaOpen, setQuickAddFormaOpen] = useState(false);
  const [quickAddContaOpen, setQuickAddContaOpen] = useState(false);
  const [quickAddCartaoOpen, setQuickAddCartaoOpen] = useState(false);

  // React Query: cache com staleTime alto — re-abrir o modal não refaz chamadas
  const [pessoasResult, formasResult, cartoesResult, despesaResult, receitaResult, contasBancariasResult] = useQueries({
    queries: [
      { queryKey: ['ql-pessoas'], queryFn: () => cadastrosApi.pessoas.listar({ ...BASE_QUERY, ativo: true }), staleTime: STALE_5MIN },
      { queryKey: ['ql-formas'], queryFn: () => cadastrosApi.formasPagamento.listar({ ...BASE_QUERY, ativo: true }), staleTime: STALE_5MIN },
      { queryKey: ['ql-cartoes'], queryFn: () => cadastrosApi.cartoes.listar({ ...BASE_QUERY, ativo: true }), staleTime: STALE_5MIN },
      { queryKey: ['ql-contas-despesa'], queryFn: () => cadastrosApi.contasGerenciais.listar({ page: 1, pageSize: 500, search: '', tipo: 'Despesa', ativo: true }), staleTime: STALE_5MIN },
      { queryKey: ['ql-contas-receita'], queryFn: () => cadastrosApi.contasGerenciais.listar({ page: 1, pageSize: 500, search: '', tipo: 'Receita', ativo: true }), staleTime: STALE_5MIN },
      { queryKey: ['ql-contas-bancarias'], queryFn: () => cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 200, search: '', ativo: true }), staleTime: STALE_5MIN },
    ],
  });

  const pessoas = useMemo<Option[]>(() => {
    const fromServer = pessoasResult.data?.items.map((p) => ({ label: p.nome, value: p.id })) ?? [];
    return [...extraPessoas, ...fromServer.filter((p) => !extraPessoas.some((e) => e.value === p.value))];
  }, [extraPessoas, pessoasResult.data]);

  const pessoaContaGerencialMap = useMemo(() => {
    const map = new Map<string, { despesaId?: string; receitaId?: string }>();
    pessoasResult.data?.items.forEach((p) => {
      if (p.contaGerencialDespesaId || p.contaGerencialReceitaId) {
        map.set(p.id, {
          despesaId: p.contaGerencialDespesaId ?? undefined,
          receitaId: p.contaGerencialReceitaId ?? undefined
        });
      }
    });
    return map;
  }, [pessoasResult.data]);

  const responsaveis = useMemo<Option[]>(() => {
    const fromServer = pessoasResult.data?.items.filter((p) => p.ehResponsavel).map((p) => ({ label: p.nome, value: p.id })) ?? [];
    return [...extraPessoas, ...fromServer.filter((p) => !extraPessoas.some((e) => e.value === p.value))];
  }, [extraPessoas, pessoasResult.data]);

  const formas = useMemo<Array<Option & { ehCartao: boolean }>>(() => {
    const fromServer = formasResult.data?.items.map((f) => ({ label: f.nome, value: f.id, ehCartao: f.ehCartao })) ?? [];
    return [...extraFormas, ...fromServer.filter((f) => !extraFormas.some((e) => e.value === f.value))];
  }, [extraFormas, formasResult.data]);

  const cartoes = useMemo<Option[]>(() => {
    const fromServer = cartoesResult.data?.items.map((c) => ({ label: `${c.nome} - final ${c.numeroFinal}`, value: c.id })) ?? [];
    return [...extraCartoes, ...fromServer.filter((c) => !extraCartoes.some((e) => e.value === c.value))];
  }, [extraCartoes, cartoesResult.data]);

  const contasDespesa = useMemo<ContaGerencialOption[]>(() => {
    const fromServer = mapContaGerencialHierarchyData(despesaResult.data?.items ?? []).map(({ value, main, chain }) => ({
      value,
      displayText: main,
      label: chain ? (
        <span>
          {main} <span className="text-on-surface-variant/50 text-xs font-normal">{chain}</span>
        </span>
      ) : main
    }));
    return [...extraContasDespesa, ...fromServer.filter((c) => !extraContasDespesa.some((e) => e.value === c.value))];
  }, [extraContasDespesa, despesaResult.data]);

  const contasReceita = useMemo<ContaGerencialOption[]>(() => {
    const fromServer = mapContaGerencialHierarchyData(receitaResult.data?.items ?? []).map(({ value, main, chain }) => ({
      value,
      displayText: main,
      label: chain ? (
        <span>
          {main} <span className="text-on-surface-variant/50 text-xs font-normal">{chain}</span>
        </span>
      ) : main
    }));
    return [...extraContasReceita, ...fromServer.filter((c) => !extraContasReceita.some((e) => e.value === c.value))];
  }, [extraContasReceita, receitaResult.data]);

  useEffect(() => {
    if (!pessoaId) return;
    const contaIds = pessoaContaGerencialMap.get(pessoaId);
    const contaId = tipo === 'pagar' ? contaIds?.despesaId : contaIds?.receitaId;
    const manuallyChanged = contaGerencialId && contaGerencialId !== lastAutoFilledContaRef.current;
    if (manuallyChanged) return;
    if (contaId) {
      setContaGerencialId(contaId);
      lastAutoFilledContaRef.current = contaId;
    } else {
      if (contaGerencialId === lastAutoFilledContaRef.current) setContaGerencialId('');
      lastAutoFilledContaRef.current = null;
    }
  }, [pessoaId, tipo, contaGerencialId, pessoaContaGerencialMap]);

  const contasBancarias = useMemo<Option[]>(
    () => (contasBancariasResult.data?.items ?? []).map((c) => ({ label: c.nome, value: c.id })),
    [contasBancariasResult.data]
  );

  const someQueryErrored = [pessoasResult, formasResult, cartoesResult, despesaResult, receitaResult, contasBancariasResult].some((r) => r.isError);
  useEffect(() => {
    if (someQueryErrored) {
      notify('error', 'Falha ao carregar opções do lançamento rápido');
    }
  }, [someQueryErrored]);

  // Scroll lock + inert no shell + foco na abertura + focus trap + Escape
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const shell = document.querySelector<HTMLElement>('[data-testid="admin-shell"]');
    const previousAriaHidden = shell?.getAttribute('aria-hidden');

    document.body.style.overflow = 'hidden';
    document.body.classList.add('quick-launch-open');
    shell?.setAttribute('aria-hidden', 'true');
    shell?.setAttribute('inert', '');

    // Foca o primeiro elemento focável do modal
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (!dialogRef.current) return;

      if (event.key === 'Escape') {
        if (confirmCloseRef.current) {
          setConfirmClose(false);
        } else if (isDirtyRef.current) {
          setConfirmClose(true);
        } else {
          onClose();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('quick-launch-open');
      if (shell) {
        shell.removeAttribute('inert');
        if (previousAriaHidden == null) {
          shell.removeAttribute('aria-hidden');
        } else {
          shell.setAttribute('aria-hidden', previousAriaHidden);
        }
      }
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const formaSelecionada = useMemo(() => formas.find((forma) => forma.value === formaPagamentoId), [formas, formaPagamentoId]);
  const exigeCartao = tipo === 'pagar' && Boolean(formaSelecionada?.ehCartao);
  const contasGerenciais = tipo === 'pagar' ? contasDespesa : contasReceita;

  useEffect(() => {
    if (!exigeCartao) {
      setCartaoId('');
    }
  }, [exigeCartao]);

  const podeSalvar = tipo === 'transferencia'
    ? valor > 0 && Boolean(contaOrigemId) && Boolean(contaDestinoId) && contaOrigemId !== contaDestinoId
    : descricao.trim().length > 0 &&
      valor > 0 &&
      Boolean(pessoaId) &&
      Boolean(responsavelId) &&
      Boolean(formaPagamentoId) &&
      Boolean(contaGerencialId) &&
      (!exigeCartao || Boolean(cartaoId));

  async function handleSubmit() {
    if (!podeSalvar) return;

    setSaving(true);
    try {
      if (tipo === 'transferencia') {
        await financeiroApi.transferencias.criar({
          contaBancariaOrigemId: contaOrigemId,
          contaBancariaDestinoId: contaDestinoId,
          valor,
          dataTransferencia: dataVencimento,
          descricao: descricao.trim() || undefined
        });
        notify('success', 'Transferência registrada');
      } else {
        const base = {
          numeroDocumento: null,
          dataEmissao: exigeCartao ? dataVencimento : hojeISO(),
          dataVencimento,
          formaPagamentoId,
          cartaoId: exigeCartao ? cartaoId : null,
          contaBancariaId: null,
          dataLiquidacao: null,
          valorOriginal: valor,
          valorDesconto: 0,
          valorJuros: 0,
          valorMulta: 0,
          quantidadeParcelas: 1,
          descricao: descricao.trim(),
          observacao: null,
          rateios: [{ contaGerencialId, valor }],
          recorrencia: null
        };

        if (tipo === 'pagar') {
          await financeiroApi.contasPagar.criar({
            ...base,
            origemCompraPlanejadaId: null,
            responsavelCompraId: responsavelId,
            recebedorId: pessoaId,
            dataCompra: null
          });
        } else {
          await financeiroApi.contasReceber.criar({
            ...base,
            responsavelId,
            pagadorId: pessoaId
          });
        }
        notify('success', 'Lançamento criado', descricao.trim());
      }
      onClose();
    } catch (error) {
      notify('error', 'Falha ao criar lançamento', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function handleTipoChange(nextTipo: QuickLaunchTipo) {
    setTipo(nextTipo);
    setContaGerencialId('');
    setCartaoId('');
    setContaOrigemId('');
    setContaDestinoId('');
  }

  function handlePessoaSuccess(target: QuickAddTarget, newId: string, label: string) {
    setExtraPessoas((current) => mergeOption(current, { value: newId, label }));
    if (target === 'pessoaId') setPessoaId(newId);
    if (target === 'responsavelId') setResponsavelId(newId);
    setQuickAddPessoaTarget(null);
  }

  function handleFormaSuccess(newId: string, label: string) {
    setExtraFormas((current) => mergeOption(current, { value: newId, label, ehCartao: false }));
    setFormaPagamentoId(newId);
    setQuickAddFormaOpen(false);
  }

  function handleContaGerencialSuccess(newId: string, label: string) {
    const nextOption: ContaGerencialOption = { value: newId, label, displayText: label };
    if (tipo === 'pagar') {
      setExtraContasDespesa((current) => [nextOption, ...current.filter((item) => item.value !== newId)]);
    } else {
      setExtraContasReceita((current) => [nextOption, ...current.filter((item) => item.value !== newId)]);
    }
    setContaGerencialId(newId);
    setQuickAddContaOpen(false);
  }

  function handleCartaoSuccess(newId: string, label: string) {
    setExtraCartoes((current) => mergeOption(current, { value: newId, label }));
    setCartaoId(newId);
    setQuickAddCartaoOpen(false);
  }

  const modal = (
    <div className="fixed inset-0 z-[1000] bg-black/75 px-4 py-6 backdrop-blur-md">
      <div className="flex h-full items-center justify-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface-container-low shadow-2xl"
        >
          <div className="overflow-y-auto p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary shadow">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Operação rápida</p>
                <h3 id={titleId} className="font-headline text-lg font-bold text-on-surface">Lançamento rápido</h3>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-surface-container p-1">
              {[
                { label: 'Conta a pagar', value: 'pagar' as const },
                { label: 'Conta a receber', value: 'receber' as const },
                { label: 'Transferência', value: 'transferencia' as const }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTipoChange(option.value)}
                  className={`h-11 rounded-lg text-sm font-bold transition-colors ${
                    tipo === option.value ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {tipo === 'transferencia' ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={formLabelClass}>Conta origem</label>
                  <ComboBox
                    aria-label="Conta origem"
                    value={contaOrigemId}
                    onChange={setContaOrigemId}
                    options={contasBancarias.filter((c) => c.value !== contaDestinoId)}
                    placeholder="Selecionar conta..."
                  />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Conta destino</label>
                  <ComboBox
                    aria-label="Conta destino"
                    value={contaDestinoId}
                    onChange={setContaDestinoId}
                    options={contasBancarias.filter((c) => c.value !== contaOrigemId)}
                    placeholder="Selecionar conta..."
                  />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Valor</label>
                  <CurrencyInput value={valor} onChange={(nextValue) => setValor(nextValue ?? 0)} className={formFieldClass} />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Data</label>
                  <DateInput ariaLabel="Data da transferência" value={dataVencimento} onChange={setDataVencimento} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={formLabelClass}>Descrição (opcional)</label>
                  <input
                    className={formFieldClass}
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder="Ex: Reserva de emergência"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className={formLabelClass}>Descrição</label>
                  <input
                    className={formFieldClass}
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder={tipo === 'pagar' ? 'Ex: Mercado da semana' : 'Ex: Salário'}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Valor</label>
                  <CurrencyInput value={valor} onChange={(nextValue) => setValor(nextValue ?? 0)} className={formFieldClass} />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Forma de pagamento</label>
                  <ComboBox
                    aria-label="Forma de pagamento"
                    value={formaPagamentoId}
                    onChange={(value) => {
                      setFormaPagamentoId(value);
                      if (!formas.find((forma) => forma.value === value)?.ehCartao) {
                        setCartaoId('');
                      }
                    }}
                    options={formas}
                    placeholder="Selecionar..."
                    onAddNew={() => setQuickAddFormaOpen(true)}
                    addNewLabel="Nova forma de pagamento"
                  />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>{exigeCartao ? 'Data da compra' : 'Vencimento'}</label>
                  <DateInput
                    ariaLabel={exigeCartao ? 'Data da compra' : 'Vencimento'}
                    value={dataVencimento}
                    onChange={setDataVencimento}
                  />
                </div>

                {exigeCartao ? (
                  <div className="space-y-2">
                    <label className={formLabelClass}>Cartão de crédito</label>
                    <ComboBox
                      aria-label="Cartão de crédito"
                      value={cartaoId}
                      onChange={setCartaoId}
                      options={cartoes}
                      placeholder="Selecionar cartão..."
                      onAddNew={() => setQuickAddCartaoOpen(true)}
                      addNewLabel="Novo cartão"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className={formLabelClass}>{tipo === 'pagar' ? 'Recebedor' : 'Pagador'}</label>
                  <ComboBox
                    aria-label={tipo === 'pagar' ? 'Recebedor' : 'Pagador'}
                    value={pessoaId}
                    onChange={setPessoaId}
                    options={pessoas}
                    placeholder="Selecionar pessoa..."
                    onAddNew={() => setQuickAddPessoaTarget('pessoaId')}
                    addNewLabel="Nova pessoa"
                  />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Responsável</label>
                  <ComboBox
                    aria-label="Responsável"
                    value={responsavelId}
                    onChange={setResponsavelId}
                    options={responsaveis}
                    placeholder="Selecionar responsável..."
                    onAddNew={() => setQuickAddPessoaTarget('responsavelId')}
                    addNewLabel="Nova pessoa"
                  />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Conta gerencial</label>
                  <ComboBox
                    aria-label="Conta gerencial"
                    value={contaGerencialId}
                    onChange={setContaGerencialId}
                    options={contasGerenciais}
                    placeholder="Selecionar..."
                    onAddNew={() => setQuickAddContaOpen(true)}
                    addNewLabel="Nova conta gerencial"
                  />
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-white/5 pt-5">
              <p className="text-xs text-on-surface-variant">
                {tipo === 'transferencia'
                  ? 'A transferência cria automaticamente as movimentações de saída e entrada nas contas.'
                  : 'Precisa de parcelas, rateio detalhado ou recorrência? Use o formulário completo em Contas a pagar/receber.'}
              </p>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={requestClose}>
                Cancelar
              </Button>
              <Button type="button" size="lg" disabled={!podeSalvar || saving} loading={saving} onClick={() => void handleSubmit()}>
                {tipo === 'transferencia' ? 'Transferir' : 'Lançar'}
              </Button>
            </div>
          </div>

          {confirmClose && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/70 backdrop-blur-sm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="ql-confirm-title"
            >
              <div className="mx-6 w-full max-w-sm rounded-2xl border border-white/10 bg-surface-container p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/5 bg-surface-container-high text-amber-400">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">warning</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Atenção</p>
                    <h4 id="ql-confirm-title" className="font-bold text-on-surface">Descartar dados?</h4>
                  </div>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                  Os dados preenchidos ainda não foram salvos e serão perdidos se você fechar agora.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" size="md" onClick={() => setConfirmClose(false)}>
                    Continuar editando
                  </Button>
                  <Button type="button" variant="danger" size="md" onClick={onClose}>
                    Sim, descartar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {modal}
      <QuickAddPessoaModal
        open={quickAddPessoaTarget !== null}
        onClose={() => setQuickAddPessoaTarget(null)}
        onSuccess={(newId, label) => handlePessoaSuccess(quickAddPessoaTarget, newId, label)}
      />
      <QuickAddFormaPagamentoModal
        open={quickAddFormaOpen}
        onClose={() => setQuickAddFormaOpen(false)}
        onSuccess={handleFormaSuccess}
      />
      <QuickAddContaGerencialModal
        open={quickAddContaOpen}
        onClose={() => setQuickAddContaOpen(false)}
        onSuccess={handleContaGerencialSuccess}
        defaultTipo={tipo === 'pagar' ? 'Despesa' : 'Receita'}
      />
      <QuickAddCartaoModal
        open={quickAddCartaoOpen}
        onClose={() => setQuickAddCartaoOpen(false)}
        onSuccess={handleCartaoSuccess}
      />
    </>,
    document.body
  );
}
