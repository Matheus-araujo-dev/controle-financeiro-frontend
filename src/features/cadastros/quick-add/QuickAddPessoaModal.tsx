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

  async function handleSave() {
    if (!nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
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
        <div className="grid grid-cols-3 gap-2">
          <ToggleField checked={ehPagador} onChange={setEhPagador} label="Pagador" />
          <ToggleField checked={ehRecebedor} onChange={setEhRecebedor} label="Recebedor" />
          <ToggleField checked={ehResponsavel} onChange={setEhResponsavel} label="Responsável" />
        </div>
      </div>

      <p className="text-[11px] text-on-surface-variant">
        Cadastro mínimo. Edite os dados completos depois em <strong>Cadastros → Pessoas</strong>.
      </p>
    </QuickAddModal>
  );
}
