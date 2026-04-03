import { useAppShellStore } from './app-shell-store';

describe('useAppShellStore', () => {
  afterEach(() => {
    useAppShellStore.setState({
      collapsed: false,
      pageTitle: 'Dashboard'
    });
  });

  it('updates the collapsed state', () => {
    useAppShellStore.getState().setCollapsed(true);

    expect(useAppShellStore.getState().collapsed).toBe(true);
  });

  it('updates the current page title', () => {
    useAppShellStore.getState().setPageTitle('Contas a pagar');

    expect(useAppShellStore.getState().pageTitle).toBe('Contas a pagar');
  });
});
