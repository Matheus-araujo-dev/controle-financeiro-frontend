import { useQuery } from '@tanstack/react-query';
import { conciliacaoFaturaApi } from '../../services/http/conciliacao-fatura-api';
import { getApiErrorMessage } from '../../services/http/api-error';
import type { PreviaReembolsoFaturaRequest } from '../../types/generated/api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';

export function PreviaReembolsoCell({ faturaId, sessionId, itemId, request }: {
  faturaId: string; sessionId: string; itemId: string; request: PreviaReembolsoFaturaRequest;
}) {
  const enabled = (request.valorTotal ?? 0) > 0 && !!request.pagadoresIds?.length && !!request.dataVencimento;
  const { data, isFetching, error } = useQuery({
    queryKey: ['previa-reembolso-fatura', faturaId, sessionId, itemId, request], enabled, retry: false, staleTime: 0,
    queryFn: () => conciliacaoFaturaApi.previaReembolso(faturaId, sessionId, itemId, request)
  });
  if (!enabled) return <span className="text-xs text-on-surface-variant">Informe pagadores, valor e vencimento.</span>;
  if (isFetching) return <span role="status">Calculando prévia…</span>;
  if (error) return <span role="alert" className="text-error">{getApiErrorMessage(error)}</span>;
  return <div className="space-y-1 text-xs">{data?.map((row, index) => <p key={index}>
    {row.pagadorNome} · {row.numeroParcela}/{row.quantidadeParcelas} · {formatCurrencyBRL(row.valor ?? 0)} · {formatDateBR(row.dataVencimento ?? '')}
  </p>)}<p className="text-on-surface-variant">Prévia. As contas serão geradas ao confirmar a linha.</p></div>;
}
