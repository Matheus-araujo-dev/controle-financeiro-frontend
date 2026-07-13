import { Button } from '../../../components/ui/Button';

type Props = {
  open: boolean;
  loading: boolean;
  message: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FaturaIndisponivelModal({ open, loading, message, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-warning/20 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-warning/12 text-warning">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Fatura indisponível</p>
            <h3 className="font-headline text-lg font-bold text-on-surface leading-tight">
              Fatura fechada ou liquidada
            </h3>
          </div>
        </div>

        <p className="mb-6 text-sm text-on-surface-variant">
          {message ?? 'A fatura desta competência já está fechada ou liquidada.'}
        </p>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Descartar
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm} loading={loading} disabled={loading}>
            Incluir na próxima fatura
          </Button>
        </div>
      </div>
    </div>
  );
}
