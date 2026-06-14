import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { ImportacaoFaturaItemPreview } from '../../services/http/financeiro-api';
import type { CartaoResumo, ContaGerencialResumo, FormaPagamentoResumo, PessoaResumo } from '../../types/cadastros';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export function ImportarFaturaPage() {
  const [cartoes, setCartoes] = useState<CartaoResumo[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoResumo[]>([]);
  const [pessoas, setPessoas] = useState<PessoaResumo[]>([]);
  const [contasGerenciais, setContasGerenciais] = useState<ContaGerencialResumo[]>([]);

  const [cartaoId, setCartaoId] = useState<string | undefined>();
  const [formaPagamentoId, setFormaPagamentoId] = useState<string | undefined>();
  const [recebedorPadraoId, setRecebedorPadraoId] = useState<string | undefined>();
  const [contaGerencialPadraoId, setContaGerencialPadraoId] = useState<string | undefined>();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportacaoFaturaItemPreview[] | null>(null);
  const [avisoFormato, setAvisoFormato] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [resultado, setResultado] = useState<{ criadas: number; duplicadas: number } | null>(null);

  const [msgApi, contextHolder] = message.useMessage();
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      cadastrosApi.cartoes.listar({ page: 1, pageSize: 100, ativo: true }),
      cadastrosApi.formasPagamento.listar({ page: 1, pageSize: 100, ehCartao: true, ativo: true }),
      cadastrosApi.pessoas.listar({ page: 1, pageSize: 200, ativo: true }),
      cadastrosApi.contasGerenciais.listar({
        page: 1,
        pageSize: 200,
        search: '',
        tipo: 'Despesa',
        ativo: true,
        aceitaLancamentos: true
      }),
    ]).then(([c, fp, p, cg]) => {
      setCartoes(c.items ?? []);
      setFormasPagamento(fp.items ?? []);
      setPessoas(p.items ?? []);
      setContasGerenciais(cg.items ?? []);
    });
  }, []);

  const configCompleta = !!cartaoId && !!formaPagamentoId && !!recebedorPadraoId && !!contaGerencialPadraoId;

  async function handleUpload(file: File) {
    if (!cartaoId) {
      msgApi.warning('Selecione o cartão antes de fazer o upload.');
      return false;
    }
    setArquivo(file);
    setPreview(null);
    setResultado(null);
    setSelecionados(new Set());
    setLoadingPreview(true);

    try {
      const resp = await financeiroApi.faturas.importar.preview(cartaoId, file);
      setPreview(resp.itens);
      setAvisoFormato(resp.avisoFormato);

      // Pré-seleciona apenas os itens não duplicados
      const novos = new Set(
        resp.itens.filter(i => !i.jaImportado).map(i => i.chaveImportacao)
      );
      setSelecionados(novos);

      setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      msgApi.error('Erro ao processar o arquivo. Verifique se é um CSV válido.');
    } finally {
      setLoadingPreview(false);
    }
    return false; // impede upload automático do Ant Design
  }

  async function handleConfirmar() {
    if (!cartaoId || !formaPagamentoId || !recebedorPadraoId || !contaGerencialPadraoId || !preview) return;

    const itensSelecionados = preview.filter(i => selecionados.has(i.chaveImportacao));
    if (itensSelecionados.length === 0) {
      msgApi.warning('Selecione ao menos um item para importar.');
      return;
    }

    setLoadingConfirmar(true);
    try {
      const resp = await financeiroApi.faturas.importar.confirmar({
        cartaoId,
        formaPagamentoId,
        recebedorPadraoId,
        contaGerencialPadraoId,
        itens: itensSelecionados.map(i => ({
          dataTransacao: i.dataTransacao,
          descricao: i.descricao,
          valor: i.valor,
          chaveImportacao: i.chaveImportacao,
        })),
      });
      setResultado({ criadas: resp.contasCriadas, duplicadas: resp.contasDuplicadas });
      setPreview(null);
      setArquivo(null);
      setSelecionados(new Set());
    } catch {
      msgApi.error('Erro ao confirmar a importação.');
    } finally {
      setLoadingConfirmar(false);
    }
  }

  const itensSelecionadosCount = selecionados.size;
  const totalSelecionado = preview
    ?.filter(i => selecionados.has(i.chaveImportacao))
    .reduce((s, i) => s + i.valor, 0) ?? 0;

  const columns: TableColumnsType<ImportacaoFaturaItemPreview> = [
    {
      title: '',
      key: 'sel',
      width: 40,
      render: (_, row) => (
        <Checkbox
          checked={selecionados.has(row.chaveImportacao)}
          disabled={row.jaImportado}
          onChange={e => {
            const next = new Set(selecionados);
            if (e.target.checked) next.add(row.chaveImportacao);
            else next.delete(row.chaveImportacao);
            setSelecionados(next);
          }}
        />
      ),
    },
    {
      title: 'Data',
      dataIndex: 'dataTransacao',
      width: 110,
      render: v => formatDateBR(v),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      ellipsis: true,
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      width: 130,
      align: 'right',
      render: v => formatCurrencyBRL(v),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, row) =>
        row.jaImportado ? (
          <Tag color="default">Já importado</Tag>
        ) : (
          <Tag color="green">Novo</Tag>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {contextHolder}

      <Title level={3} style={{ marginBottom: 24 }}>
        Importar fatura de cartão
      </Title>

      {/* ── Configuração ── */}
      <div style={{ background: 'var(--color-surface-container)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>1. Configuração</Title>
        <Space orientation="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Cartão</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Selecione o cartão da fatura"
              value={cartaoId}
              onChange={v => { setCartaoId(v); setPreview(null); setArquivo(null); }}
              options={cartoes.map(c => ({ value: c.id, label: `${c.nome} •••• ${c.numeroFinal}` }))}
            />
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Forma de pagamento (do cartão)</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Ex: Cartão de crédito Nubank"
              value={formaPagamentoId}
              onChange={setFormaPagamentoId}
              options={formasPagamento.map(f => ({ value: f.id, label: f.nome }))}
            />
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Recebedor padrão</Text>
            <Select
              showSearch
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              placeholder="Pessoa/fornecedor padrão para os lançamentos"
              value={recebedorPadraoId}
              onChange={setRecebedorPadraoId}
              options={pessoas.map(p => ({ value: p.id, label: p.nome }))}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Usado quando a descrição da compra não corresponde a nenhuma pessoa cadastrada.
            </Text>
          </div>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Conta gerencial padrão</Text>
            <Select
              showSearch
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              placeholder="Conta de despesa para ratear os lançamentos"
              value={contaGerencialPadraoId}
              onChange={setContaGerencialPadraoId}
              options={contasGerenciais.map(c => ({
                value: c.id,
                label: c.codigo ? `${c.codigo} - ${c.descricao}` : c.descricao
              }))}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Usada para classificar os itens importados no dashboard gerencial.
            </Text>
          </div>
        </Space>
      </div>

      {/* ── Upload ── */}
      <div style={{ background: 'var(--color-surface-container)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>2. Arquivo CSV da fatura</Title>

        <Dragger
          accept=".pdf,.csv,.txt"
          multiple={false}
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={!cartaoId || loadingPreview}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {arquivo ? arquivo.name : 'Clique ou arraste a fatura aqui'}
          </p>
          <p className="ant-upload-hint">
            Aceita PDF ou CSV — Nubank, Bradesco, Itaú, Inter, Santander e outros bancos brasileiros.
            {!cartaoId && <strong> Selecione o cartão primeiro.</strong>}
          </p>
        </Dragger>

        {loadingPreview && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin tip="Lendo arquivo..." />
          </div>
        )}

        {avisoFormato && (
          <Alert type="warning" message={avisoFormato} style={{ marginTop: 12 }} showIcon />
        )}
      </div>

      {/* ── Preview ── */}
      {preview && (
        <div ref={tableRef} style={{ background: 'var(--color-surface-container)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>3. Revisar e confirmar</Title>
            <Space>
              <Button
                size="small"
                onClick={() => setSelecionados(new Set(preview.filter(i => !i.jaImportado).map(i => i.chaveImportacao)))}
              >
                Selecionar novos
              </Button>
              <Button size="small" onClick={() => setSelecionados(new Set())}>
                Limpar seleção
              </Button>
            </Space>
          </div>

          <Table
            dataSource={preview}
            columns={columns}
            rowKey="chaveImportacao"
            size="small"
            pagination={preview.length > 20 ? { pageSize: 20 } : false}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>{itensSelecionadosCount} item(ns) selecionado(s)</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={2} align="right">
                  <Text strong>{formatCurrencyBRL(totalSelecionado)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            )}
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              loading={loadingConfirmar}
              disabled={!configCompleta || itensSelecionadosCount === 0}
              onClick={handleConfirmar}
            >
              Importar {itensSelecionadosCount > 0 ? `${itensSelecionadosCount} lançamento(s)` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* ── Resultado ── */}
      {resultado && (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
          message={`Importação concluída: ${resultado.criadas} lançamento(s) criado(s)${resultado.duplicadas > 0 ? `, ${resultado.duplicadas} ignorado(s) por já existirem` : ''}.`}
          description="Os lançamentos foram adicionados como contas a pagar. A fatura do cartão será atualizada automaticamente."
          style={{ marginBottom: 24 }}
        />
      )}
    </div>
  );
}
