import { useState } from 'react';
import { ComboBox } from '../../../components/forms/ComboBox';
import { formFieldClass, formLabelClass, ToggleField } from '../../../components/forms/FormPrimitives';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import type { FormaPagamentoTipo } from '../../../types/cadastros';
import { QuickAddModal } from './QuickAddModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string, label: string) => void;
};

const tipoOptions: Array<{ label: string; value: FormaPagamentoTipo }> = [
  { label: 'Pix', value: 'Pix' },
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Boleto', value: 'Boleto' },
  { label: 'Transferência', value: 'Transferencia' },
  { label: 'Débito', value: 'Debito' },
  { label: 'Crédito', value: 'Credito' },
  { label: 'Outro', value: 'Outro' }
];

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
    <QuickAddModal
      open={open}
      title="Nova Forma de Pagamento"
      icon="payments"
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
          placeholder="Ex: Pix Pessoal, Nubank Débito"
          className={formFieldClass}
        />
      </div>

      <div className="space-y-2">
        <label className={formLabelClass}>Tipo</label>
        <ComboBox aria-label="Tipo" value={tipo} onChange={(value) => setTipo(value as FormaPagamentoTipo)} options={tipoOptions} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ToggleField checked={ehCartao} onChange={setEhCartao} label="É cartão de crédito" description="Gera fatura de cartão" />
        <ToggleField checked={baixarAutomaticamente} onChange={setBaixarAutomaticamente} label="Baixa automática" description="Liquida ao lançar" />
      </div>
    </QuickAddModal>
  );
}
