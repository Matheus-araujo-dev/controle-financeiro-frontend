import { act, render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SessionQueryProvider } from './SessionQueryProvider';
import { useAuthStore } from './auth-store';

it('remounts local state and loads new data across users with the same query key', async () => {
  useAuthStore.getState().signIn({ userId: 'A', displayName: 'A' });
  function Content() {
    const [owner] = useState(useAuthStore.getState().currentUser?.userId);
    const { data } = useQuery({ queryKey: ['saldo'], queryFn: async () => useAuthStore.getState().currentUser?.userId });
    return <div>{owner}:{data}</div>;
  }
  render(<SessionQueryProvider><Content /></SessionQueryProvider>);
  await screen.findByText('A:A');
  act(() => { useAuthStore.getState().clearSession(); useAuthStore.getState().signIn({ userId: 'B', displayName: 'B' }); });
  await screen.findByText('B:B');
  expect(screen.queryByText('A:A')).not.toBeInTheDocument();
  act(() => useAuthStore.getState().clearSession());
});
