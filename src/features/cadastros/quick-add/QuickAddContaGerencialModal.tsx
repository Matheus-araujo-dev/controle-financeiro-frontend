import { useState } from 'react';
import { ComboBox } from '../../../components/forms/ComboBox';
import { formFieldClass, formLabelClass } from '../../../components/forms/FormPrimitives';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import type { ContaGerencialTipo } from '../../../types/cadastros';
import { QuickAddModal } from './QuickAddModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
  defaultTipo?: ContaGerencialTipo;
};

const tipoOptions: Array<{ label: string; value: ContaGerencialTipo }> = [
  { label: 'Despesa', value: 'Despesa' },
  { label: 'Receita', value: 'Receita' }
];

export function QuickAddContaGerencialModal({ open, onClose, onSuccess, defaultTipo = 'Despesa' }: Props) {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<ContaGerencialTipo>(defaultTipo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSave() {
    if (!descricao.trim()) {
      setError('Descrição é obrigatória.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const result = await cadastrosApi.contasGerenciais.criar({
        codigo: '',
        descricao: descricao.trim(),
        tipo,
        contaPaiId: null,
        responsavelPadraoId: null,
        ativo: true,
        ehPadraoRecebimentoFaturaCartao: false
      });
      const label = result.codigo ? `${result.codigo} - ${result.descricao}` : result.descricao;
      onSuccess(result.id, label);
      handleClose();
    } catch {
      setError('Falha ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setDescricao('');
    setTipo(defaultTipo);
    setError(undefined);
    onClose();
  }

  return (
    <QuickAddModal
      open={open}
      title="Nova Conta Gerencial"
      icon="account_tree"
      error={error}
      loading={loading}
      submitDisabled={!descricao.trim()}
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <div className="space-y-2">
        <label className={formLabelClass}>Descrição</label>
        <input
          autoFocus
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="Ex: Despesas com Alimentação"
          className={formFieldClass}
        />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Natureza</label>
        <ComboBox aria-label="Natureza" value={tipo} onChange={(value) => setTipo(value as ContaGerencialTipo)} options={tipoOptions} />
      </div>

      <p className="text-[11px] text-on-surface-variant">
        Será criada como conta analítica, apta para lançamentos. Configure a hierarquia depois em <strong>Cadastros → Contas Gerenciais</strong>.
      </p>
    </QuickAddModal>
  );
}
