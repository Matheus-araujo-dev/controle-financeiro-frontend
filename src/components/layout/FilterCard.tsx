import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

interface FilterCardProps {
  children: ReactNode;
  className?: string;
  onClear?: () => void;
}

export function FilterCard({ children, className = '', onClear }: FilterCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: botão que abre bottom sheet */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-surface-container-low border border-white/8 text-sm font-semibold text-on-surface-variant hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', lineHeight: 1 }}>tune</span>
          Filtros
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', lineHeight: 1 }}>filter_list_off</span>
            Limpar
          </button>
        )}

        {open && createPortal(
          <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Filtros">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl border-t border-white/10 shadow-2xl max-h-[85vh] flex flex-col">
              {/* Header fixo */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
                <h3 className="font-headline font-bold text-base m-0 flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '20px', lineHeight: 1 }}
                  >tune</span>
                  Filtros
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>close</span>
                </button>
              </div>
              {/* Conteúdo rolável */}
              <div className="overflow-y-auto p-5 flex-1">
                {children}
              </div>
              {/* Rodapé fixo */}
              <div className="px-5 pb-6 pt-3 border-t border-white/5 shrink-0 bg-surface flex gap-3">
                {onClear && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                    onClick={() => { onClear(); setOpen(false); }}
                  >
                    Limpar filtros
                  </Button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className={onClear ? 'flex-1' : 'w-full'}
                  onClick={() => setOpen(false)}
                >
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Desktop: card inline normal */}
      <div className={`hidden lg:block bg-surface-container-low rounded-3xl border border-white/5 p-5 ${className}`}>
        {children}
        {onClear && (
          <div className="flex justify-end mt-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px', lineHeight: 1 }}>filter_list_off</span>
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </>
  );
}

interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
        {label}
      </label>
      {children}
    </div>
  );
}

interface FilterInputWrapperProps {
  icon?: ReactNode;
  children: ReactNode;
}

export function FilterInputWrapper({ icon, children }: FilterInputWrapperProps) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-2xl bg-surface-container px-3">
      {icon && <span className="shrink-0 text-sm text-on-surface-variant">{icon}</span>}
      {children}
    </div>
  );
}

export const filterInputClass =
  'bg-transparent border-none text-sm text-white w-full focus:outline-none placeholder:text-on-surface-variant/50';

export const filterSelectClass =
  'appearance-none bg-transparent border-none text-sm text-white w-full focus:outline-none cursor-pointer';
