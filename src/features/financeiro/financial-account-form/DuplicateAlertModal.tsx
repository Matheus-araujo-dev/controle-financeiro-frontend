import { Button } from '../../../components/ui/Button';

type Props = {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DuplicateAlertModal({ open, loading, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-warning/20 bg-surface-container-low p-7 shadow-2xl">
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

        <p className="mb-6 text-sm text-on-surface-variant">
          Já existe um lançamento com a mesma descrição e vencimento nesta data. Deseja criar mesmo assim?
        </p>

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
