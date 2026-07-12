import { Button } from '../../../components/ui/Button';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import type { DuplicateItemSummary } from '../financial-rules';

type Props = {
  open: boolean;
  loading: boolean;
  duplicates?: DuplicateItemSummary[];
  onConfirm: () => void;
  onCancel: () => void;
};

function statusColor(statusCodigo: string) {
  if (statusCodigo === 'LIQUIDADA') return 'text-primary bg-primary/10';
  if (statusCodigo === 'VENCIDA') return 'text-error bg-error/10';
  return 'text-warning bg-warning/10';
}

export function DuplicateAlertModal({ open, loading, duplicates = [], onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-warning/20 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-warning/12 text-warning">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Possível duplicata</p>
            <h3 className="font-headline text-lg font-bold text-on-surface leading-tight">
              Lançamento similar encontrado
            </h3>
          </div>
        </div>

        <p className="mb-4 text-sm text-on-surface-variant">
          {duplicates.length === 1
            ? 'Já existe um lançamento com a mesma descrição, vencimento e valor. Deseja criar mesmo assim?'
            : `Existem ${duplicates.length} lançamentos similares com a mesma descrição e vencimento. Deseja criar mesmo assim?`}
        </p>

        {duplicates.length > 0 && (
          <div className="mb-6 space-y-2">
            {duplicates.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/6 bg-surface-container p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-on-surface">{item.descricao}</p>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant">{item.pessoaNome}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor(item.statusCodigo)}`}>
                    {item.statusNome}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant">
                    Venc. {formatDateBR(item.dataVencimento)}
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {formatCurrencyBRL(item.valorLiquido)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm} loading={loading} disabled={loading}>
            Criar mesmo assim
          </Button>
        </div>
      </div>
    </div>
  );
}
