import { useState } from 'react';
import { ComboBox } from '../../../components/forms/ComboBox';
import { formFieldClass, formLabelClass } from '../../../components/forms/FormPrimitives';
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

export function QuickAddPessoaModal({ open, onClose, onSuccess, defaultRole }: Props) {
  const [nome, setNome] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'Fisica' | 'Juridica'>('Fisica');
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
        ehPagador: !defaultRole || defaultRole === 'pagador',
        ehRecebedor: !defaultRole || defaultRole === 'recebedor',
        ehResponsavel: !defaultRole || defaultRole === 'responsavel'
      });
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
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <div className="space-y-2">
        <label className={formLabelClass}>Nome</label>
        <input
          autoFocus
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

      <p className="text-[11px] text-on-surface-variant">
        Cadastro mínimo. Edite os dados completos depois em <strong>Cadastros → Pessoas</strong>.
      </p>
    </QuickAddModal>
  );
}
