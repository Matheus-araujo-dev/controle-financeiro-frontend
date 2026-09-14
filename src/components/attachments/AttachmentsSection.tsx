import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Modal, Spin } from 'antd';
import {
  PaperClipOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InboxOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { Button } from '../ui/Button';
import { anexosApi } from '../../services/http/anexos-api';
import { useNotificationStore } from '../../store/notification-store';
import type { TipoEntidadeAnexo, AnexoResumo } from '../../types/anexos';

const { Dragger } = Upload;

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
];

const ACCEPT_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.webp,.txt';

interface AttachmentsSectionProps {
  tipoEntidade: TipoEntidadeAnexo;
  entidadeId: string | undefined | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(isoString));
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <FilePdfOutlined className="text-error" />;
  if (mimeType.startsWith('image/')) return <FileImageOutlined className="text-primary" />;
  return <FileTextOutlined className="text-on-surface-variant" />;
}

export function AttachmentsSection({ tipoEntidade, entidadeId }: AttachmentsSectionProps) {
  const queryClient = useQueryClient();
  const push = useNotificationStore((s) => s.push);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryKey = ['anexos', tipoEntidade, entidadeId];

  const { data: anexos = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => anexosApi.listar(tipoEntidade, entidadeId!),
    enabled: !!entidadeId
  });

  const uploadMutation = useMutation({
    mutationFn: (arquivo: File) => anexosApi.enviar(tipoEntidade, entidadeId!, arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      push({ level: 'success', title: 'Anexo enviado com sucesso' });
    },
    onError: () => {
      push({ level: 'error', title: 'Erro ao enviar anexo' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (anexoId: string) => anexosApi.excluir(tipoEntidade, entidadeId!, anexoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      push({ level: 'success', title: 'Anexo excluído com sucesso' });
    },
    onError: () => {
      push({ level: 'error', title: 'Erro ao excluir anexo' });
    }
  });

  function handleDownload(anexo: AnexoResumo) {
    anexosApi.baixar(anexo.id, anexo.nomeArquivoOriginal).catch(() => {
      push({ level: 'error', title: 'Erro ao baixar anexo' });
    });
  }

  function handleDelete(anexoId: string) {
    setDeletingId(anexoId);
  }

  function confirmDelete() {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
      setDeletingId(null);
    }
  }

  if (!entidadeId) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-container p-6 text-center">
        <PaperClipOutlined className="mb-2 text-2xl text-on-surface-variant" />
        <p className="text-sm text-on-surface-variant">
          Salve o registro antes de anexar arquivos
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface-container p-4">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
        <PaperClipOutlined />
        Anexos
      </h3>

      <Dragger
        accept={ACCEPT_EXTENSIONS}
        showUploadList={false}
        multiple={false}
        disabled={uploadMutation.isPending}
        beforeUpload={(file) => {
          if (!ACCEPTED_TYPES.includes(file.type)) {
            push({
              level: 'error',
              title: 'Tipo de arquivo não permitido',
              description: 'Envie arquivos PDF, JPEG, PNG, WEBP ou TXT.'
            });
            return Upload.LIST_IGNORE;
          }
          if (file.size > MAX_SIZE_BYTES) {
            push({
              level: 'error',
              title: 'Arquivo muito grande',
              description: 'O tamanho máximo permitido é 10 MB.'
            });
            return Upload.LIST_IGNORE;
          }
          uploadMutation.mutate(file);
          return false;
        }}
        className="mb-4"
      >
        <p className="text-3xl text-on-surface-variant">
          {uploadMutation.isPending ? <Spin /> : <InboxOutlined />}
        </p>
        <p className="text-sm text-on-surface-variant">
          Arraste um arquivo ou clique para selecionar
        </p>
        <p className="text-xs text-on-surface-variant/60">
          PDF, JPEG, PNG, WEBP ou TXT (max. 10 MB)
        </p>
      </Dragger>

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Spin />
        </div>
      )}

      {isError && (
        <p className="py-4 text-center text-sm text-error">
          Erro ao carregar anexos: {(error as Error)?.message ?? 'Erro desconhecido'}
        </p>
      )}

      {!isLoading && !isError && anexos.length === 0 && (
        <p className="py-4 text-center text-sm text-on-surface-variant">
          Nenhum anexo encontrado.
        </p>
      )}

      {anexos.length > 0 && (
        <ul className="space-y-2">
          {anexos.map((anexo) => (
            <li
              key={anexo.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container-high px-3 py-2"
            >
              <span className="text-lg">{getFileIcon(anexo.mimeType)}</span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-on-surface" title={anexo.nomeArquivoOriginal}>
                  {anexo.nomeArquivoOriginal}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {formatFileSize(anexo.tamanhoBytes)} &middot; {formatDate(anexo.createdAtUtc)}
                  {anexo.origem === 'Whatsapp' && (
                    <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                      WhatsApp
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<DownloadOutlined />}
                  title="Baixar"
                  aria-label={`Baixar ${anexo.nomeArquivoOriginal}`}
                  onClick={() => handleDownload(anexo)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<DeleteOutlined />}
                  title="Excluir"
                  aria-label={`Excluir ${anexo.nomeArquivoOriginal}`}
                  onClick={() => handleDelete(anexo.id)}
                  loading={deleteMutation.isPending && deletingId === anexo.id}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title="Excluir anexo"
        open={!!deletingId}
        onOk={confirmDelete}
        onCancel={() => setDeletingId(null)}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
      >
        <p>Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
}
