import { useSyncExternalStore, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getSessionRevision } from './auth-store';
import { createSessionQueryCache } from './session-query-cache';

const cache = createSessionQueryCache();
export function SessionQueryProvider({ children }: PropsWithChildren) {
  const client = useSyncExternalStore(cache.subscribe, cache.getSnapshot);
  return <QueryClientProvider key={getSessionRevision()} client={client}>{children}</QueryClientProvider>;
}
