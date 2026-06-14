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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickAddContaBancariaModal({ open, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return; }
    if (!banco.trim()) { setError('Banco é obrigatório.'); return; }
    setLoading(true);
    setError(undefined);
    try {
      const result = await cadastrosApi.contasBancarias.criar({
        nome: nome.trim(),
        banco: banco.trim(),
        agencia: '',
        numeroConta: '',
        tipoConta: '',
        saldoInicial: 0,
        dataSaldoInicial: todayIso(),
        limiteCartoesCompartilhado: null,
        ativo: true
      });
      onSuccess(result.id, `${result.nome} - ${result.banco}`);
      handleClose();
    } catch {
      setError('Falha ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNome('');
    setBanco('');
    setError(undefined);
    onClose();
  }

  return (
    <Modal
      title="Nova Conta Bancária"
      open={open}
      onCancel={handleClose}
      onOk={handleSave}
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={loading}
      centered
      okButtonProps={{ disabled: !nome.trim() || !banco.trim() }}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className={labelClass}>Nome da conta</label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Conta Corrente Nubank"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Banco</label>
          <input
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Ex: Nubank, Itaú, Bradesco"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs font-bold text-red-400">{error}</p>}

        <p className="text-[11px] text-on-surface-variant">
          Saldo inicial será R$ 0,00. Ajuste em <strong>Cadastros → Contas Bancárias</strong>.
        </p>
      </div>
    </Modal>
  );
}
