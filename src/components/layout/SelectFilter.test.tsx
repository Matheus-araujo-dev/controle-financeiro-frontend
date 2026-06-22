import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectFilter } from './SelectFilter';

const options = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
];

describe('SelectFilter', () => {
  it('renders the placeholder, toggles options and selects a value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SelectFilter ariaLabel="Status" options={options} value="" onChange={onChange} placeholder="Filtrar status" icon={<span>i</span>} />);

    const trigger = screen.getByRole('button', { name: 'Status' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Todos')).toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: /^Ativos$/i }));

    expect(onChange).toHaveBeenCalledWith('true');
    expect(screen.queryByRole('button', { name: /Inativos/i })).not.toBeInTheDocument();
  });

  it('shows the placeholder when no option matches and closes on outside click', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <SelectFilter ariaLabel="Status" options={options} value="missing" onChange={vi.fn()} placeholder="Filtrar status" />
        <button type="button">Fora</button>
      </div>
    );

    const trigger = screen.getByRole('button', { name: 'Status' });
    expect(screen.getByText('Filtrar status')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole('button', { name: /Inativos/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fora' }));
    expect(screen.queryByRole('button', { name: /Inativos/i })).not.toBeInTheDocument();
  });
});
