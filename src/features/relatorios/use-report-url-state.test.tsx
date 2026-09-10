import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { expect, it } from 'vitest';
import { useReportUrlState } from './use-report-url-state';
it('restores filters and changes one parameter without discarding others', () => {
  const wrapper = ({ children }: PropsWithChildren) => <MemoryRouter initialEntries={['/?tab=faturas&search=mercado']}>{children}</MemoryRouter>;
  const { result } = renderHook(() => ({ tab: useReportUrlState<string>('tab', 'geral'), search: useReportUrlState<string>('search', '') }), { wrapper });
  expect(result.current.tab[0]).toBe('faturas');
  act(() => result.current.tab[1]('compras'));
  expect(result.current.tab[0]).toBe('compras');
  expect(result.current.search[0]).toBe('mercado');
});
it('uses defaults for invalid array and validated values', () => {
  const wrapper = ({ children }: PropsWithChildren) => <MemoryRouter initialEntries={['/?items=42&tab=invalid']}>{children}</MemoryRouter>;
  const { result } = renderHook(() => ({ items: useReportUrlState<string[]>('items', []), tab: useReportUrlState<string>('tab', 'geral', value => value === 'geral') }), { wrapper });
  expect(result.current.items[0]).toEqual([]);
  expect(result.current.tab[0]).toBe('geral');
});
