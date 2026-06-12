import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { PageState } from '../../components/states/PageState';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { formatCurrencyBRL } from '../../shared/currency';
import type {
  CompraPlanejadaResumo,
  CompraPlanejadaFilters,
  CompraPlanejadaListSummary,
  CompraPlanejadaStatus
} from '../../types/compras-planejadas';
import type { PagedResult } from '../../types/api';

type StatusFilter = CompraPlanejadaStatus | 'Todos';

function getPriorityBadge(prioridade: string) {
  switch (prioridade) {
    case 'Alta':
      return (
        <span className="bg-error text-on-error px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
          Prioridade Crítica
        </span>
      );
    case 'Media':
      return (
        <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
          Planejado
        </span>
      );
    default:
      return (
        <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
          Baixa Prioridade
        </span>
      );
  }
}

function getStatusLabel(status: CompraPlanejadaStatus) {
  switch (status) {
    case 'Comprada':
      return 'Adquirido';
    case 'Cancelada':
      return 'Cancelado';
    default:
      return 'Pendente';
  }
}

export function ComprasPlanejadasListPage() {
  const [filters, setFilters] = useState<CompraPlanejadaFilters>({
    page: 1,
    pageSize: 50,
    search: '',
    status: undefined
  });
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<PagedResult<CompraPlanejadaResumo, CompraPlanejadaListSummary>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('Todos');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(undefined);
      try {
        const result = await comprasPlanejadasApi.listar(deferredFilters);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar compras planejadas.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [deferredFilters]);

  function handleStatusFilter(status: StatusFilter) {
    setActiveStatus(status);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: status === 'Todos' ? undefined : (status as CompraPlanejadaStatus)
    }));
  }

  const totalEstimado = useMemo(() => {
    return data?.summary?.valorTotalEstimado ?? 0;
  }, [data]);

  if (loading && !data) {
    return <PageState state="loading" title="Carregando planejador" />;
  }

  if (error) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PageState state="error" title="Falha ao carregar planejador" subtitle={error} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface mb-2">Planejador de Compras</h1>
            <p className="text-on-surface-variant max-w-xl font-body">
              Gerencie seu desejo de consumo com inteligência. Priorize aquisições baseado em metas financeiras reais.
            </p>
          </div>
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 min-w-[280px]">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1 font-bold">Total Estimado Filtrado</span>
            <div className="flex items-baseline gap-2">
              <span className="text-primary text-3xl font-black font-headline">
                {formatCurrencyBRL(totalEstimado)}
              </span>
            </div>
          </div>
        </header>

        {/* Filters Section */}
        <section className="flex flex-wrap gap-4">
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
            {(['Todos', 'Planejada', 'Comprada'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeStatus === status ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {status === 'Todos' ? 'Tudo' : status === 'Planejada' ? 'Pendente' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </section>

        {/* Shopping List Grid (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data?.items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/15 hover:border-primary/30 transition-all duration-300"
            >
              <div className="h-48 overflow-hidden relative bg-surface-container-highest">
                {/* Fallback pattern when no image is available */}
                <div className="w-full h-full flex items-center justify-center text-outline-variant/20">
                    <span className="material-symbols-outlined text-[100px]">shopping_bag</span>
                </div>
                <div className="absolute top-4 left-4">
                  {getPriorityBadge(item.prioridade)}
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold font-headline text-on-surface truncate">
                      {item.titulo}
                    </h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                      {item.contaGerencialDescricao}
                    </p>
                  </div>
                  <span className="text-primary font-black font-headline text-lg whitespace-nowrap ml-4">
                    {formatCurrencyBRL(item.valorEstimado)}
                  </span>
                </div>

                {/* Progress bar simulation (in a real app, we might have saved amount) */}
                <div className="space-y-3">
                   <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div className={`bg-primary h-full shadow-[0_0_8px_rgba(63,255,139,0.5)] ${item.status === 'Comprada' ? 'w-full' : 'w-1/3'}`}></div>
                   </div>
                   <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
                      <span>{item.status === 'Comprada' ? 'Concluído' : 'Planejado'}</span>
                      <span>{item.status === 'Comprada' ? '100%' : '33%'}</span>
                   </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-[11px] text-on-surface-variant font-medium">
                  {item.responsavelNome && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {item.responsavelNome}
                    </span>
                  )}
                  {item.dataDesejada && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {new Date(item.dataDesejada).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex gap-3">
                {item.status === 'Planejada' && !item.contaPagarGeradaId ? (
                  <>
                    <Link
                      to={`/compras-planejadas/${item.id}/realizar`}
                      className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all no-underline"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_bag</span> Adquirir
                    </Link>
                    <Link
                      to={`/compras-planejadas/${item.id}`}
                      className="p-3 bg-surface-container-highest text-on-surface rounded-xl hover:bg-surface-bright transition-all no-underline flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </Link>
                  </>
                ) : item.contaPagarGeradaId ? (
                  <Link
                    to={`/contas-pagar/${item.contaPagarGeradaId}`}
                    className="flex-1 py-3 border border-primary/40 text-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all no-underline"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span> Ver conta a pagar
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-3 bg-surface-container-highest text-on-surface-variant font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">schedule</span> {getStatusLabel(item.status)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!data?.items.length && (
          <div className="text-center py-20 bg-surface-container rounded-3xl border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4 block">shopping_cart</span>
            <p className="text-on-surface-variant text-lg font-headline font-bold">Nenhuma compra planejada encontrada.</p>
            <p className="text-on-surface-variant/60 text-sm mt-1">Sua lista de desejos está vazia para este filtro.</p>
          </div>
        )}

        {/* Call to Action Floating Area */}
        <div className="mt-12 p-8 bg-gradient-to-r from-surface-container to-surface-container-low rounded-3xl border border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-black font-headline text-on-surface">Planeje sua próxima conquista</h2>
            <p className="text-on-surface-variant mt-2 font-body">Deseja adicionar um novo item à sua wishlist financeira?</p>
          </div>
          <Link
            to="/compras-planejadas/nova"
            className="relative z-10 px-8 py-4 bg-primary text-on-primary font-black rounded-2xl flex items-center gap-3 hover:shadow-[0_0_30px_rgba(63,255,139,0.3)] transition-all transform active:scale-95 no-underline whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add_circle</span> NOVO ITEM DE COMPRA
          </Link>
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none" aria-hidden="true">
            <span className="material-symbols-outlined text-[12rem]">shopping_cart_checkout</span>
          </div>
        </div>
      </div>
    </>
  );
}
