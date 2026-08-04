import { useState } from 'react';
import { ComboBox } from '../../../components/forms/ComboBox';
import { formFieldClass, formLabelClass, ToggleField } from '../../../components/forms/FormPrimitives';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { QuickAddModal } from './QuickAddModal';

type PessoaRole = 'pagador' | 'recebedor' | 'responsavel';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
  defaultRole?: PessoaRole;
};

const tipoPessoaOptions = [
  { label: 'Pessoa Física', value: 'Fisica' },
  { label: 'Pessoa Jurídica', value: 'Juridica' }
];

function defaultRoles(role?: PessoaRole) {
  return {
    ehPagador: !role || role === 'pagador',
    ehRecebedor: !role || role === 'recebedor',
    ehResponsavel: !role || role === 'responsavel'
  };
}

export function QuickAddPessoaModal({ open, onClose, onSuccess, defaultRole }: Props) {
  const [nome, setNome] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'Fisica' | 'Juridica'>('Fisica');
  const initial = defaultRoles(defaultRole);
  const [ehPagador, setEhPagador] = useState(initial.ehPagador);
  const [ehRecebedor, setEhRecebedor] = useState(initial.ehRecebedor);
  const [ehResponsavel, setEhResponsavel] = useState(initial.ehResponsavel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [duplicateItems, setDuplicateItems] = useState<Array<{ id: string; nome: string }>>([]);

  async function criar() {
    const result = await cadastrosApi.pessoas.criar({
      nome: nome.trim(),
      tipoPessoa,
      cpfCnpj: '',
      email: '',
      telefone: '',
      observacao: '',
      chavesPix: [],
      ehPagador,
      ehRecebedor,
      ehResponsavel,
      contaGerencialDespesaId: null,
      contaGerencialReceitaId: null
    } as never);
    onSuccess(result.id, result.nome);
    handleClose();
  }

  async function handleSave() {
    if (!nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      try {
        const found = await cadastrosApi.pessoas.listar({ page: 1, pageSize: 10, search: nome.trim() });
        const matches = found.items.filter((p) => p.nome.toLowerCase() === nome.trim().toLowerCase());
        if (matches.length > 0) {
          setDuplicateItems(matches.map((p) => ({ id: p.id, nome: p.nome })));
          return;
        }
      } catch {
        // falha na verificação — prossegue com o save
      }
      await criar();
    } catch {
      setError('Falha ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDuplicate() {
    setDuplicateItems([]);
    setLoading(true);
    setError(undefined);
    try {
      await criar();
    } catch {
      setError('Falha ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNome('');
    setTipoPessoa('Fisica');
    const reset = defaultRoles(defaultRole);
    setEhPagador(reset.ehPagador);
    setEhRecebedor(reset.ehRecebedor);
    setEhResponsavel(reset.ehResponsavel);
    setError(undefined);
    setDuplicateItems([]);
    onClose();
  }

  return (
    <QuickAddModal
      open={open}
      title="Nova Pessoa"
      icon="person_add"
      error={error}
      loading={loading}
      submitDisabled={!nome.trim()}
      isDirty={!!nome.trim()}
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <div className="space-y-2">
        <label className={formLabelClass}>Nome</label>
        <input
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Nome completo ou razão social"
          className={formFieldClass}
        />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Tipo</label>
        <ComboBox aria-label="Tipo" value={tipoPessoa} onChange={(value) => setTipoPessoa(value as 'Fisica' | 'Juridica')} options={tipoPessoaOptions} />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Papéis</label>
        <div className="grid grid-cols-1 gap-2">
          <ToggleField checked={ehPagador} onChange={setEhPagador} label="Pagador" />
          <ToggleField checked={ehRecebedor} onChange={setEhRecebedor} label="Recebedor" />
          <ToggleField checked={ehResponsavel} onChange={setEhResponsavel} label="Responsável" />
        </div>
      </div>

      {duplicateItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-amber-400 shrink-0" aria-hidden="true">warning</span>
            <p className="text-xs text-amber-300">
              Já existe{duplicateItems.length > 1 ? 'm' : ''} {duplicateItems.length} pessoa{duplicateItems.length > 1 ? 's' : ''} com esse nome:
            </p>
          </div>
          <ul className="space-y-1 pl-6">
            {duplicateItems.map((item) => (
              <li key={item.id} className="text-xs font-medium text-on-surface truncate">{item.nome}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void handleConfirmDuplicate()}
            className="w-full rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30 transition-colors hover:bg-amber-500/30"
          >
            Cadastrar mesmo assim
          </button>
        </div>
      )}

      <p className="text-[11px] text-on-surface-variant">
        Cadastro mínimo. Edite os dados completos depois em <strong>Cadastros → Pessoas</strong>.
      </p>
    </QuickAddModal>
  );
}
