import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('renders all preset color buttons', () => {
    render(<ColorPicker value={null} onChange={vi.fn()} />);
    expect(screen.getByTitle('Esmeralda')).toBeInTheDocument();
    expect(screen.getByTitle('Verde')).toBeInTheDocument();
    expect(screen.getByTitle('Vermelho')).toBeInTheDocument();
  });

  it('calls onChange when a color is clicked', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value={null} onChange={onChange} />);
    await userEvent.click(screen.getByTitle('Âmbar'));
    expect(onChange).toHaveBeenCalledWith('#eab308');
  });

  it('applies selected style to the currently selected color', () => {
    render(<ColorPicker value="#2bf58e" onChange={vi.fn()} />);
    const esmeraldaBtn = screen.getByTitle('Esmeralda');
    expect(esmeraldaBtn.className).toContain('scale-110');
  });

  it('applies non-selected style to unselected colors', () => {
    render(<ColorPicker value="#2bf58e" onChange={vi.fn()} />);
    const verdeBtn = screen.getByTitle('Verde');
    expect(verdeBtn.className).toContain('border-transparent');
  });
});
