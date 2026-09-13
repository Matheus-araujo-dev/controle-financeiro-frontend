import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuthStore } from '../store/auth-store';

export type SavedView = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

const MAX_VIEWS = 20;

function storageKey(userId: string, moduleKey: string): string {
  return `saved-views:${userId}:${moduleKey}`;
}

function readViews(key: string): SavedView[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

function writeViews(key: string, views: SavedView[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(views));
  } catch {
    // localStorage cheio ou indisponível
  }
}

const listeners = new Set<() => void>();
let snapshotCounter = 0;

function emitChange() {
  snapshotCounter++;
  for (const fn of listeners) fn();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot() {
  return snapshotCounter;
}

export function useSavedViews(moduleKey: string) {
  const userId = useAuthStore((s) => s.currentUser?.userId ?? 'anonymous');
  const key = storageKey(userId, moduleKey);

  const tick = useSyncExternalStore(subscribe, getSnapshot);

  const views = useMemo(() => readViews(key), [key, tick]);

  const saveView = useCallback(
    (name: string, filters: Record<string, unknown>) => {
      const current = readViews(key);
      const existing = current.findIndex((v) => v.name === name);
      const view: SavedView = {
        id: existing >= 0 ? current[existing].id : crypto.randomUUID(),
        name,
        filters,
        createdAt: new Date().toISOString()
      };
      if (existing >= 0) {
        current[existing] = view;
      } else {
        if (current.length >= MAX_VIEWS) current.shift();
        current.push(view);
      }
      writeViews(key, current);
      emitChange();
    },
    [key]
  );

  const deleteView = useCallback(
    (id: string) => {
      const current = readViews(key).filter((v) => v.id !== id);
      writeViews(key, current);
      emitChange();
    },
    [key]
  );

  const renameView = useCallback(
    (id: string, newName: string) => {
      const current = readViews(key);
      const view = current.find((v) => v.id === id);
      if (view) {
        view.name = newName;
        writeViews(key, current);
        emitChange();
      }
    },
    [key]
  );

  return { views, saveView, deleteView, renameView };
}
