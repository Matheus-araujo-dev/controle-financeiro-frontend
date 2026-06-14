import { useState } from 'react';
import { Modal } from 'antd';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import type { FormaPagamentoTipo } from '../../../types/cadastros';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
};

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors';
const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1';
const selectClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors';

const tipoOptions: Array<{ label: string; value: FormaPagamentoTipo }> = [
  { label: 'Pix', value: 'Pix' },
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Boleto', value: 'Boleto' },
  { label: 'Transferência', value: 'Transferencia' },
  { label: 'Débito', value: 'Debito' },
  { label: 'Crédito', value: 'Credito' },
  { label: 'Outro', value: 'Outro' }
];

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
      <span className="text-sm text-on-surface">{label}</span>
      <span className="relative inline-flex h-6 w-12 items-center rounded-full">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-white/10 transition peer-checked:bg-primary/30" />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-6 peer-checked:bg-primary" />
      </span>
    </label>
  );
}

export function QuickAddFormaPagamentoModal({ open, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<FormaPagamentoTipo>('Pix');
  const [ehCartao, setEhCartao] = useState(false);
  const [baixarAutomaticamente, setBaixarAutomaticamente] = useState(false);
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
      const result = await cadastrosApi.formasPagamento.criar({
        nome: nome.trim(),
        tipo,
        ehCartao,
        baixarAutomaticamente,
        ativo: true
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
    setTipo('Pix');
    setEhCartao(false);
    setBaixarAutomaticamente(false);
    setError(undefined);
    onClose();
  }

  return (
    <Modal
      title="Nova Forma de Pagamento"
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
            placeholder="Ex: Pix Pessoal, Nubank Débito"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as FormaPagamentoTipo)}
            className={selectClass}
          >
            {tipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <CheckRow label="É cartão de crédito" checked={ehCartao} onChange={setEhCartao} />
          <CheckRow label="Baixa automaticamente" checked={baixarAutomaticamente} onChange={setBaixarAutomaticamente} />
        </div>

        {error && <p className="text-xs font-bold text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
