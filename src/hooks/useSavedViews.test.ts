import { renderHook, act } from '@testing-library/react';
import { useSavedViews } from './useSavedViews';

vi.mock('../store/auth-store', () => ({
  useAuthStore: (selector: (s: { currentUser: { userId: string } | null }) => unknown) =>
    selector({ currentUser: { userId: 'user-123' } })
}));

describe('useSavedViews', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty views', () => {
    const { result } = renderHook(() => useSavedViews('contas-pagar'));
    expect(result.current.views).toEqual([]);
  });

  it('saves a view and retrieves it', () => {
    const { result } = renderHook(() => useSavedViews('contas-pagar'));

    act(() => {
      result.current.saveView('Vencidas do mês', { statusCodigo: ['VENCIDA'] });
    });

    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].name).toBe('Vencidas do mês');
    expect(result.current.views[0].filters).toEqual({ statusCodigo: ['VENCIDA'] });
  });

  it('updates an existing view with the same name', () => {
    const { result } = renderHook(() => useSavedViews('contas-pagar'));

    act(() => {
      result.current.saveView('Minhas contas', { statusCodigo: ['PENDENTE'] });
    });

    act(() => {
      result.current.saveView('Minhas contas', { statusCodigo: ['VENCIDA'], search: 'aluguel' });
    });

    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].filters).toEqual({ statusCodigo: ['VENCIDA'], search: 'aluguel' });
  });

  it('deletes a view by id', () => {
    const { result } = renderHook(() => useSavedViews('contas-pagar'));

    act(() => {
      result.current.saveView('Visão A', { statusCodigo: ['PENDENTE'] });
      result.current.saveView('Visão B', { statusCodigo: ['VENCIDA'] });
    });

    const idToDelete = result.current.views[0].id;

    act(() => {
      result.current.deleteView(idToDelete);
    });

    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].name).toBe('Visão B');
  });

  it('renames a view', () => {
    const { result } = renderHook(() => useSavedViews('contas-pagar'));

    act(() => {
      result.current.saveView('Nome antigo', { statusCodigo: ['PENDENTE'] });
    });

    const viewId = result.current.views[0].id;

    act(() => {
      result.current.renameView(viewId, 'Nome novo');
    });

    expect(result.current.views[0].name).toBe('Nome novo');
  });

  it('persists views across hook re-renders', () => {
    const { result, unmount } = renderHook(() => useSavedViews('contas-pagar'));

    act(() => {
      result.current.saveView('Persistente', { search: 'teste' });
    });

    unmount();

    const { result: result2 } = renderHook(() => useSavedViews('contas-pagar'));
    expect(result2.current.views).toHaveLength(1);
    expect(result2.current.views[0].name).toBe('Persistente');
  });

  it('isolates views by module key', () => {
    const { result: pagar } = renderHook(() => useSavedViews('contas-pagar'));
    const { result: receber } = renderHook(() => useSavedViews('contas-receber'));

    act(() => {
      pagar.current.saveView('Só em pagar', { statusCodigo: ['PENDENTE'] });
    });

    expect(pagar.current.views).toHaveLength(1);
    expect(receber.current.views).toHaveLength(0);
  });

  it('limits to MAX_VIEWS (20) by removing oldest', () => {
    const { result } = renderHook(() => useSavedViews('contas-pagar'));

    act(() => {
      for (let i = 0; i < 22; i++) {
        result.current.saveView(`Visão ${i}`, { index: i });
      }
    });

    expect(result.current.views).toHaveLength(20);
    expect(result.current.views[0].name).toBe('Visão 2');
    expect(result.current.views[19].name).toBe('Visão 21');
  });
});
