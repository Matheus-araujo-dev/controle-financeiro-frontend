import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { QuickAddModal } from '../cadastros/quick-add/QuickAddModal';
import { ComboBox } from '../../components/forms/ComboBox';
import { formFieldClass, formLabelClass } from '../../components/forms/FormPrimitives';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { conciliacoesApi } from '../../services/http/conciliacoes-api';
import { notify } from '../../store/notification-store';

const { Dragger } = Upload;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function NovaConciliacaoModal({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setContaBancariaId('');
      setArquivo(null);
      setError(undefined);
    }
  }, [open]);

  const { data: contasData } = useQuery({
    queryKey: ['contas-bancarias-combo'],
    queryFn: () => cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 100, search: '', ativo: true }),
    enabled: open,
    staleTime: 60_000
  });

  const contaOptions = (contasData?.items ?? []).map((c) => ({
    value: c.id,
    label: `${c.nome} — ${c.banco}`
  }));

  const mutation = useMutation({
    mutationFn: () => {
      if (!arquivo) throw new Error('Selecione um arquivo.');
      return conciliacoesApi.criar(contaBancariaId, arquivo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
      notify('success', 'Conciliacao criada com sucesso');
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  function handleSubmit() {
    if (!contaBancariaId) {
      setError('Selecione a conta bancaria.');
      return;
    }
    if (!arquivo) {
      setError('Selecione um arquivo (.ofx ou .csv).');
      return;
    }
    setError(undefined);
    mutation.mutate();
  }

  return (
    <QuickAddModal
      open={open}
      title="Nova conciliacao"
      icon="account_balance"
      submitLabel="Importar extrato"
      error={error}
      loading={mutation.isPending}
      submitDisabled={!contaBancariaId || !arquivo}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className={formFieldClass}>
        <label className={formLabelClass}>Conta bancaria</label>
        <ComboBox
          value={contaBancariaId}
          options={contaOptions}
          placeholder="Selecione a conta"
          onChange={setContaBancariaId}
        />
      </div>

      <div className={formFieldClass}>
        <label className={formLabelClass}>Arquivo do extrato</label>
        <Dragger
          accept=".ofx,.csv"
          maxCount={1}
          beforeUpload={(file) => {
            setArquivo(file);
            return false;
          }}
          onRemove={() => setArquivo(null)}
          fileList={arquivo ? [{ uid: '-1', name: arquivo.name, status: 'done' }] : []}
        >
          <p className="text-3xl text-on-surface-variant">
            <InboxOutlined />
          </p>
          <p className="text-sm text-on-surface-variant">
            Clique ou arraste o arquivo OFX ou CSV do extrato bancario
          </p>
        </Dragger>
      </div>
    </QuickAddModal>
  );
}