import { useEffect, useState } from 'react';
import { Button, Card, Input, Space, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { PageState } from '../../components/states/PageState';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import type { ImportacaoWhatsappDetalhe, ItemImportadoWhatsapp } from '../../types/importacoes-whatsapp';

function formatPayload(payload: string) {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

export function ImportacaoWhatsappDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [detail, setDetail] = useState<ImportacaoWhatsappDetalhe>();
  const [reviewObservation, setReviewObservation] = useState('');

  useEffect(() => {
    async function loadData(importacaoId: string) {
      setLoading(true);
      setErrorMessage(undefined);

      try {
        setDetail(await importacoesWhatsappApi.obterPorId(importacaoId));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar a importacao.');
      } finally {
        setLoading(false);
      }
    }

    if (!id) {
      setLoading(false);
      setErrorMessage('Importacao nao informada.');
      return;
    }

    void loadData(id);
  }, [id]);

  async function executeReviewAction(action: () => Promise<ImportacaoWhatsappDetalhe>) {
    setSaving(true);
    setErrorMessage(undefined);

    try {
      setDetail(await action());
      setReviewObservation('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao processar a revisao.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageState state="loading" title="Carregando importacao..." />;
  }

  if (!detail) {
    return <PageState state="error" title="Falha ao carregar importacao" subtitle={errorMessage ?? 'Falha ao carregar a importacao.'} />;
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>Revisao da importacao</Typography.Title>
        <Typography.Paragraph>
          Revise o texto bruto, o metadado do arquivo e as sugestoes geradas antes de confirmar ou rejeitar os itens.
        </Typography.Paragraph>
      </div>

      {errorMessage ? (
        <Card>
          <Typography.Text type="danger">{errorMessage}</Typography.Text>
        </Card>
      ) : null}

      <Card>
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Text strong>{detail.remetente}</Typography.Text>
          <Typography.Text>Origem: {detail.tipoOrigemNome}</Typography.Text>
          <Typography.Text>Status: {detail.statusNome}</Typography.Text>
          <Typography.Text>
            Confianca: {detail.confiancaExtracao === null ? '-' : `${Math.round(detail.confiancaExtracao * 100)}%`}
          </Typography.Text>
          <Typography.Text>Arquivo: {detail.nomeArquivo ?? 'Nao informado'}</Typography.Text>
          <Typography.Text>Mime type: {detail.mimeType ?? 'Nao informado'}</Typography.Text>
          <Typography.Text>Caminho armazenado: {detail.caminhoArquivo ?? 'Nao aplicavel'}</Typography.Text>
          {detail.mensagemErro ? <Typography.Text type="danger">Erro: {detail.mensagemErro}</Typography.Text> : null}
        </Space>
      </Card>

      <Card>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5}>Texto bruto</Typography.Title>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {detail.textoBruto ?? 'Importacao sem texto bruto. Consulte os metadados do arquivo.'}
            </Typography.Paragraph>
          </div>

          <div>
            <Typography.Title level={5}>Observacao da revisao</Typography.Title>
            <Input.TextArea
              rows={3}
              placeholder="Registrar contexto manual da confirmacao ou rejeicao"
              value={reviewObservation}
              onChange={(event) => setReviewObservation(event.target.value)}
            />
          </div>

          <Button loading={saving} onClick={() => void executeReviewAction(() => importacoesWhatsappApi.reprocessar(detail.id))}>
            Reprocessar importacao
          </Button>
        </Space>
      </Card>

      <AppDataTable<ItemImportadoWhatsapp>
        rowKey="id"
        dataSource={detail.itens}
        emptyMessage="Nenhuma sugestao foi gerada para esta importacao."
        columns={[
          { title: 'Tipo', dataIndex: 'tipoSugestaoNome', key: 'tipoSugestaoNome' },
          {
            title: 'Status',
            key: 'status',
            render: (_value, record) => <Tag>{record.statusNome}</Tag>
          },
          {
            title: 'Payload sugerido',
            key: 'payloadSugeridoJson',
            render: (_value, record) => (
              <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {formatPayload(record.payloadSugeridoJson)}
              </Typography.Paragraph>
            )
          },
          {
            title: 'Acoes',
            key: 'acoes',
            render: (_value, record) =>
              record.statusCodigo === 'SUGERIDO' ? (
                <Space wrap>
                  <Button
                    type="primary"
                    size="small"
                    loading={saving}
                    onClick={() =>
                      void executeReviewAction(() =>
                        importacoesWhatsappApi.confirmarItem(record.id, {
                          observacao: reviewObservation.trim() === '' ? null : reviewObservation.trim()
                        })
                      )
                    }
                  >
                    Confirmar
                  </Button>
                  <Button
                    danger
                    size="small"
                    loading={saving}
                    onClick={() =>
                      void executeReviewAction(() =>
                        importacoesWhatsappApi.rejeitarItem(record.id, {
                          observacao: reviewObservation.trim() === '' ? null : reviewObservation.trim()
                        })
                      )
                    }
                  >
                    Rejeitar
                  </Button>
                </Space>
              ) : (
                record.observacao ?? '-'
              )
          }
        ]}
      />

      <Button>
        <Link to="/importacoes-whatsapp">Voltar para importacoes</Link>
      </Button>
    </Space>
  );
}
