import { useState } from 'react';
import { Modal } from 'antd';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import type { ContaGerencialTipo } from '../../../types/cadastros';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
  defaultTipo?: ContaGerencialTipo;
};

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors';
const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1';

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
    <Modal
      title="Nova Conta Gerencial"
      open={open}
      onCancel={handleClose}
      onOk={handleSave}
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={loading}
      centered
      okButtonProps={{ disabled: !descricao.trim() }}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className={labelClass}>Descrição</label>
          <input
            autoFocus
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Ex: Despesas com Alimentação"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Natureza</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Despesa', 'Receita'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  tipo === t
                    ? t === 'Receita'
                      ? 'bg-primary text-[#062412]'
                      : 'bg-[#ff8a7a] text-[#2c0600]'
                    : 'bg-white/5 text-on-surface-variant hover:text-white border border-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs font-bold text-red-400">{error}</p>}

        <p className="text-[11px] text-on-surface-variant">
          Será criada como conta analítica (aceita lançamentos). Configure a hierarquia depois em{' '}
          <strong>Cadastros → Contas Gerenciais</strong>.
        </p>
      </div>
    </Modal>
  );
}
