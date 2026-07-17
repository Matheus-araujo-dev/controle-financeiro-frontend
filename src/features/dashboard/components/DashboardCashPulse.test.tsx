import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCashPulse } from './DashboardCashPulse';
import type { DashboardFluxoCaixaDia } from '../../../types/dashboard';

const TODAY = new Date().toISOString().split('T')[0];

function makeItem(overrides: Partial<DashboardFluxoCaixaDia> = {}): DashboardFluxoCaixaDia {
  return {
    data: '2026-07-01',
    saldoInicial: 1000,
    entradasPrevistas: 500,
    saidasPrevistas: 200,
    saldoFinalPrevisto: 1300,
    riscoSaldoNegativo: false,
    ...overrides
  };
}

function makeItems(count: number, base: Partial<DashboardFluxoCaixaDia> = {}): DashboardFluxoCaixaDia[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date('2026-07-01');
    date.setDate(date.getDate() + i);
    return makeItem({ data: date.toISOString().split('T')[0], ...base });
  });
}

describe('DashboardCashPulse', () => {
  it('renders empty state (dash) when no items', () => {
    render(<DashboardCashPulse items={[]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows "Saudável" badge when no critical days', () => {
    render(<DashboardCashPulse items={[makeItem()]} />);
    expect(screen.getByText('Saudável')).toBeInTheDocument();
  });

  it('shows error badge with critical day count', () => {
    const items = [
      makeItem({ riscoSaldoNegativo: true }),
      makeItem({ data: '2026-07-02', riscoSaldoNegativo: true }),
      makeItem({ data: '2026-07-03', riscoSaldoNegativo: false })
    ];
    render(<DashboardCashPulse items={items} />);
    expect(screen.getByText('2 dias críticos')).toBeInTheDocument();
  });

  it('shows 1 dia crítico (singular text) when only one critical day', () => {
    const items = [makeItem({ riscoSaldoNegativo: true })];
    render(<DashboardCashPulse items={items} />);
    expect(screen.getByText('1 dias críticos')).toBeInTheDocument();
  });

  it('displays positive saldo in primary color', () => {
    render(<DashboardCashPulse items={[makeItem({ saldoFinalPrevisto: 500 })]} />);
    const { container } = render(<DashboardCashPulse items={[makeItem({ saldoFinalPrevisto: 500 })]} />);
    const saldoEl = container.querySelector('.text-primary.font-bold');
    expect(saldoEl).toBeInTheDocument();
  });

  it('displays negative saldo in error color', () => {
    const { container } = render(<DashboardCashPulse items={[makeItem({ saldoFinalPrevisto: -500 })]} />);
    const saldoEl = container.querySelector('.text-error.font-bold');
    expect(saldoEl).toBeInTheDocument();
  });

  it('highlights today when item date matches today', () => {
    const items = [makeItem({ data: TODAY, saldoFinalPrevisto: 1000 })];
    render(<DashboardCashPulse items={items} />);
    expect(screen.getByText('hoje')).toBeInTheDocument();
  });

  it('does not show "hoje" when no item matches today', () => {
    const items = [makeItem({ data: '2026-01-01' })];
    render(<DashboardCashPulse items={items} />);
    expect(screen.queryByText('hoje')).not.toBeInTheDocument();
  });

  it('defaults to last item when today not found', () => {
    const items = makeItems(3);
    render(<DashboardCashPulse items={items} />);
    expect(screen.queryByText('hoje')).not.toBeInTheDocument();
  });

  it('generates label indices for 7+ items', () => {
    const items = makeItems(15);
    const { container } = render(<DashboardCashPulse items={items} />);
    const labels = container.querySelectorAll('.text-\\[8px\\]');
    expect(labels.length).toBeGreaterThan(2);
  });

  it('generates single label for 1 item', () => {
    const items = makeItems(1);
    const { container } = render(<DashboardCashPulse items={items} />);
    const bars = container.querySelectorAll('.flex-1.rounded-t');
    expect(bars.length).toBe(1);
  });

  it('updates active index on mouse enter', () => {
    const items = makeItems(5);
    const { container } = render(<DashboardCashPulse items={items} />);
    const bars = container.querySelectorAll('.flex-1.rounded-t');
    fireEvent.mouseEnter(bars[2]);
    fireEvent.mouseLeave(bars[2]);
  });

  it('clears active index on mouse leave', () => {
    const items = makeItems(3);
    const { container } = render(<DashboardCashPulse items={items} />);
    const bars = container.querySelectorAll('.flex-1.rounded-t');
    fireEvent.mouseEnter(bars[0]);
    fireEvent.mouseLeave(bars[0]);
    expect(bars[0]).toBeInTheDocument();
  });

  it('handles touch start and end', () => {
    const items = makeItems(3);
    const { container } = render(<DashboardCashPulse items={items} />);
    const bars = container.querySelectorAll('.flex-1.rounded-t');
    fireEvent.touchStart(bars[1]);
    fireEvent.touchEnd(bars[1]);
    expect(bars[1]).toBeInTheDocument();
  });

  it('renders header titles', () => {
    render(<DashboardCashPulse items={[makeItem()]} />);
    expect(screen.getByText('Cash Pulse')).toBeInTheDocument();
    expect(screen.getByText('Saldo projetado dia a dia')).toBeInTheDocument();
    expect(screen.getByText('Início do Mês')).toBeInTheDocument();
    expect(screen.getByText('Projeção 30D')).toBeInTheDocument();
  });

  it('renders today bar with indicator line', () => {
    const items = [makeItem({ data: TODAY })];
    const { container } = render(<DashboardCashPulse items={items} />);
    const todayIndicator = container.querySelector('.h-0\\.5.bg-primary.rounded-full');
    expect(todayIndicator).toBeInTheDocument();
  });
});
