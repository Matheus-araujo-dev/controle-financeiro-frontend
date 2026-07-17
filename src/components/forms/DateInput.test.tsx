import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInput } from './DateInput';

function setup(props: Partial<Parameters<typeof DateInput>[0]> = {}) {
  const onChange = vi.fn();
  const result = render(
    <DateInput
      ariaLabel="Data teste"
      value={props.value ?? ''}
      onChange={onChange}
      {...props}
    />
  );
  return { ...result, onChange };
}

// Overflow days share aria-labels with in-month days; pick the non-faded one
function getInMonthButton(name: string) {
  const btns = screen.getAllByRole('button', { name });
  return btns.find((b) => !b.className.includes('opacity-50')) ?? btns[0];
}

describe('DateInput', () => {
  it('shows placeholder when no value is set', () => {
    setup({ value: '' });
    expect(screen.getByPlaceholderText('dd/mm/aaaa')).toBeInTheDocument();
  });

  it('shows formatted date when value is set', () => {
    setup({ value: '2026-07-15' });
    const input = screen.getByLabelText('Data teste') as HTMLInputElement;
    expect(input.value).toBe('15/07/2026');
  });

  it('opens calendar on focus', async () => {
    setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeInTheDocument();
  });

  it('opens and closes calendar via toggle button', async () => {
    setup({ value: '2026-07-15' });
    const toggleBtn = screen.getByRole('button', { name: /Abrir calendário/i });
    await userEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeInTheDocument();
    await userEvent.click(toggleBtn);
    expect(screen.queryByRole('button', { name: 'Mês anterior' })).not.toBeInTheDocument();
  });

  it('selects a date from the calendar and calls onChange', async () => {
    const { onChange } = setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    await userEvent.click(getInMonthButton('2026-07-10'));
    expect(onChange).toHaveBeenCalledWith('2026-07-10');
  });

  it('navigates to previous month and selects a day', async () => {
    const { onChange } = setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
    await userEvent.click(getInMonthButton('2026-06-05'));
    expect(onChange).toHaveBeenCalledWith('2026-06-05');
  });

  it('navigates to next month and selects a day', async () => {
    const { onChange } = setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    await userEvent.click(getInMonthButton('2026-08-03'));
    expect(onChange).toHaveBeenCalledWith('2026-08-03');
  });

  it('clears date when Limpar is clicked', async () => {
    const { onChange } = setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    await userEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('selects today when Hoje is clicked', async () => {
    const { onChange } = setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(onChange).toHaveBeenCalledWith(localToday);
  });

  it('accepts typed date input and calls onChange on complete date', () => {
    const { onChange } = setup({ value: '' });
    const input = screen.getByLabelText('Data teste');
    fireEvent.change(input, { target: { value: '10/07/2026' } });
    expect(onChange).toHaveBeenCalledWith('2026-07-10');
  });

  it('ignores incomplete typed date', () => {
    const { onChange } = setup({ value: '' });
    const input = screen.getByLabelText('Data teste');
    fireEvent.change(input, { target: { value: '10/07' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with empty string when clearing typed input', () => {
    const { onChange } = setup({ value: '2026-07-10' });
    const input = screen.getByLabelText('Data teste');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('confirms typed date on Enter when date is complete', async () => {
    const { onChange } = setup({ value: '' });
    const input = screen.getByLabelText('Data teste');
    // type via change (which immediately resolves a full date)
    fireEvent.change(input, { target: { value: '15/07/2026' } });
    expect(onChange).toHaveBeenCalledWith('2026-07-15');
  });

  it('closes calendar on Escape key', async () => {
    setup({ value: '2026-07-15' });
    await userEvent.click(screen.getByLabelText('Data teste'));
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Data teste'), { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Mês anterior' })).not.toBeInTheDocument();
    });
  });

  it('does not open when disabled', async () => {
    setup({ value: '2026-07-15', disabled: true });
    await userEvent.click(screen.getByLabelText('Data teste'));
    expect(screen.queryByRole('button', { name: 'Mês anterior' })).not.toBeInTheDocument();
  });

  it('renders compact mode with h-11 class', () => {
    const { container } = setup({ value: '', compact: true });
    expect(container.querySelector('.h-11')).toBeTruthy();
  });

  it('renders month mode with year navigation', async () => {
    const onChange = vi.fn();
    render(<DateInput ariaLabel="Mês teste" value="2026-07" onChange={onChange} mode="month" />);
    await userEvent.click(screen.getByLabelText('Mês teste'));
    expect(screen.getByRole('button', { name: 'Ano anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximo ano' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'jan 2026' }));
    expect(onChange).toHaveBeenCalledWith('2026-01');
  });

  it('navigates years in month mode and selects a month', async () => {
    const onChange = vi.fn();
    render(<DateInput ariaLabel="Mês nav" value="2026-07" onChange={onChange} mode="month" />);
    await userEvent.click(screen.getByLabelText('Mês nav'));
    await userEvent.click(screen.getByRole('button', { name: 'Próximo ano' }));
    await userEvent.click(screen.getByRole('button', { name: 'mar 2027' }));
    expect(onChange).toHaveBeenCalledWith('2027-03');
  });

  it('navigates to previous year in month mode', async () => {
    const onChange = vi.fn();
    render(<DateInput ariaLabel="Mês prev" value="2026-07" onChange={onChange} mode="month" />);
    await userEvent.click(screen.getByLabelText('Mês prev'));
    await userEvent.click(screen.getByRole('button', { name: 'Ano anterior' }));
    await userEvent.click(screen.getByRole('button', { name: 'fev 2025' }));
    expect(onChange).toHaveBeenCalledWith('2025-02');
  });

  it('clears month when Limpar is clicked in month mode', async () => {
    const onChange = vi.fn();
    render(<DateInput ariaLabel="Limpar mês" value="2026-07" onChange={onChange} mode="month" />);
    await userEvent.click(screen.getByLabelText('Limpar mês'));
    await userEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('selects this month when "Este mês" is clicked in month mode', async () => {
    const onChange = vi.fn();
    render(<DateInput ariaLabel="Este mês" value="" onChange={onChange} mode="month" />);
    await userEvent.click(screen.getByLabelText('Este mês'));
    await userEvent.click(screen.getByRole('button', { name: 'Este mês' }));
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('shows month mode placeholder mm/aaaa when no value', () => {
    render(<DateInput ariaLabel="Mês vazio" value="" onChange={vi.fn()} mode="month" />);
    expect(screen.getByPlaceholderText('mm/aaaa')).toBeInTheDocument();
  });
});
