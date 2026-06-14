import { useState } from 'react';
import { Modal } from 'antd';
import { cadastrosApi } from '../../../services/http/cadastros-api';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
};

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors';
const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1';

export function QuickAddPessoaModal({ open, onClose, onSuccess }: Props) {
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
        chavesPix: []
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
    <Modal
      title="Nova Pessoa"
      open={open}
      onCancel={handleClose}
      onOk={handleSave}
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={loading}
      centered
      okButtonProps={{ disabled: !nome.trim() }}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className={labelClass}>Nome</label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Nome completo ou razão social"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Fisica', 'Juridica'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoPessoa(tipo)}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  tipoPessoa === tipo
                    ? 'bg-primary text-[#062412]'
                    : 'bg-white/5 text-on-surface-variant hover:text-white border border-white/10'
                }`}
              >
                {tipo === 'Fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs font-bold text-red-400">{error}</p>}

        <p className="text-[11px] text-on-surface-variant">
          Cadastro mínimo. Edite os dados completos depois em <strong>Cadastros → Pessoas</strong>.
        </p>
      </div>
    </Modal>
  );
}
