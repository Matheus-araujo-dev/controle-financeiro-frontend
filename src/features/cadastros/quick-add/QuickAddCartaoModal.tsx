import { useState } from 'react';
import { formCompactFieldClass, formFieldClass, formLabelClass } from '../../../components/forms/FormPrimitives';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { QuickAddModal } from './QuickAddModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
};

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
    if (!nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    if (!bandeira.trim()) {
      setError('Bandeira é obrigatória.');
      return;
    }
    if (!finalValid) {
      setError('Número final deve ter exatamente 4 dígitos.');
      return;
    }
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
    <QuickAddModal
      open={open}
      title="Novo Cartão"
      icon="credit_card"
      error={error}
      loading={loading}
      submitDisabled={!nome.trim() || !bandeira.trim() || !finalValid}
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <div className="space-y-2">
        <label className={formLabelClass}>Nome do Cartão</label>
        <input autoFocus value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex: Nubank Roxinho" className={formFieldClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={formLabelClass}>Bandeira</label>
          <input value={bandeira} onChange={(event) => setBandeira(event.target.value)} placeholder="Visa, Mastercard..." className={formFieldClass} />
        </div>
        <div className="space-y-2">
          <label className={formLabelClass}>4 Últimos Dígitos</label>
          <input
            value={numeroFinal}
            onChange={(event) => setNumeroFinal(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="0000"
            maxLength={4}
            className={formFieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={formLabelClass}>Dia Fechamento</label>
          <input
            type="number"
            min={1}
            max={31}
            value={diaFechamento}
            onChange={(event) => setDiaFechamento(Number(event.target.value))}
            className={formCompactFieldClass}
          />
        </div>
        <div className="space-y-2">
          <label className={formLabelClass}>Dia Vencimento</label>
          <input
            type="number"
            min={1}
            max={31}
            value={diaVencimento}
            onChange={(event) => setDiaVencimento(Number(event.target.value))}
            className={formCompactFieldClass}
          />
        </div>
      </div>
    </QuickAddModal>
  );
}
