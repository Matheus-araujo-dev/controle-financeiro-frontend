import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useReportSearch } from './use-report-search';
afterEach(() => vi.useRealTimers());
it('debounces typing and cancels superseded searches', () => {
  vi.useFakeTimers();
  const { result, rerender, unmount } = renderHook(({ value }) => useReportSearch(value), { initialProps: { value: '' } });
  rerender({ value: 'a' });
  act(() => vi.advanceTimersByTime(200));
  rerender({ value: 'ab' });
  act(() => vi.advanceTimersByTime(200));
  expect(result.current).toBe('');
  act(() => vi.advanceTimersByTime(100));
  expect(result.current).toBe('ab');
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
