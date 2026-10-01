import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { formatCurrencyBRL } from '../../../shared/currency';
import type { DashboardAnomalias } from '../../../types/dashboard';

const labels: Record<string, string> = {
  DuplicidadeProvavel: 'Duplicidade provável', AumentoRecorrente: 'Aumento recorrente',
  ValorIncomum: 'Valor fora do padrão', RevisarRecorrencia: 'Revisar recorrência'
};
type Props = {
  referenceMonth: string; data?: DashboardAnomalias; loading?: boolean; error?: boolean; onRetry?: () => void;
};
export function DashboardAnomalies({ referenceMonth, data, loading, error, onRetry }: Props) {
  let content;
  if (error) content = <><p>Não foi possível analisar as cobranças.</p><Button onClick={onRetry}>Tentar novamente</Button></>;
  else if (loading) content = <p role="status">Analisando cobranças</p>;
  else if (!data?.completo || data.mesReferencia !== referenceMonth) content = <p>Análise indisponível para este recorte</p>;
  else content = <>
    <p className="text-sm text-on-surface-variant">{data.contasAnalisadas} contas elegíveis analisadas, de {data.historicoInicial.split('-').reverse().join('/')} ao fim do mês selecionado, pela data de emissão. Todas as contas e cartões.</p>
    <p className="mt-2 text-sm text-on-surface-variant">Sinais para revisão humana: não confirmam erro nem uso de assinatura. Histórico insuficiente não gera comparação; a ausência de alertas não garante ausência de cobranças indevidas.</p>
    {data.itens.length === 0 ? <p className="mt-3">Nenhum sinal encontrado pelas regras neste recorte.</p> :
      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {data.itens.map(item => <li key={item.id} className="min-w-0 rounded-xl border border-outline-variant p-4">
          <h3 className="font-semibold">{labels[item.tipo] ?? 'Cobrança para revisar'}</h3>
          <p className="break-words">{item.descricao}</p>
          <p className="mt-2 text-sm">{item.regra}</p>
          <p className="mt-2 text-sm">Valor por cobrança: {formatCurrencyBRL(item.valorAtual)}{item.valorBase !== null && ` · Mediana anterior: ${formatCurrencyBRL(item.valorBase)}`}</p>
          <ul className="mt-2 flex flex-wrap gap-3" aria-label={`Lançamentos de ${item.descricao}`}>
            {item.evidencias.map(e => <li key={e.contaPagarId}><Link className="text-primary underline" to={`/contas-pagar/${e.contaPagarId}`}>
              {e.data.split('-').reverse().join('/')} · {formatCurrencyBRL(e.valor)}
            </Link></li>)}
          </ul>
        </li>)}
      </ul>}
  </>;
  return <section aria-label="Alertas de cobranças" className="rounded-2xl bg-surface-container-low p-5">
    <h2 className="mb-3 text-lg font-semibold">Alertas de cobranças · {referenceMonth}</h2>
    {content}
  </section>;
}
