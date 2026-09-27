import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { fechamentosApi } from '../../services/http/fechamentos-api';
import { FechamentoPage } from './FechamentoPage';

vi.mock('../../services/http/fechamentos-api', () => ({ fechamentosApi: { obter: vi.fn(), fechar: vi.fn(), reabrir: vi.fn() } }));
const base = { competencia: '2026-09', status: 'Aberto', prontoParaFechar: false, quantidadeBloqueios: 2, totalReceitas: 1000, totalDespesas: 500, saldo: 500, totalPendente: 100, totalVencido: 0, quantidadeLancamentos: 3, quantidadeSemCategoria: 0, quantidadeSemResponsavel: 0, quantidadeConciliacoesPendentes: 0, itens: [{ id: 'pendentes', titulo: 'Lançamentos pendentes', descricao: '2 registro(s) exigem revisão.', status: 'Pendente', bloqueante: true, quantidade: 2, valor: 100, rotaAcao: '/agenda?status=PENDENTE' }] } as const;
function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter><FechamentoPage /></MemoryRouter></QueryClientProvider>); }

it('uses the authoritative server checklist and blocks closing while there are pending items', async () => {
  vi.mocked(fechamentosApi.obter).mockResolvedValue(base as never); renderPage();
  expect(await screen.findByText('2 bloqueio(s)')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Fechar mês' })).toBeDisabled();
  expect(screen.getByText('3 lançamento(s) avaliados pelo servidor.')).toBeInTheDocument();
});

it('requires a reason before reopening a closed month', async () => {
  vi.mocked(fechamentosApi.obter).mockResolvedValue({ ...base, status: 'Fechado', prontoParaFechar: true, quantidadeBloqueios: 0, fechadoEmUtc: '2026-10-01T12:00:00Z' } as never); renderPage();
  await userEvent.click(await screen.findByRole('button', { name: 'Reabrir mês' }));
  expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toBeDisabled();
  await userEvent.type(screen.getByLabelText('Justificativa da reabertura'), 'Correção necessária');
  expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toBeEnabled();
});
