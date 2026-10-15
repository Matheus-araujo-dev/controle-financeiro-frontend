import { render, screen, within } from '@testing-library/react';
import { ReportTable } from './relatorios-components';

afterEach(() => vi.unstubAllGlobals());
it('preserves report values and severity using the shared table', () => {
  render(<ReportTable headers={['Descrição', 'Valor']} emptyText="Sem registros" rows={[{ id: 'one', className: 'bg-error/5', cells: ['Cobrança', <span className="text-error">R$ 120,00</span>] }]} />);
  const table = screen.getByRole('table');
  expect(within(table).getByText('R$ 120,00')).toHaveClass('text-error');
  expect(within(table).getByText('Cobrança').closest('tr')).toHaveClass('bg-error/5');
  expect(screen.queryByRole('button', { name: 'Valor' })).not.toBeInTheDocument();
});
it('shows labeled report fields on mobile without a second table implementation', () => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(<ReportTable headers={['Descrição', 'Valor']} emptyText="Sem registros" rows={[{ id: 'one', cells: ['Cobrança', 'R$ 120,00'] }]} />);
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.getByText('Descrição')).toBeVisible();
  expect(screen.getByText('Valor')).toBeVisible();
  expect(screen.getByText('R$ 120,00')).toBeVisible();
});
it('uses the shared empty state', () => {
  render(<ReportTable headers={['Descrição']} emptyText="Sem registros" rows={[]} />);
  expect(screen.getByTestId('data-table-empty')).toHaveTextContent('Sem registros');
});
