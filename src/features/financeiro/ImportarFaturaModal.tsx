import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd';
import { CheckCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { ImportacaoFaturaItemPreview } from '../../services/http/financeiro-api';
import { agenteApi } from '../../services/http/agente-api';
import type { CartaoResumo, ContaGerencialResumo, PessoaResumo } from '../../types/cadastros';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { Tooltip } from '../../components/ui/Tooltip';

const { Dragger } = Upload;

interface ItemCategoria {
  contaGerencialId: string | null;
  contaGerencialDescricao: string | null;
  confianca: number;
  fonte: 'ia' | 'usuario';
}

interface ImportarFaturaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCartaoId?: string;
}

export function ImportarFaturaModal({ open, onClose, onSuccess, initialCartaoId }: ImportarFaturaModalProps) {
  const [cartoes, setCartoes] = useState<CartaoResumo[]>([]);
  const [pessoas, setPessoas] = useState<PessoaResumo[]>([]);
  const [contasGerenciais, setContasGerenciais] = useState<ContaGerencialResumo[]>([]);

  const [cartaoId, setCartaoId] = useState<string | undefined>(initialCartaoId);
  const [recebedorPadraoId, setRecebedorPadraoId] = useState<string | undefined>();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportacaoFaturaItemPreview[] | null>(null);
  const [avisoFormato, setAvisoFormato] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [categorizacoes, setCategorizacoes] = useState<Record<string, ItemCategoria>>({});
  const [loadingCategorizacao, setLoadingCategorizacao] = useState(false);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [resultado, setResultado] = useState<{ criadas: number; duplicadas: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      cadastrosApi.cartoes.listar({ page: 1, pageSize: 100, ativo: true }),
      cadastrosApi.pessoas.listar({ page: 1, pageSize: 200, ativo: true }),
      cadastrosApi.contasGerenciais.listar({
        page: 1, pageSize: 200, search: '', tipo: 'Despesa', ativo: true, aceitaLancamentos: true
      }),
    ]).then(([c, p, cg]) => {
      setCartoes(c.items ?? []);
      setPessoas(p.items ?? []);
      setContasGerenciais(cg.items ?? []);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open) setCartaoId(initialCartaoId);
  }, [open, initialCartaoId]);

  function resetState() {
    setArquivo(null);
    setPreview(null);
    setAvisoFormato(null);
    setSelecionados(new Set());
    setCategorizacoes({});
    setResultado(null);
    setErrorMsg(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleUpload(file: File) {
    if (!cartaoId) return false;
    setArquivo(file);
    setPreview(null);
    setResultado(null);
    setSelecionados(new Set());
    setCategorizacoes({});
    setErrorMsg(null);
    setLoadingPreview(true);

    try {
      const resp = await financeiroApi.faturas.importar.preview(cartaoId, file);
      setPreview(resp.itens);
      setAvisoFormato(resp.avisoFormato);
      const novos = new Set(resp.itens.filter(i => !i.jaImportado).map(i => i.chaveImportacao));
      setSelecionados(novos);
      setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

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
        }).catch(() => {}).finally(() => setLoadingCategorizacao(false));
      }
    } catch {
      setErrorMsg('Erro ao processar o arquivo. Verifique se é um PDF, CSV ou OFX válido.');
    } finally {
      setLoadingPreview(false);
    }
    return false;
  }

  async function handleConfirmar() {
    if (!cartaoId || !recebedorPadraoId || !preview) return;
    const itensSelecionados = preview.filter(i => selecionados.has(i.chaveImportacao));
    if (itensSelecionados.length === 0) return;

    setLoadingConfirmar(true);
    setErrorMsg(null);
    try {
      const resp = await financeiroApi.faturas.importar.confirmar({
        cartaoId,
        recebedorPadraoId,
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
      onSuccess();
    } catch {
      setErrorMsg('Erro ao confirmar a importação. Tente novamente.');
    } finally {
      setLoadingConfirmar(false);
    }
  }

  const itensSelecionadosCount = selecionados.size;
  const totalSelecionado = preview?.filter(i => selecionados.has(i.chaveImportacao)).reduce((s, i) => s + i.valor, 0) ?? 0;
  const configCompleta = !!cartaoId && !!recebedorPadraoId;

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
    { title: 'Data', dataIndex: 'dataTransacao', width: 90, render: v => formatDateBR(String(v)) },
    { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
    { title: 'Valor', dataIndex: 'valor', width: 110, align: 'right', render: v => formatCurrencyBRL(Number(v)) },
    {
      title: (
        <span className="flex items-center gap-1">
          Categoria
          {loadingCategorizacao ? <Spin size="small" /> : <RobotOutlined style={{ opacity: 0.4 }} />}
        </span>
      ),
      key: 'categoria',
      width: 190,
      sorter: false,
      render: (_, row) => {
        if (row.jaImportado) return null;
        const cat = categorizacoes[row.chaveImportacao];
        return (
          <div className="flex flex-col gap-1">
            {cat && (
              <Tooltip content={`IA — confiança ${Math.round(cat.confianca * 100)}%`}>
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
      width: 100,
      sorter: false,
      render: (_, row) =>
        row.jaImportado ? <Tag color="default">Já importado</Tag> : <Tag color="green">Novo</Tag>,
    },
  ];

  const isWide = !!preview && preview.length > 0;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
          </div>
          <span className="font-bold text-on-surface">Importar Fatura PDF</span>
        </div>
      }
      footer={null}
      width={isWide ? 900 : 520}
      destroyOnHidden
    >
      <div className="space-y-5 pt-2">

        {/* Configuração: cartão + recebedor */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              Cartão <span className="text-error">*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Selecione o cartão"
              value={cartaoId}
              onChange={v => { setCartaoId(v); resetState(); }}
              options={cartoes.map(c => ({ value: c.id, label: `${c.nome}${c.numeroFinal ? ` •••• ${c.numeroFinal}` : ''}` }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              Recebedor padrão <span className="text-error">*</span>
            </label>
            <Select
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
              placeholder="Fornecedor / loja padrão"
              value={recebedorPadraoId}
              onChange={setRecebedorPadraoId}
              options={pessoas.map(p => ({ value: p.id, label: p.nome }))}
            />
          </div>
        </div>

        {/* Upload */}
        <Dragger
          accept=".pdf,.csv,.txt,.ofx"
          multiple={false}
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={!cartaoId || loadingPreview}
        >
          <p className="ant-upload-drag-icon">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
          </p>
          <p className="ant-upload-text">
            {arquivo ? arquivo.name : 'Clique ou arraste a fatura aqui'}
          </p>
          <p className="ant-upload-hint">
            PDF, CSV ou OFX — Nubank, Bradesco, Itaú, Inter, Santander e outros.
            {!cartaoId && <strong> Selecione o cartão primeiro.</strong>}
          </p>
        </Dragger>

        {loadingPreview && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-on-surface-variant">
            <Spin size="small" /> Lendo arquivo e extraindo transações...
          </div>
        )}

        {avisoFormato && <Alert type="warning" message={avisoFormato} showIcon />}
        {errorMsg && <Alert type="error" message={errorMsg} showIcon />}

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div ref={tableRef} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface">Revisar transações</span>
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

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container px-4 py-2 text-sm font-bold text-on-surface">
              <span>{itensSelecionadosCount} item(ns) selecionado(s)</span>
              <span>{formatCurrencyBRL(totalSelecionado)}</span>
            </div>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            message={`${resultado.criadas} lançamento(s) importado(s)${resultado.duplicadas > 0 ? `, ${resultado.duplicadas} ignorado(s) por duplicidade` : ''}.`}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
          <Button onClick={handleClose}>Fechar</Button>
          {preview && preview.length > 0 && !resultado && (
            <Button
              type="primary"
              loading={loadingConfirmar}
              disabled={!configCompleta || itensSelecionadosCount === 0}
              onClick={() => void handleConfirmar()}
            >
              Importar {itensSelecionadosCount > 0 ? `${itensSelecionadosCount} lançamento(s)` : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
