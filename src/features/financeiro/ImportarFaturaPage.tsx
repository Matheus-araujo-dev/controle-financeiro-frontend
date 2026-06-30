import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Select,
  Space,
  Spin,
  Tag,
  message,
} from 'antd';
import { Tooltip } from '../../components/ui/Tooltip';
import { InboxOutlined, CheckCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { ImportacaoFaturaItemPreview } from '../../services/http/financeiro-api';
import { agenteApi } from '../../services/http/agente-api';
import type { CartaoResumo, ContaGerencialResumo, FormaPagamentoResumo, PessoaResumo } from '../../types/cadastros';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';

const { Dragger } = Upload;

interface ItemCategoria {
  contaGerencialId: string | null;
  contaGerencialDescricao: string | null;
  confianca: number;
  fonte: 'ia' | 'usuario';
}

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
  const [categorizacoes, setCategorizacoes] = useState<Record<string, ItemCategoria>>({});
  const [loadingCategorizacao, setLoadingCategorizacao] = useState(false);

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
        page: 1, pageSize: 200, search: '', tipo: 'Despesa', ativo: true, aceitaLancamentos: true
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
      void msgApi.warning('Selecione o cartão antes de fazer o upload.');
      return false;
    }
    setArquivo(file);
    setPreview(null);
    setResultado(null);
    setSelecionados(new Set());
    setCategorizacoes({});
    setLoadingPreview(true);

    try {
      const resp = await financeiroApi.faturas.importar.preview(cartaoId, file);
      setPreview(resp.itens);
      setAvisoFormato(resp.avisoFormato);
      const novos = new Set(resp.itens.filter(i => !i.jaImportado).map(i => i.chaveImportacao));
      setSelecionados(novos);
      setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Categorização IA em background
      const descricoes = resp.itens.filter(i => !i.jaImportado).map(i => i.descricao);
      if (descricoes.length > 0) {
        setLoadingCategorizacao(true);
        agenteApi.categorizar(descricoes).then((catResp) => {
          const map: Record<string, ItemCategoria> = {};
          resp.itens.filter(i => !i.jaImportado).forEach((item, idx) => {
            const cat = catResp.itens[idx];
            if (cat?.contaGerencialId) {
              map[item.chaveImportacao] = {
                contaGerencialId: cat.contaGerencialId,
                contaGerencialDescricao: cat.contaGerencialDescricao,
                confianca: cat.confianca,
                fonte: 'ia'
              };
            }
          });
          setCategorizacoes(map);
        }).catch(() => { /* sem categorização IA */ }).finally(() => setLoadingCategorizacao(false));
      }
    } catch {
      void msgApi.error('Erro ao processar o arquivo.');
    } finally {
      setLoadingPreview(false);
    }
    return false;
  }

  async function handleConfirmar() {
    if (!cartaoId || !formaPagamentoId || !recebedorPadraoId || !contaGerencialPadraoId || !preview) return;
    const itensSelecionados = preview.filter(i => selecionados.has(i.chaveImportacao));
    if (itensSelecionados.length === 0) {
      void msgApi.warning('Selecione ao menos um item para importar.');
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
          contaGerencialId: categorizacoes[i.chaveImportacao]?.contaGerencialId ?? undefined,
        })),
      });
      setResultado({ criadas: resp.contasCriadas, duplicadas: resp.contasDuplicadas });
      setPreview(null);
      setArquivo(null);
      setSelecionados(new Set());
      setCategorizacoes({});
    } catch {
      void msgApi.error('Erro ao confirmar a importação.');
    } finally {
      setLoadingConfirmar(false);
    }
  }

  const itensSelecionadosCount = selecionados.size;
  const totalSelecionado = preview?.filter(i => selecionados.has(i.chaveImportacao)).reduce((s, i) => s + i.valor, 0) ?? 0;

  const columns: TableColumnsType<ImportacaoFaturaItemPreview> = [
    {
      title: '',
      key: 'sel',
      width: 40,
      sorter: false,
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
    { title: 'Data', dataIndex: 'dataTransacao', width: 100, render: v => formatDateBR(String(v)) },
    { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
    { title: 'Valor', dataIndex: 'valor', width: 120, align: 'right', render: v => formatCurrencyBRL(Number(v)) },
    {
      title: (
        <span className="flex items-center gap-1">
          Categoria
          {loadingCategorizacao ? <Spin size="small" /> : <RobotOutlined style={{ opacity: 0.5 }} />}
        </span>
      ),
      key: 'categoria',
      width: 200,
      sorter: false,
      render: (_, row) => {
        if (row.jaImportado) return null;
        const cat = categorizacoes[row.chaveImportacao];
        return (
          <div className="flex flex-col gap-1">
            {cat && (
              <Tooltip content={`Sugestão IA — confiança ${Math.round(cat.confianca * 100)}%`}>
                <Tag
                  color={cat.confianca >= 0.8 ? 'green' : 'orange'}
                  icon={<RobotOutlined />}
                  style={{ cursor: 'default', fontSize: 11 }}
                >
                  {cat.contaGerencialDescricao}
                </Tag>
              </Tooltip>
            )}
            <Select
              size="small"
              variant="borderless"
              placeholder="Sobrescrever..."
              value={cat?.fonte === 'usuario' ? cat.contaGerencialId : undefined}
              style={{ width: '100%' }}
              showSearch
              allowClear
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={contasGerenciais.map(c => ({ value: c.id, label: c.descricao }))}
              onChange={(val, opt) => {
                const next = { ...categorizacoes };
                if (val) {
                  const label = Array.isArray(opt) ? opt[0]?.label : (opt as { label: string })?.label;
                  next[row.chaveImportacao] = { contaGerencialId: val, contaGerencialDescricao: label ?? val, confianca: 1, fonte: 'usuario' };
                } else {
                  delete next[row.chaveImportacao];
                }
                setCategorizacoes(next);
              }}
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      sorter: false,
      render: (_, row) =>
        row.jaImportado ? <Tag color="default">Já importado</Tag> : <Tag color="green">Novo</Tag>,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {contextHolder}

      <p className="text-sm text-on-surface-variant">
        Importa CSV, PDF ou OFX de cartão de crédito. A IA categoriza automaticamente cada transação.
      </p>

      {/* Configuração */}
      <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-base">settings</span>
          </div>
          <span className="font-bold text-on-surface">1. Configuração</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1 block">Cartão</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Selecione o cartão"
              value={cartaoId}
              onChange={v => { setCartaoId(v); setPreview(null); setArquivo(null); }}
              options={cartoes.map(c => ({ value: c.id, label: `${c.nome} •••• ${c.numeroFinal}` }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1 block">Forma de pagamento</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Ex: Cartão Nubank"
              value={formaPagamentoId}
              onChange={setFormaPagamentoId}
              options={formasPagamento.map(f => ({ value: f.id, label: f.nome }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1 block">Recebedor padrão</label>
            <Select
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
              placeholder="Pessoa/fornecedor padrão"
              value={recebedorPadraoId}
              onChange={setRecebedorPadraoId}
              options={pessoas.map(p => ({ value: p.id, label: p.nome }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1 block">Categoria padrão (fallback)</label>
            <Select
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
              placeholder="Usada quando IA não categorizar"
              value={contaGerencialPadraoId}
              onChange={setContaGerencialPadraoId}
              options={contasGerenciais.map(c => ({ value: c.id, label: c.codigo ? `${c.codigo} - ${c.descricao}` : c.descricao }))}
            />
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-base">upload_file</span>
          </div>
          <span className="font-bold text-on-surface">2. Arquivo da fatura</span>
        </div>

        <Dragger
          accept=".pdf,.csv,.txt,.ofx"
          multiple={false}
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={!cartaoId || loadingPreview}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">
            {arquivo ? arquivo.name : 'Clique ou arraste a fatura aqui'}
          </p>
          <p className="ant-upload-hint">
            Aceita PDF, CSV e OFX — Nubank, Bradesco, Itaú, Inter, Santander e outros.
            {!cartaoId && <strong> Selecione o cartão primeiro.</strong>}
          </p>
        </Dragger>

        {loadingPreview && <div className="text-center mt-4"><Spin tip="Lendo arquivo..." /></div>}
        {avisoFormato && <Alert type="warning" message={avisoFormato} style={{ marginTop: 12 }} showIcon />}
      </div>

      {/* Preview */}
      {preview && (
        <div ref={tableRef} className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-base">fact_check</span>
              </div>
              <span className="font-bold text-on-surface">3. Revisar e confirmar</span>
              {loadingCategorizacao && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Spin size="small" /> IA categorizando...
                </span>
              )}
            </div>
            <Space>
              <Button size="small" onClick={() => setSelecionados(new Set(preview.filter(i => !i.jaImportado).map(i => i.chaveImportacao)))}>
                Selecionar novos
              </Button>
              <Button size="small" onClick={() => setSelecionados(new Set())}>Limpar</Button>
            </Space>
          </div>

          <AppDataTable
            dataSource={preview}
            columns={columns}
            rowKey="chaveImportacao"
            size="small"
            pagination={false}
          />

          <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/5 bg-surface-container px-4 py-3 text-sm font-bold text-on-surface sm:flex-row sm:items-center sm:justify-between">
            <span>{itensSelecionadosCount} item(ns) selecionado(s)</span>
            <span>{formatCurrencyBRL(totalSelecionado)}</span>
          </div>

          <div className="mt-4 text-right">
            <Button
              type="primary"
              size="large"
              loading={loadingConfirmar}
              disabled={!configCompleta || itensSelecionadosCount === 0}
              onClick={() => void handleConfirmar()}
            >
              Importar {itensSelecionadosCount > 0 ? `${itensSelecionadosCount} lançamento(s)` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
          message={`Importação concluída: ${resultado.criadas} lançamento(s) criado(s)${resultado.duplicadas > 0 ? `, ${resultado.duplicadas} ignorado(s) por duplicidade` : ''}.`}
          description="Os lançamentos foram adicionados como contas a pagar."
        />
      )}
    </div>
  );
}
