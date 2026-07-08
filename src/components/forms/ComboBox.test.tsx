import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComboBox } from './ComboBox';

const OPTIONS = [
  { label: 'Alimentação', value: 'alim' },
  { label: 'Transporte', value: 'trans' },
  { label: 'Moradia', value: 'mora', disabled: true },
  { label: 'Lazer', value: 'lazer' },
];

describe('ComboBox', () => {
  it('renders placeholder and opens on focus', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} placeholder="Selecione..." onChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('placeholder', 'Selecione...');
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });

  it('selects an option by clicking', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'Alimentação' }));

    expect(onChange).toHaveBeenCalledWith('alim');
  });

  it('filters options when typing', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'trans');

    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.queryByText('Alimentação')).not.toBeInTheDocument();
  });

  it('ArrowDown opens dropdown and highlights first enabled option', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    // Close first so we can test ArrowDown-opens behavior
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('navigates options with ArrowDown/ArrowUp and selects with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={onChange} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    // ArrowDown → highlight index 0 (Alimentação)
    await user.keyboard('{ArrowDown}');
    // ArrowDown → highlight index 1 (Transporte)
    await user.keyboard('{ArrowDown}');
    // ArrowDown skips disabled Moradia → highlight index 3 (Lazer)
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('lazer');
  });

  it('ArrowUp wraps from top to last enabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={onChange} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    // ArrowUp from -1 wraps to last enabled item
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('lazer');
  });

  it('Enter with no highlight selects first enabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('alim');
  });

  it('Escape closes the dropdown', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('Tab closes the dropdown', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Tab}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not call onChange for disabled options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    const disabledBtn = screen.getByRole('button', { name: 'Moradia' });
    await user.click(disabledBtn);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows "Nenhuma opção disponível" when no options match filter', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'xyzxyz');

    expect(screen.getByText('Nenhuma opção disponível')).toBeInTheDocument();
  });

  it('renders selected value as input text', () => {
    render(<ComboBox options={OPTIONS} value="trans" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('Transporte');
  });

  it('calls onAddNew when add button is clicked', async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} onAddNew={onAddNew} addNewLabel="Nova categoria" />);

    await user.click(screen.getByRole('button', { name: 'Nova categoria' }));
    expect(onAddNew).toHaveBeenCalled();
  });

  it('shows add-new inside dropdown and closes on click', async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} onAddNew={onAddNew} addNewLabel="Novo item" />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    const addBtns = screen.getAllByRole('button', { name: /Novo item/i });
    await user.click(addBtns[addBtns.length - 1]);

    expect(onAddNew).toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders legacy <option> children', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ComboBox onChange={onChange}>
        <option value="">Selecione...</option>
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </ComboBox>
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'Beta' }));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('does not open dropdown when disabled', async () => {
    const user = userEvent.setup();
    render(<ComboBox options={OPTIONS} onChange={vi.fn()} disabled />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes dropdown on outside click and restores selected label', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ComboBox options={OPTIONS} value="alim" onChange={vi.fn()} />
        <button type="button">Fora</button>
      </div>
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Fora' }));
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('Alimentação');
  });
});
