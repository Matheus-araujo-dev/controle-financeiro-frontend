import { useEffect, useMemo, useState } from 'react';
import { Modal, Segmented, Select } from 'antd';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { notify } from '../../store/notification-store';
import { getApiErrorMessage } from '../../services/http/api-error';
import { CurrencyInput } from '../../shared/CurrencyInput';

type Option = { label: string; value: string };
type FormaPagamentoOption = Option & { ehCartao: boolean };

type QuickLaunchTipo = 'pagar' | 'receber';

const fieldClass =
  'w-full rounded-2xl border-none bg-surface-container-highest px-4 py-3 text-sm text-white placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40';
const labelClass = 'mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant';

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickLaunchButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Lançamento rápido"
        aria-label="Lançamento rápido"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children ?? <span className="material-symbols-outlined block">add</span>}
      </button>
      {open ? <QuickLaunchModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function QuickLaunchModal({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState<QuickLaunchTipo>('pagar');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const [dataVencimento, setDataVencimento] = useState(hojeISO());
  const [pessoaId, setPessoaId] = useState<string>();
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>();
  const [cartaoId, setCartaoId] = useState<string>();
  const [contaGerencialId, setContaGerencialId] = useState<string>();
  const [saving, setSaving] = useState(false);

  const [pessoas, setPessoas] = useState<Option[]>([]);
  const [formas, setFormas] = useState<FormaPagamentoOption[]>([]);
  const [cartoes, setCartoes] = useState<Option[]>([]);
  const [contasDespesa, setContasDespesa] = useState<Option[]>([]);
  const [contasReceita, setContasReceita] = useState<Option[]>([]);

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
      setContasDespesa(despesaResp.items.filter((i) => i.aceitaLancamentos).map((i) => ({ label: i.descricao, value: i.id })));
      setContasReceita(receitaResp.items.filter((i) => i.aceitaLancamentos).map((i) => ({ label: i.descricao, value: i.id })));
    }

    loadOptions().catch(() => notify('error', 'Falha ao carregar opções do lançamento rápido'));
  }, []);

  const formaSelecionada = useMemo(() => formas.find((f) => f.value === formaPagamentoId), [formas, formaPagamentoId]);
  const exigeCartao = tipo === 'pagar' && !!formaSelecionada?.ehCartao;
  const contasGerenciais = tipo === 'pagar' ? contasDespesa : contasReceita;

  const podeSalvar =
    descricao.trim().length > 0 && valor > 0 && !!pessoaId && !!formaPagamentoId && !!contaGerencialId &&
    (!exigeCartao || !!cartaoId);

  const handleSubmit = async () => {
    if (!podeSalvar || !pessoaId || !formaPagamentoId || !contaGerencialId) return;

    setSaving(true);
    try {
      const base = {
        numeroDocumento: null,
        dataEmissao: hojeISO(),
        dataVencimento,
        formaPagamentoId,
        cartaoId: exigeCartao ? cartaoId ?? null : null,
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
          responsavelCompraId: pessoaId,
          recebedorId: pessoaId
        });
      } else {
        await financeiroApi.contasReceber.criar({
          ...base,
          responsavelId: pessoaId,
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
  };

  return (
    <Modal
      open
      centered
      title="Lançamento rápido"
      okText={saving ? 'Salvando...' : 'Lançar'}
      cancelText="Cancelar"
      okButtonProps={{ disabled: !podeSalvar || saving }}
      onOk={() => void handleSubmit()}
      onCancel={onClose}
    >
      <div className="space-y-4 pt-2">
        <Segmented
          block
          value={tipo}
          onChange={(value) => {
            setTipo(value as QuickLaunchTipo);
            setContaGerencialId(undefined);
          }}
          options={[
            { label: 'Conta a pagar', value: 'pagar' },
            { label: 'Conta a receber', value: 'receber' }
          ]}
        />

        <div>
          <label className={labelClass}>Descrição</label>
          <input
            className={fieldClass}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === 'pagar' ? 'Ex: Mercado da semana' : 'Ex: Salário'}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Valor</label>
            <CurrencyInput value={valor} onChange={(v) => setValor(v ?? 0)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Vencimento</label>
            <input
              type="date"
              className={fieldClass}
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{tipo === 'pagar' ? 'Recebedor' : 'Pagador'}</label>
          <Select
            className="w-full"
            showSearch
            optionFilterProp="label"
            placeholder="Selecionar pessoa..."
            value={pessoaId}
            onChange={setPessoaId}
            options={pessoas}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Forma de pagamento</label>
            <Select
              className="w-full"
              placeholder="Selecionar..."
              value={formaPagamentoId}
              onChange={setFormaPagamentoId}
              options={formas}
            />
          </div>
          <div>
            <label className={labelClass}>Conta gerencial</label>
            <Select
              className="w-full"
              showSearch
              optionFilterProp="label"
              placeholder="Selecionar..."
              value={contaGerencialId}
              onChange={setContaGerencialId}
              options={contasGerenciais}
            />
          </div>
        </div>

        {exigeCartao ? (
          <div>
            <label className={labelClass}>Cartão de crédito</label>
            <Select
              className="w-full"
              placeholder="Selecionar cartão..."
              value={cartaoId}
              onChange={setCartaoId}
              options={cartoes}
            />
          </div>
        ) : null}

        <p className="text-xs text-on-surface-variant">
          Precisa de parcelas, rateio detalhado ou recorrência? Use o formulário completo em Contas a pagar/receber.
        </p>
      </div>
    </Modal>
  );
}
