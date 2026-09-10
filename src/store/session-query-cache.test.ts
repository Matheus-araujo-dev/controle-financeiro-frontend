import { useAuthStore } from './auth-store';
import { createSessionQueryCache } from './session-query-cache';

describe('session query isolation', () => {
  afterEach(() => useAuthStore.getState().clearSession());
  it('replaces and clears cache when the user or workspace changes', () => {
    const cache = createSessionQueryCache();
    const first = cache.getSnapshot();
    first.setQueryData(['saldo'], 123);
    useAuthStore.getState().signIn({ userId: 'a', displayName: 'A', workspace: { id: 'one', nome: 'One', papel: 'Membro' } });
    const second = cache.getSnapshot();
    expect(second).not.toBe(first);
    expect(first.getQueryData(['saldo'])).toBeUndefined();
    second.setQueryData(['saldo'], 456);
    useAuthStore.getState().signIn({ userId: 'a', displayName: 'A', workspace: { id: 'two', nome: 'Two', papel: 'Membro' } });
    expect(cache.getSnapshot()).not.toBe(second);
    expect(cache.getSnapshot().getQueryData(['saldo'])).toBeUndefined();
    cache.dispose();
  });
  it('retains cache on token renewal and notifies on logout', () => {
    useAuthStore.getState().signIn({ userId: 'a', displayName: 'A' });
    const cache = createSessionQueryCache();
    const listener = vi.fn();
    const unsubscribe = cache.subscribe(listener);
    const client = cache.getSnapshot();
    useAuthStore.getState().setToken('renewed');
    expect(cache.getSnapshot()).toBe(client);
    expect(listener).not.toHaveBeenCalled();
    useAuthStore.getState().clearSession();
    expect(cache.getSnapshot()).not.toBe(client);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    cache.dispose();
  });
  it('cancels in-flight queries and ignores late results after logout', async () => {
    useAuthStore.getState().signIn({ userId: 'a', displayName: 'A' });
    const cache = createSessionQueryCache();
    const old = cache.getSnapshot();
    let resolve!: (value: number) => void;
    const request = old.fetchQuery({ queryKey: ['saldo'], queryFn: () => new Promise<number>((r) => { resolve = r; }) }).catch(() => undefined);
    useAuthStore.getState().clearSession();
    resolve(999);
    await request;
    expect(old.getQueryData(['saldo'])).toBeUndefined();
    expect(cache.getSnapshot().getQueryData(['saldo'])).toBeUndefined();
    cache.dispose();
  });
});
