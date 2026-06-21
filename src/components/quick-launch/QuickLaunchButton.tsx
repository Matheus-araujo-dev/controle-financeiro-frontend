import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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
import { filterContaGerencialLancavel, mapContaGerencialSelectOptions } from '../../shared/conta-gerencial';

type Option = { label: string; value: string };
type QuickLaunchTipo = 'pagar' | 'receber';
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

function QuickLaunchModal({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState<QuickLaunchTipo>('pagar');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const [dataVencimento, setDataVencimento] = useState(hojeISO());
  const [pessoaId, setPessoaId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [formaPagamentoId, setFormaPagamentoId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [contaGerencialId, setContaGerencialId] = useState('');
  const [saving, setSaving] = useState(false);

  const [pessoas, setPessoas] = useState<Option[]>([]);
  const [formas, setFormas] = useState<Array<Option & { ehCartao: boolean }>>([]);
  const [cartoes, setCartoes] = useState<Option[]>([]);
  const [contasDespesa, setContasDespesa] = useState<Option[]>([]);
  const [contasReceita, setContasReceita] = useState<Option[]>([]);

  const [quickAddPessoaTarget, setQuickAddPessoaTarget] = useState<QuickAddTarget>(null);
  const [quickAddFormaOpen, setQuickAddFormaOpen] = useState(false);
  const [quickAddContaOpen, setQuickAddContaOpen] = useState(false);
  const [quickAddCartaoOpen, setQuickAddCartaoOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const shell = document.querySelector<HTMLElement>('[data-testid="admin-shell"]');
    const previousAriaHidden = shell?.getAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('quick-launch-open');
    shell?.setAttribute('aria-hidden', 'true');
    shell?.setAttribute('inert', '');

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
    };
  }, []);

  useEffect(() => {
    async function loadOptions() {
      const base = { page: 1, pageSize: 100, search: '' };
      const [pessoasResp, formasResp, cartoesResp, despesaResp, receitaResp] = await Promise.all([
        cadastrosApi.pessoas.listar({ ...base, ativo: true }),
        cadastrosApi.formasPagamento.listar({ ...base, ativo: true }),
        cadastrosApi.cartoes.listar({ ...base, ativo: true }),
        cadastrosApi.contasGerenciais.listar({ ...base, tipo: 'Despesa', ativo: true, aceitaLancamentos: true }),
        cadastrosApi.contasGerenciais.listar({ ...base, tipo: 'Receita', ativo: true, aceitaLancamentos: true })
      ]);

      setPessoas(pessoasResp.items.map((item) => ({ label: item.nome, value: item.id })));
      setFormas(formasResp.items.map((item) => ({ label: item.nome, value: item.id, ehCartao: item.ehCartao })));
      setCartoes(cartoesResp.items.map((item) => ({ label: `${item.nome} - final ${item.numeroFinal}`, value: item.id })));
      setContasDespesa(mapContaGerencialSelectOptions(filterContaGerencialLancavel(despesaResp.items)));
      setContasReceita(mapContaGerencialSelectOptions(filterContaGerencialLancavel(receitaResp.items)));
    }

    loadOptions().catch(() => notify('error', 'Falha ao carregar opções do lançamento rápido'));
  }, []);

  const formaSelecionada = useMemo(() => formas.find((forma) => forma.value === formaPagamentoId), [formas, formaPagamentoId]);
  const exigeCartao = tipo === 'pagar' && Boolean(formaSelecionada?.ehCartao);
  const contasGerenciais = tipo === 'pagar' ? contasDespesa : contasReceita;

  useEffect(() => {
    if (!exigeCartao) {
      setCartaoId('');
    }
  }, [exigeCartao]);

  const podeSalvar =
    descricao.trim().length > 0 &&
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
      const base = {
        numeroDocumento: null,
        dataEmissao: hojeISO(),
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
          recebedorId: pessoaId
        });
      } else {
        await financeiroApi.contasReceber.criar({
          ...base,
          responsavelId,
          pagadorId: pessoaId
        });
      }

      notify('success', 'Lançamento criado', descricao.trim());
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
  }

  function handlePessoaSuccess(target: QuickAddTarget, newId: string, label: string) {
    setPessoas((current) => mergeOption(current, { value: newId, label }));
    if (target === 'pessoaId') {
      setPessoaId(newId);
    }
    if (target === 'responsavelId') {
      setResponsavelId(newId);
    }
    setQuickAddPessoaTarget(null);
  }

  function handleFormaSuccess(newId: string, label: string) {
    setFormas((current) => mergeOption(current, { value: newId, label, ehCartao: false }));
    setFormaPagamentoId(newId);
    setQuickAddFormaOpen(false);
  }

  function handleContaGerencialSuccess(newId: string, label: string) {
    const nextOption = { value: newId, label };
    if (tipo === 'pagar') {
      setContasDespesa((current) => mergeOption(current, nextOption));
    } else {
      setContasReceita((current) => mergeOption(current, nextOption));
    }
    setContaGerencialId(newId);
    setQuickAddContaOpen(false);
  }

  function handleCartaoSuccess(newId: string, label: string) {
    setCartoes((current) => mergeOption(current, { value: newId, label }));
    setCartaoId(newId);
    setQuickAddCartaoOpen(false);
  }

  const modal = (
    <div className="fixed inset-0 z-[1000] bg-black/75 px-4 py-6 backdrop-blur-md">
      <div className="flex h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lançamento rápido"
          className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface-container-low shadow-2xl"
        >
          <div className="overflow-y-auto p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary shadow">
                <span className="material-symbols-outlined text-2xl">bolt</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Operação rápida</p>
                <h3 className="font-headline text-lg font-bold text-on-surface">Lançamento rápido</h3>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface-container p-1">
              {[
                { label: 'Conta a pagar', value: 'pagar' as const },
                { label: 'Conta a receber', value: 'receber' as const }
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
                <label className={formLabelClass}>Vencimento</label>
                <DateInput ariaLabel="Vencimento" value={dataVencimento} onChange={setDataVencimento} />
              </div>

              <div className="space-y-2">
                <label className={formLabelClass}>{tipo === 'pagar' ? 'Recebedor' : 'Pagador'}</label>
                <ComboBox
                  aria-label={tipo === 'pagar' ? 'Recebedor' : 'Pagador'}
                  value={pessoaId}
                  onChange={setPessoaId}
                  options={pessoas}
                  placeholder="Selecionar pessoa..."
                  className={formFieldClass}
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
                  options={pessoas}
                  placeholder="Selecionar responsável..."
                  className={formFieldClass}
                  onAddNew={() => setQuickAddPessoaTarget('responsavelId')}
                  addNewLabel="Nova pessoa"
                />
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
                  className={formFieldClass}
                  onAddNew={() => setQuickAddFormaOpen(true)}
                  addNewLabel="Nova forma de pagamento"
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
                  className={formFieldClass}
                  onAddNew={() => setQuickAddContaOpen(true)}
                  addNewLabel="Nova conta gerencial"
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
                    className={formFieldClass}
                    onAddNew={() => setQuickAddCartaoOpen(true)}
                    addNewLabel="Novo cartão"
                  />
                </div>
              ) : null}
            </div>

            <p className="mt-6 text-xs text-on-surface-variant">
              Precisa de parcelas, rateio detalhado ou recorrência? Use o formulário completo em Contas a pagar/receber.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" size="lg" disabled={!podeSalvar || saving} loading={saving} onClick={() => void handleSubmit()}>
                Lançar
              </Button>
            </div>
          </div>
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
