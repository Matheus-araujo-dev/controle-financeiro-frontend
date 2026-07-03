import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../ui/Button';

export function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-primary/30 bg-surface-container-high px-5 py-3 shadow-2xl"
    >
      <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
        system_update
      </span>
      <p className="text-sm font-semibold text-on-surface">Nova versão disponível</p>
      <Button
        size="sm"
        variant="primary"
        onClick={() => void updateServiceWorker(true)}
      >
        Atualizar
      </Button>
    </div>
  );
}
