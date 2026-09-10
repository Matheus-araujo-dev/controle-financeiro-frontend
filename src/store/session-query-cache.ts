import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from './auth-store';
import type { AuthUser } from '../types/auth';

const scope = (user: AuthUser | null) => JSON.stringify([user?.userId, user?.workspace?.id ?? user?.familia?.id]);
const createClient = () => new QueryClient({ defaultOptions: { queries: {
  staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10, retry: 1, refetchOnWindowFocus: false,
} } });

/** A separate client prevents late query and mutation callbacks from repopulating another session. */
export function createSessionQueryCache() {
  let client = createClient();
  const listeners = new Set<() => void>();
  const unsubscribe = useAuthStore.subscribe((state, previous) => {
    if (scope(state.currentUser) === scope(previous.currentUser)) return;
    const retired = client;
    client = createClient();
    void retired.cancelQueries();
    retired.clear();
    listeners.forEach((listener) => listener());
  });
  return {
    getSnapshot: () => client,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose: () => { unsubscribe(); client.clear(); listeners.clear(); },
  };
}
