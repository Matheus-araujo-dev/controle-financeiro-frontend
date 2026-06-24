import { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, DownloadOutlined, InboxOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Alert, Button, List, Space, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { anexosApi } from '../../services/http/anexos-api';
import type { AnexoResumo, TipoEntidadeAnexo } from '../../types/anexos';

type AttachmentsSectionProps = {
  tipoEntidade: TipoEntidadeAnexo;
  entidadeId?: string;
  disabled?: boolean;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsSection({
  tipoEntidade,
  entidadeId,
  disabled,
  pendingFiles = [],
  onPendingFilesChange
}: AttachmentsSectionProps) {
  const [items, setItems] = useState<AnexoResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const loadAttachments = useCallback(async (targetId: string) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      setItems(await anexosApi.listar(tipoEntidade, targetId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar anexos.');
    } finally {
      setLoading(false);
    }
  }, [tipoEntidade]);

  useEffect(() => {
    if (!entidadeId) {
      setItems([]);
      return;
    }

    void loadAttachments(entidadeId);
  }, [entidadeId, loadAttachments]);

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const arquivo = file as File;

    if (!entidadeId) {
      onPendingFilesChange?.([...pendingFiles, arquivo]);
      return Upload.LIST_IGNORE;
    }

    setBusy(true);
    setErrorMessage(undefined);
    try {
      const created = await anexosApi.enviar(tipoEntidade, entidadeId, arquivo);
      setItems((current) => [created, ...current]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao enviar anexo.');
    } finally {
      setBusy(false);
    }

    return Upload.LIST_IGNORE;
  };

  async function downloadAttachment(item: AnexoResumo) {
    setBusy(true);
    setErrorMessage(undefined);
    try {
      const blob = await anexosApi.baixar(item.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.nomeArquivoOriginal;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao baixar anexo.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAttachment(item: AnexoResumo) {
    if (!entidadeId) return;

    setBusy(true);
    setErrorMessage(undefined);
    try {
      await anexosApi.excluir(tipoEntidade, entidadeId, item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao remover anexo.');
    } finally {
      setBusy(false);
    }
  }

  function removePendingFile(index: number) {
    onPendingFilesChange?.(pendingFiles.filter((_file, currentIndex) => currentIndex !== index));
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

      <Upload.Dragger
        multiple
        disabled={disabled || busy}
        beforeUpload={beforeUpload}
        showUploadList={false}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <Typography.Text strong>Adicionar comprovantes e documentos</Typography.Text>
        <br />
        <Typography.Text type="secondary">PDF, imagem ou TXT ate 10 MB por arquivo.</Typography.Text>
      </Upload.Dragger>

      {pendingFiles.length > 0 ? (
        <List
          size="small"
          dataSource={pendingFiles}
          renderItem={(file, index) => (
            <List.Item
              actions={[
                <Button
                  key="remove"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Remover ${file.name}`}
                  onClick={() => removePendingFile(index)}
                />
              ]}
            >
              <List.Item.Meta
                avatar={<PaperClipOutlined />}
                title={file.name}
                description={`Pendente de envio - ${formatFileSize(file.size)}`}
              />
            </List.Item>
          )}
        />
      ) : null}

      <List
        size="small"
        loading={loading}
        dataSource={items}
        locale={{ emptyText: entidadeId ? 'Nenhum anexo cadastrado.' : 'Os anexos serao enviados apos salvar.' }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="download"
                type="text"
                icon={<DownloadOutlined />}
                aria-label={`Baixar ${item.nomeArquivoOriginal}`}
                onClick={() => void downloadAttachment(item)}
              />,
              <Button
                key="delete"
                type="text"
                danger
                disabled={disabled}
                icon={<DeleteOutlined />}
                aria-label={`Remover ${item.nomeArquivoOriginal}`}
                onClick={() => void deleteAttachment(item)}
              />
            ]}
          >
            <List.Item.Meta
              avatar={<PaperClipOutlined />}
              title={item.nomeArquivoOriginal}
              description={`${item.origem} - ${formatFileSize(item.tamanhoBytes)}`}
            />
          </List.Item>
        )}
      />
    </Space>
  );
}
