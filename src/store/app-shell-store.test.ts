import { act, renderHook } from '@testing-library/react';
import { useAppShellStore, useSidebarCollapsed } from './app-shell-store';

describe('app-shell-store', () => {
  afterEach(() => {
    useAppShellStore.setState({
      collapsed: false,
      pageTitle: 'Dashboard'
    });
  });

  it('updates shell state', () => {
    useAppShellStore.getState().setCollapsed(true);
    useAppShellStore.getState().setPageTitle('Relatorios');

    expect(useAppShellStore.getState()).toMatchObject({
      collapsed: true,
      pageTitle: 'Relatorios'
    });
  });

  it('exposes the collapsed selector hook', () => {
    const { result } = renderHook(() => useSidebarCollapsed());

    expect(result.current).toBe(false);

    act(() => {
      useAppShellStore.getState().setCollapsed(true);
    });

    expect(result.current).toBe(true);
  });
});
