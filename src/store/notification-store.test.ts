import { act, renderHook } from '@testing-library/react';
import { notify, useNotificationCount, useNotificationStore } from './notification-store';

describe('notification-store', () => {
  afterEach(() => {
    useNotificationStore.getState().clear();
  });

  it('pushes, shifts and clears notifications', () => {
    useNotificationStore.getState().push({
      level: 'success',
      title: 'Salvo',
      description: 'Operacao concluida.'
    });
    notify('error', 'Falha', 'Tente novamente.');

    expect(useNotificationStore.getState().queue).toHaveLength(2);
    expect(useNotificationStore.getState().queue[0]).toMatchObject({
      level: 'success',
      title: 'Salvo',
      description: 'Operacao concluida.'
    });

    useNotificationStore.getState().shift();
    expect(useNotificationStore.getState().queue).toHaveLength(1);

    useNotificationStore.getState().clear();
    expect(useNotificationStore.getState().queue).toEqual([]);
  });

  it('exposes the notification count selector hook', () => {
    const { result } = renderHook(() => useNotificationCount());

    expect(result.current).toBe(0);

    act(() => {
      notify('info', 'Nova mensagem');
    });

    expect(result.current).toBe(1);
  });
});
