import { useCallback, useMemo, useState } from 'react';

const PAGING_KEYS = new Set(['page', 'pageSize', 'sortBy', 'sortDirection']);

function readStorage<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage indisponível (modo privado com armazenamento cheio, etc.)
  }
}

export function usePersistedFilters<T extends object>(
  storageKey: string,
  defaultFilters: T,
  urlOverrides?: Partial<T>
): {
  filters: T;
  setFilters: (update: T | ((prev: T) => T)) => void;
  clearFilters: () => void;
  isModified: boolean;
} {
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  const [filters, _setFilters] = useState<T>(() => {
    const persisted = readStorage<T>(storageKey);
    const base = persisted ?? defaultFilters;
    if (!urlOverrides) return base;
    const merged = { ...base };
    for (const [k, v] of Object.entries(urlOverrides)) {
      if (v !== undefined && v !== null) {
        (merged as Record<string, unknown>)[k] = v;
      }
    }
    return merged;
  });

  if (prevStorageKey !== storageKey) {
    setPrevStorageKey(storageKey);
    const persisted = readStorage<T>(storageKey);
    _setFilters(persisted ?? defaultFilters);
  }

  const setFilters = useCallback(
    (update: T | ((prev: T) => T)) => {
      _setFilters((prev) => {
        const next = typeof update === 'function' ? (update as (p: T) => T)(prev) : update;
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const clearFilters = useCallback(() => {
    _setFilters(defaultFilters);
    writeStorage(storageKey, defaultFilters);
  }, [defaultFilters, storageKey]);

  const isModified = useMemo(() => {
    for (const [k, v] of Object.entries(filters)) {
      if (PAGING_KEYS.has(k)) continue;
      const def = (defaultFilters as Record<string, unknown>)[k];
      if (JSON.stringify(v) !== JSON.stringify(def)) return true;
    }
    return false;
  }, [filters, defaultFilters]);

  return { filters, setFilters, clearFilters, isModified };
}
