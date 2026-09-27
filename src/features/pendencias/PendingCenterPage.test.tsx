import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PendingCenterPage } from './PendingCenterPage';
import { loadPendingItems } from './pending-data';

vi.mock('./pending-data', () => ({ loadPendingItems: vi.fn() }));
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><PendingCenterPage /></MemoryRouter></QueryClientProvider>);
}
afterEach(() => vi.restoreAllMocks());
it('abre origem correta e filtra sem somar importação como dívida', async () => {
  vi.mocked(loadPendingItems).mockResolvedValue([
    { id: 'pagar:1', tipo: 'pagar', descricao: 'Internet', valor: 60, vencimento: '2026-09-10', motivo: 'Vencida', href: '/contas-pagar/1' },
    { id: 'importacao:2', tipo: 'importacao', descricao: 'fatura.pdf', valor: null, motivo: '2 itens para revisar', href: '/importacoes-whatsapp/2' },
  ]);
  show();
  expect(await screen.findByRole('link', { name: /Internet/ })).toHaveAttribute('href', '/contas-pagar/1');
  expect(screen.getByText('R$60,00')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Tipo de pendência'), { target: { value: 'importacao' } });
  expect(screen.queryByRole('link', { name: /Internet/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /fatura.pdf/ })).toHaveAttribute('href', '/importacoes-whatsapp/2');
});
it('falha não aparece como ausência de compromissos', async () => {
  vi.mocked(loadPendingItems).mockRejectedValue(new Error('offline'));
  show();
  expect(await screen.findByText('Não foi possível carregar as pendências')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  expect(screen.queryByText('Nenhuma pendência neste recorte')).not.toBeInTheDocument();
});
it('explica o recorte quando a lista está vazia', async () => {
  vi.mocked(loadPendingItems).mockResolvedValue([]);
  show();
  expect(await screen.findByText('Nenhuma pendência neste recorte')).toBeInTheDocument();
});

it('permite recuperar de uma falha sem manter dados antigos', async () => {
  vi.mocked(loadPendingItems).mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]);
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText('Nenhuma pendência neste recorte')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
});

it('descarta resultado atrasado após trocar de espaço', async () => {
  const { act } = await import('@testing-library/react');
  const { useAuthStore } = await import('../../store/auth-store');
  const { SessionQueryProvider } = await import('../../store/SessionQueryProvider');
  let complete!: (rows: Awaited<ReturnType<typeof loadPendingItems>>) => void;
  useAuthStore.getState().signIn({ userId: 'a', displayName: 'A', workspace: { id: 'one', nome: 'One', papel: 'Membro' } });
  vi.mocked(loadPendingItems).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; })).mockResolvedValue([]);
  render(<SessionQueryProvider><MemoryRouter><PendingCenterPage /></MemoryRouter></SessionQueryProvider>);
  await act(async () => {
    useAuthStore.getState().signIn({ userId: 'a', displayName: 'A', workspace: { id: 'two', nome: 'Two', papel: 'Membro' } });
  });
  expect(await screen.findByText('Nenhuma pendência neste recorte')).toBeInTheDocument();
  await act(async () => complete([{ id: 'old', tipo: 'pagar', descricao: 'Espaço anterior', valor: 50, motivo: 'Vencida', href: '/contas-pagar/old' }]));
  expect(screen.queryByText('Espaço anterior')).not.toBeInTheDocument();
  act(() => useAuthStore.getState().clearSession());
});

it('desativa a consulta e redireciona quando a flag está desligada', async () => {
  const { Routes, Route } = await import('react-router-dom');
  vi.stubEnv('VITE_PRODUCT_PENDING_ENABLED', 'false');
  vi.mocked(loadPendingItems).mockClear();
  const client = new QueryClient();
  try {
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/pendencias']}><Routes><Route path="/pendencias" element={<PendingCenterPage />} /><Route path="/dashboard" element={<p>Destino dashboard</p>} /></Routes></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText('Destino dashboard')).toBeInTheDocument();
    expect(loadPendingItems).not.toHaveBeenCalled();
  } finally { vi.unstubAllEnvs(); }
});
