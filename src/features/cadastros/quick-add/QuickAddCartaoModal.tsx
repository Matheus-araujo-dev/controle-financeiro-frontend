import { useState } from 'react';
import { formCompactFieldClass, formFieldClass, formLabelClass } from '../../../components/forms/FormPrimitives';
import { handleIntegerPaste, parseIntegerInput, preventScientificNotation } from '../../../shared/number-input';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { BankIconPicker } from '../BankIconPicker';
import { ColorPicker } from '../ColorPicker';
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
  const [icone, setIcone] = useState<string>('credit_card');
  const [cor, setCor] = useState<string>('#2bf58e');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const finalValid = /^\d{4}$/.test(numeroFinal);

  async function handleSave() {
    if (!nome.trim()) {
      setError('Nome e obrigatorio.');
      return;
    }
    if (!bandeira.trim()) {
      setError('Bandeira e obrigatoria.');
      return;
    }
    if (!finalValid) {
      setError('Numero final deve ter exatamente 4 digitos.');
      return;
    }
    if (diaFechamento < 1 || diaFechamento > 31) {
      setError('Dia de fechamento deve estar entre 1 e 31.');
      return;
    }
    if (diaVencimento < 1 || diaVencimento > 31) {
      setError('Dia de vencimento deve estar entre 1 e 31.');
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
        ativo: true,
        icone,
        cor
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
    setIcone('credit_card');
    setCor('#2bf58e');
    setError(undefined);
    onClose();
  }

  return (
    <QuickAddModal
      open={open}
      title="Novo Cartao"
      icon="credit_card"
      error={error}
      loading={loading}
      submitDisabled={!nome.trim() || !bandeira.trim() || !finalValid}
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <div className="space-y-2">
        <label className={formLabelClass}>Nome do Cartao</label>
        <input autoFocus value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex: Nubank Roxinho" className={formFieldClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={formLabelClass}>Bandeira</label>
          <input value={bandeira} onChange={(event) => setBandeira(event.target.value)} placeholder="Visa, Mastercard..." className={formFieldClass} />
        </div>
        <div className="space-y-2">
          <label className={formLabelClass}>4 Ãšltimos DÃ­gitos</label>
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
            inputMode="numeric"
            min={1}
            max={31}
            value={diaFechamento}
            onKeyDown={preventScientificNotation}
            onPaste={handleIntegerPaste}
            onChange={(event) => setDiaFechamento(parseIntegerInput(event.target.value) || 0)}
            className={formCompactFieldClass}
          />
        </div>
        <div className="space-y-2">
          <label className={formLabelClass}>Dia Vencimento</label>
          <input
            inputMode="numeric"
            min={1}
            max={31}
            value={diaVencimento}
            onKeyDown={preventScientificNotation}
            onPaste={handleIntegerPaste}
            onChange={(event) => setDiaVencimento(parseIntegerInput(event.target.value) || 0)}
            className={formCompactFieldClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Ícone</label>
        <BankIconPicker value={icone} onChange={setIcone} />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Cor</label>
        <ColorPicker value={cor} onChange={setCor} />
      </div>
    </QuickAddModal>
  );
}
