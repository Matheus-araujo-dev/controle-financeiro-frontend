import { useEffect, useRef, useState } from 'react';
import { Checkbox, Select, Tag } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import { ComboBox } from '../../components/forms/ComboBox';
import { Button } from '../../components/ui/Button';
import { formLabelClass } from '../../components/forms/FormPrimitives';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { ImportacaoFaturaItemPreview } from '../../services/http/financeiro-api';
import { agenteApi } from '../../services/http/agente-api';
import type { CartaoResumo, ContaGerencialResumo, PessoaResumo } from '../../types/cadastros';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { notify } from '../../store/notification-store';
import { Tooltip } from '../../components/ui/Tooltip';
import { QuickAddCartaoModal } from '../cadastros/quick-add/QuickAddCartaoModal';
import { QuickAddPessoaModal } from '../cadastros/quick-add/QuickAddPessoaModal';

const { Dragger } = Upload;

interface ItemCategoria {
  contaGerencialId: string | null;
  contaGerencialDescricao: string | null;
  confianca: number;
  fonte: 'ia' | 'usuario';
}

type Opt = { value: string; label: string };

function mergeOpt(list: Opt[], next: Opt): Opt[] {
  return [next, ...list.filter(o => o.value !== next.value)];
}

export function ImportarFaturaPage() {
  const [cartoes, setCartoes] = useState<CartaoResumo[]>([]);
  const [pessoas, setPessoas] = useState<PessoaResumo[]>([]);
  const [contasGerenciais, setContasGerenciais] = useState<ContaGerencialResumo[]>([]);
  const [extraCartoes, setExtraCartoes] = useState<Opt[]>([]);
  const [extraPessoas, setExtraPessoas] = useState<Opt[]>([]);

  const [cartaoId, setCartaoId] = useState('');
  const [recebedorPadraoId, setRecebedorPadraoId] = useState('');

  const [quickAddCartaoOpen, setQuickAddCartaoOpen] = useState(false);
  const [quickAddPessoaOpen, setQuickAddPessoaOpen] = useState(false);

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
    });
  }, []);

  const cartaoOptions: Opt[] = [
    ...extraCartoes,
    ...cartoes
      .map(c => ({ value: c.id, label: `${c.nome}${c.numeroFinal ? ` •••• ${c.numeroFinal}` : ''}` }))
      .filter(o => !extraCartoes.some(e => e.value === o.value)),
  ];

  const pessoaOptions: Opt[] = [
    ...extraPessoas,
    ...pessoas
      .map(p => ({ value: p.id, label: p.nome }))
      .filter(o => !extraPessoas.some(e => e.value === o.value)),
  ];

  function handleCartaoSuccess(newId: string, label: string) {
    setExtraCartoes(prev => mergeOpt(prev, { value: newId, label }));
    setCartaoId(newId);
    setQuickAddCartaoOpen(false);
  }

  function handlePessoaSuccess(newId: string, label: string) {
    setExtraPessoas(prev => mergeOpt(prev, { value: newId, label }));
    setRecebedorPadraoId(newId);
    setQuickAddPessoaOpen(false);
  }

  const configCompleta = !!cartaoId && !!recebedorPadraoId;

  async function handleUpload(file: File) {
    if (!cartaoId) {
      notify('warning', 'Selecione o cartão antes de fazer o upload.');
      return false;
    }
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
                fonte: 'ia',
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
    if (itensSelecionados.length === 0) {
      notify('warning', 'Selecione ao menos um item para importar.');
      return;
    }
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
    } catch {
      setErrorMsg('Erro ao confirmar a importação. Tente novamente.');
    } finally {
      setLoadingConfirmar(false);
    }
  }

  const itensSelecionadosCount = selecionados.size;
  const totalSelecionado =
    preview?.filter(i => selecionados.has(i.chaveImportacao)).reduce((s, i) => s + i.valor, 0) ?? 0;

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
          {loadingCategorizacao ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <RobotOutlined style={{ opacity: 0.5 }} />
          )}
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
                  next[row.chaveImportacao] = {
                    contaGerencialId: val,
                    contaGerencialDescricao: label ?? val,
                    confianca: 1,
                    fonte: 'usuario',
                  };
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-sm text-on-surface-variant">
        Importa CSV, PDF ou OFX de cartão de crédito. A IA categoriza automaticamente cada transação.
      </p>

      {/* Configuração */}
      <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          </div>
          <span className="font-bold text-on-surface">1. Configuração</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={formLabelClass}>
              Cartão <span className="text-error">*</span>
            </label>
            <ComboBox
              aria-label="Cartão"
              value={cartaoId || null}
              onChange={v => { setCartaoId(v); setPreview(null); setArquivo(null); }}
              options={cartaoOptions}
              placeholder="Selecione o cartão..."
              onAddNew={() => setQuickAddCartaoOpen(true)}
              addNewLabel="Novo cartão"
            />
          </div>

          <div className="space-y-2">
            <label className={formLabelClass}>
              Recebedor padrão <span className="text-error">*</span>
            </label>
            <ComboBox
              aria-label="Recebedor padrão"
              value={recebedorPadraoId || null}
              onChange={setRecebedorPadraoId}
              options={pessoaOptions}
              placeholder="Fornecedor / loja padrão..."
              onAddNew={() => setQuickAddPessoaOpen(true)}
              addNewLabel="Nova pessoa"
            />
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
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
          <p className="ant-upload-drag-icon"><span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span></p>
          <p className="ant-upload-text">
            {arquivo ? arquivo.name : 'Clique ou arraste a fatura aqui'}
          </p>
          <p className="ant-upload-hint">
            Aceita PDF, CSV e OFX — Nubank, Bradesco, Itaú, Inter, Santander e outros.
            {!cartaoId && <strong> Selecione o cartão primeiro.</strong>}
          </p>
        </Dragger>

        {loadingPreview && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-on-surface-variant">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Lendo arquivo e extraindo transações...
          </div>
        )}

        {avisoFormato && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
            <span className="material-symbols-outlined text-base mt-0.5 shrink-0">warning</span>
            {avisoFormato}
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            <span className="material-symbols-outlined text-base mt-0.5 shrink-0">error</span>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div ref={tableRef} className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
              </div>
              <span className="font-bold text-on-surface">3. Revisar e confirmar</span>
              {loadingCategorizacao && (
                <span className="flex items-center gap-1.5 text-xs text-primary">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  IA categorizando...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelecionados(new Set(preview.filter(i => !i.jaImportado).map(i => i.chaveImportacao)))}
              >
                Selecionar novos
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelecionados(new Set())}
              >
                Limpar
              </Button>
            </div>
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

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              size="lg"
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
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-on-surface">
          <span className="material-symbols-outlined text-xl text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="font-bold text-primary">Importação concluída</p>
            <p className="text-on-surface-variant mt-0.5">
              {resultado.criadas} lançamento(s) criado(s){resultado.duplicadas > 0 ? `, ${resultado.duplicadas} ignorado(s) por duplicidade` : ''}.
              Os lançamentos foram adicionados como contas a pagar.
            </p>
          </div>
        </div>
      )}

      <QuickAddCartaoModal
        open={quickAddCartaoOpen}
        onClose={() => setQuickAddCartaoOpen(false)}
        onSuccess={handleCartaoSuccess}
      />

      <QuickAddPessoaModal
        open={quickAddPessoaOpen}
        onClose={() => setQuickAddPessoaOpen(false)}
        onSuccess={handlePessoaSuccess}
        defaultRole="recebedor"
      />
    </div>
  );
}
