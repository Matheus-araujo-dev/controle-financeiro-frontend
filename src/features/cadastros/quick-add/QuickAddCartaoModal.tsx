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
const numInputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors';

export function QuickAddCartaoModal({ open, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [bandeira, setBandeira] = useState('');
  const [numeroFinal, setNumeroFinal] = useState('');
  const [diaFechamento, setDiaFechamento] = useState(1);
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const finalValid = /^\d{4}$/.test(numeroFinal);

  async function handleSave() {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return; }
    if (!bandeira.trim()) { setError('Bandeira é obrigatória.'); return; }
    if (!finalValid) { setError('Número final deve ter exatamente 4 dígitos.'); return; }
    setLoading(true);
    setError(undefined);
    try {
      const result = await cadastrosApi.cartoes.criar({
        nome: nome.trim(),
        bandeira: bandeira.trim(),
        numeroFinal,
        diaFechamentoFatura: diaFechamento,
        diaVencimentoFatura: diaVencimento,
        contaBancariaPagamentoPadraoId: null,
        limiteCredito: null,
        ativo: true
      });
      onSuccess(result.id, `${result.nome} - final ${result.numeroFinal}`);
      handleClose();
    } catch {
      setError('Falha ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNome('');
    setBandeira('');
    setNumeroFinal('');
    setDiaFechamento(1);
    setDiaVencimento(10);
    setError(undefined);
    onClose();
  }

  return (
    <Modal
      title="Novo Cartão"
      open={open}
      onCancel={handleClose}
      onOk={handleSave}
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={loading}
      centered
      okButtonProps={{ disabled: !nome.trim() || !bandeira.trim() || !finalValid }}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className={labelClass}>Nome do cartão</label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Nubank Roxinho"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Bandeira</label>
            <input
              value={bandeira}
              onChange={(e) => setBandeira(e.target.value)}
              placeholder="Visa, Mastercard..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>4 últimos dígitos</label>
            <input
              value={numeroFinal}
              onChange={(e) => setNumeroFinal(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              maxLength={4}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Dia fechamento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={diaFechamento}
              onChange={(e) => setDiaFechamento(Number(e.target.value))}
              className={numInputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dia vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(Number(e.target.value))}
              className={numInputClass}
            />
          </div>
        </div>

        {error && <p className="text-xs font-bold text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
