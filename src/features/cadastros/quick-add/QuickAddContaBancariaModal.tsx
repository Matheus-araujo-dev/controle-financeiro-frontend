import { useState } from 'react';
import { formFieldClass, formLabelClass } from '../../../components/forms/FormPrimitives';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { BankIconPicker } from '../BankIconPicker';
import { ColorPicker } from '../ColorPicker';
import { QuickAddModal } from './QuickAddModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickAddContaBancariaModal({ open, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('');
  const [icone, setIcone] = useState<string>('account_balance');
  const [cor, setCor] = useState<string>('#2bf58e');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSave() {
    if (!nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    if (!banco.trim()) {
      setError('Banco é obrigatório.');
      return;
    }
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
        ativo: true,
        icone,
        cor
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
    setIcone('account_balance');
    setCor('#2bf58e');
    setError(undefined);
    onClose();
  }

  return (
    <QuickAddModal
      open={open}
      title="Nova Conta Bancária"
      icon="account_balance"
      error={error}
      loading={loading}
      submitDisabled={!nome.trim() || !banco.trim()}
      isDirty={!!nome.trim() || !!banco.trim()}
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <div className="space-y-2">
        <label className={formLabelClass}>Nome da Conta</label>
        <input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex: Conta Corrente Nubank" className={formFieldClass} />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Banco</label>
        <input value={banco} onChange={(event) => setBanco(event.target.value)} placeholder="Ex: Nubank, Itaú, Bradesco" className={formFieldClass} />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Ícone</label>
        <BankIconPicker value={icone} onChange={setIcone} />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Cor</label>
        <ColorPicker value={cor} onChange={setCor} />
      </div>

      <p className="text-[11px] text-on-surface-variant">
        Saldo inicial será R$ 0,00. Ajuste em <strong>Cadastros → Contas Bancárias</strong>.
      </p>
    </QuickAddModal>
  );
}
