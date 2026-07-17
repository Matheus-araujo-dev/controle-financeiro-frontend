import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectFilter } from './MultiSelectFilter';

const options = [
  { label: 'Alta', value: 'Alta' },
  { label: 'Média', value: 'Media' },
  { label: 'Baixa', value: 'Baixa' },
];

describe('MultiSelectFilter', () => {
  it('opens dropdown and selects an option', async () => {
    const onChange = vi.fn();
    render(<MultiSelectFilter ariaLabel="Prioridade" options={options} value={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Prioridade' }));
    await userEvent.click(screen.getByRole('button', { name: 'Alta' }));
    expect(onChange).toHaveBeenCalledWith(['Alta']);
  });

  it('covers filteredOptions filter arrow by typing in searchable mode', async () => {
    const onChange = vi.fn();
    render(<MultiSelectFilter ariaLabel="Prioridade" options={options} value={[]} onChange={onChange} searchable />);
    await userEvent.click(screen.getByRole('button', { name: 'Prioridade' }));
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'Alta');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Alta' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Média' })).not.toBeInTheDocument();
    });
  });

  it('covers onClick clear selection button when value is non-empty', async () => {
    const onChange = vi.fn();
    render(<MultiSelectFilter ariaLabel="Prioridade" options={options} value={['Alta']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
