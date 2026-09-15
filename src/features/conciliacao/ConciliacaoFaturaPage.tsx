import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Checkbox } from 'antd';
import { Button } from '../../components/ui/Button';
import { PageState } from '../../components/states/PageState';
import { conciliacaoFaturaApi } from '../../services/http/conciliacao-fatura-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { getApiErrorMessage } from '../../services/http/api-error';
import { contasPagarModuleConfig, contasReceberModuleConfig } from '../financeiro/module-config';
import type { ConciliacaoFatura } from '../../types/conciliacao-fatura';
import { formatCurrencyBRL } from '../../shared/currency';
import { ConciliacaoFaturaGrid } from './ConciliacaoFaturaGrid';
import { criarCamposGrade } from './ConciliacaoFaturaCampos';
import { ConciliacaoFaturaLote } from './ConciliacaoFaturaLote';
import { criarRascunho, montarCriacao, montarReembolso, type RascunhoLancamento } from './conciliacao-fatura-form';

export function ConciliacaoFaturaPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<ConciliacaoFatura>();
  const [rows, setRows] = useState<Record<string, RascunhoLancamento>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mostrarReembolsos, setMostrarReembolsos] = useState(false);
  const { data, isLoading, error: loadError } = useQuery({ queryKey: ['conciliacao-fatura-options', id], enabled: !!id, queryFn: async () => {
    const [fatura, revisoes, recebedores, responsaveis, pagadores, formas, despesas, receitas] = await Promise.all([
      financeiroApi.faturas.obterPorId(id!), conciliacaoFaturaApi.listar(id!), contasPagarModuleConfig.loadPessoaOptions(),
      contasPagarModuleConfig.loadResponsavelOptions(), contasReceberModuleConfig.loadPessoaOptions(), contasPagarModuleConfig.loadFormaPagamentoOptions(),
      contasPagarModuleConfig.loadRateioOptions(), contasReceberModuleConfig.loadRateioOptions()
    ]);
    return { fatura, revisoes, recebedores, responsaveis, pagadores, formas, despesas, receitas };
  } });
  function carregar(review: ConciliacaoFatura) {
    const forma = review.contasSistema[0]?.formaPagamentoId ?? data?.formas.find(f => f.ehCartao)?.value ?? '';
    const drafts = Object.fromEntries(review.itens.map(item => [item.id, criarRascunho(item, data!.fatura.dataVencimento, forma)]));
    setSession(review); setRows(drafts); setMostrarReembolsos(Object.values(drafts).some(r => r.gerarReembolso)); setMessage('');
  }
  async function abrir(sessionId: string) {
    setBusy(true); setError('');
    try { carregar(await conciliacaoFaturaApi.obter(id!, sessionId)); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  }
  async function importar(file: File) {
    setBusy(true); setError('');
    try { carregar(await conciliacaoFaturaApi.iniciar(id!, file)); await queryClient.invalidateQueries({ queryKey: ['conciliacao-fatura-options', id] }); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  }
  function update(itemId: string, patch: Partial<RascunhoLancamento>) { setRows(current => ({ ...current, [itemId]: { ...current[itemId], ...patch } })); setMessage('Alterações ainda não salvas.'); }
  async function salvar() {
    if (!session) return;
    setBusy(true); setError('');
    const failures: string[] = [];
    for (const item of session.itens.filter(x => x.status === 'Pendente')) {
      try {
        const result = await conciliacaoFaturaApi.salvarRascunho(id!, session.id, item.id, rows[item.id], item.atualizadoEmUtc!);
        setSession(current => current && ({ ...current, itens: current.itens.map(x => x.id === item.id ? { ...x, atualizadoEmUtc: result.atualizadoEmUtc, rascunho: rows[item.id] } : x) }));
      } catch (e) { failures.push(`${item.descricaoOriginal}: ${getApiErrorMessage(e)}`); }
    }
    setError(failures.join(' / ')); setMessage(failures.length ? 'Algumas linhas não foram salvas.' : 'Rascunho salvo. Nenhuma conta foi criada.'); setBusy(false);
  }
  async function confirmar(action: () => Promise<void>) {
    try {
      await action();
      setSession(await conciliacaoFaturaApi.obter(id!, session!.id));
      void queryClient.invalidateQueries({ queryKey: ['faturas'] });
    } catch (e) { throw new Error(getApiErrorMessage(e), { cause: e }); }
  }
  if (isLoading) return <PageState state="loading" />;
  if (loadError || !data || !id) return <PageState state="error" title="Não foi possível carregar a fatura" subtitle={getApiErrorMessage(loadError)} />;
  const semVinculo = session?.contasSistema.filter(c => !session.itens.some(i => i.contaPagarVinculadaId === c.id)) ?? [];
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-headline text-2xl font-bold">Conciliar fatura</h1><p className="text-on-surface-variant">{data.fatura.cartaoNome}</p></div>
      <Link to={`/faturas/${id}`}><Button variant="secondary">Voltar à fatura</Button></Link></div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm">PDF do cartão <input aria-label="PDF da fatura" type="file" accept=".pdf,application/pdf" disabled={busy}
        onChange={e => { const file = e.target.files?.[0]; if (file) void importar(file); e.target.value = ''; }} /></label>
      {!session && data.revisoes.map(r => <Button key={r.id} variant="secondary" disabled={busy} onClick={() => void abrir(r.id)}>Retomar {r.nomeArquivo}</Button>)}
      {session && <><Button variant="secondary" disabled={busy} onClick={() => void salvar()}>Salvar rascunho</Button>
        <Checkbox checked={mostrarReembolsos} disabled={busy} onChange={e => setMostrarReembolsos(e.target.checked)}>Editar reembolsos em lote</Checkbox></>}
    </div>
    {error && <p role="alert" className="text-error">{error}</p>}
    {message && <p role="status" className="text-sm text-on-surface-variant">{message}</p>}
    {session && <>
      <div className="flex flex-wrap gap-5 text-sm"><span>Lançamentos do PDF: {formatCurrencyBRL(session.itens.reduce((s, i) => s + i.valor, 0))}</span>
        <span>Contas da fatura: {formatCurrencyBRL(session.contasSistema.reduce((s, c) => s + c.valor, 0))}</span>
        <span>Pendentes: {session.itens.filter(i => i.status === 'Pendente').length}</span></div>
      <ConciliacaoFaturaGrid key={session.id} session={session} disabled={busy} onBusyChange={setBusy}
        onEscolha={(itemId, escolha) => update(itemId, escolha)}
        campos={criarCamposGrade(rows, data, update, mostrarReembolsos, { faturaId: id, sessionId: session.id })}
        toolbar={(ids, saving) => <ConciliacaoFaturaLote ids={ids} options={data} disabled={saving || busy} onApply={(selected, transform) => {
          setRows(current => Object.fromEntries(Object.entries(current).map(([key, row]) => [key, selected.includes(key) ? transform(row) : row])));
          setMessage('Alterações ainda não salvas.');
        }} />}
        onConfirmar={(itemId, request) => confirmar(() => conciliacaoFaturaApi.vincular(id, session.id, itemId,
          { ...request, aprender: rows[itemId].aprender, camposParaAprender: rows[itemId].camposParaAprender,
            reembolso: session.contasSistema.find(c => c.id === request.contaPagarId)?.grupoReembolsoId ? null : montarReembolso(rows[itemId]) }))}
        onCriar={itemId => confirmar(() => conciliacaoFaturaApi.criar(id, session.id, itemId, montarCriacao(session.itens.find(i => i.id === itemId)!, rows[itemId])))}
        onIgnorar={itemId => confirmar(() => conciliacaoFaturaApi.ignorar(id, session.id, itemId))} />
      <section className="space-y-2 rounded-2xl bg-surface-container-low p-4"><h2 className="font-bold">Ainda sem vínculo no sistema ({semVinculo.length})</h2>
        {semVinculo.map(c => <p key={c.id}><Link className="text-primary" to={`/contas-pagar/${c.id}`}>{c.descricao}</Link> · {formatCurrencyBRL(c.valor)}</p>)}
        {!semVinculo.length && <p className="text-sm text-on-surface-variant">Todos os lançamentos do sistema estão vinculados.</p>}
      </section>
    </>}
  </div>;
}
