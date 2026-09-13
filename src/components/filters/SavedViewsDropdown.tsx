import { useRef, useState } from 'react';
import { useSavedViews } from '../../hooks/useSavedViews';
import type { SavedView } from '../../hooks/useSavedViews';

interface SavedViewsDropdownProps {
  moduleKey: string;
  currentFilters: Record<string, unknown>;
  onLoadView: (filters: Record<string, unknown>) => void;
}

export function SavedViewsDropdown({ moduleKey, currentFilters, onLoadView }: SavedViewsDropdownProps) {
  const { views, saveView, deleteView } = useSavedViews(moduleKey);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewName, setViewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleSave() {
    const name = viewName.trim();
    if (!name) return;
    const { page, pageSize, sortBy, sortDirection, ...filtersToSave } = currentFilters as Record<string, unknown>;
    saveView(name, filtersToSave);
    setViewName('');
    setSaving(false);
  }

  function handleLoad(view: SavedView) {
    onLoadView(view.filters);
    setOpen(false);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteView(id);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setSaving(false);
        }}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-white transition-colors"
        aria-label="Visões salvas"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px', lineHeight: 1 }}>bookmarks</span>
        Visões
        {views.length > 0 && (
          <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            {views.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-[61] w-72 rounded-2xl bg-surface-container border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Visões salvas
              </h4>
              {!saving ? (
                <button
                  type="button"
                  onClick={() => {
                    setSaving(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="flex items-center gap-1.5 w-full h-8 px-3 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                  Salvar visão atual
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder="Nome da visão..."
                    className="flex-1 h-8 px-3 rounded-lg bg-surface text-xs text-white border border-white/10 focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                    maxLength={50}
                  />
                  <button
                    type="submit"
                    disabled={!viewName.trim()}
                    className="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-on-primary disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    Salvar
                  </button>
                </form>
              )}
            </div>

            {views.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto p-1.5">
                {views.map((view) => (
                  <li key={view.id}>
                    <button
                      type="button"
                      onClick={() => handleLoad(view)}
                      className="flex items-center justify-between w-full h-9 px-3 rounded-lg text-sm text-on-surface hover:bg-white/5 transition-colors group"
                    >
                      <span className="truncate">{view.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, view.id)}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 transition-all"
                        aria-label={`Excluir visão ${view.name}`}
                      >
                        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-xs text-on-surface-variant text-center">
                Nenhuma visão salva ainda
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
