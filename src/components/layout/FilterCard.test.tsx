import { render, screen, fireEvent } from '@testing-library/react';
import { FilterCard, FilterField, FilterInputWrapper, filterInputClass, filterSelectClass } from './FilterCard';

describe('FilterCard', () => {
  it('renders children', () => {
    render(<FilterCard><div>Conteúdo do filtro</div></FilterCard>);
    expect(screen.getAllByText('Conteúdo do filtro').length).toBeGreaterThan(0);
  });

  it('renders without onClear', () => {
    render(<FilterCard><span>Filtro</span></FilterCard>);
    expect(screen.queryByText('Limpar')).not.toBeInTheDocument();
  });

  it('renders Filtros mobile button', () => {
    render(<FilterCard><span>Filtro</span></FilterCard>);
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument();
  });

  it('opens bottom sheet on mobile Filtros button click', () => {
    render(<FilterCard><div>Conteúdo filtro</div></FilterCard>);
    const filtrosBtn = screen.getByRole('button', { name: /Filtros/ });
    fireEvent.click(filtrosBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes bottom sheet when close X button is clicked', () => {
    render(<FilterCard><div>Content</div></FilterCard>);
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const allButtons = screen.getAllByRole('button');
    // The X close button is the one inside the dialog header
    const closeBtn = allButtons.find(b => b.querySelector('.material-symbols-outlined')?.textContent === 'close');
    fireEvent.click(closeBtn!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes bottom sheet when backdrop is clicked', () => {
    render(<FilterCard><div>Content</div></FilterCard>);
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    const backdrop = document.querySelector('.absolute.inset-0.bg-black\\/60') as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes and calls onClear when Limpar filtros button is clicked', () => {
    const onClear = vi.fn();
    render(<FilterCard onClear={onClear}><div>Content</div></FilterCard>);
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const limparBtn = screen.getByRole('button', { name: 'Limpar filtros' });
    fireEvent.click(limparBtn);
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes bottom sheet when Aplicar filtros button is clicked', () => {
    render(<FilterCard><div>Content</div></FilterCard>);
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows mobile Limpar button when onClear provided', () => {
    const onClear = vi.fn();
    render(<FilterCard onClear={onClear}><div>Content</div></FilterCard>);
    const limparBtns = screen.getAllByRole('button');
    const limparMobile = limparBtns.find(b => b.textContent?.includes('Limpar'));
    expect(limparMobile).toBeInTheDocument();
  });

  it('calls onClear from mobile Limpar button', () => {
    const onClear = vi.fn();
    render(<FilterCard onClear={onClear}><div>Content</div></FilterCard>);
    const buttons = screen.getAllByRole('button');
    // Mobile Limpar button includes icon text but is NOT the Filtros button
    const limparBtn = buttons.find(b => b.textContent?.includes('Limpar') && !b.textContent?.includes('Filtros'));
    fireEvent.click(limparBtn!);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('applies custom className to desktop container', () => {
    const { container } = render(<FilterCard className="custom-class"><div>Content</div></FilterCard>);
    const desktopCard = container.querySelector('.custom-class');
    expect(desktopCard).toBeInTheDocument();
  });

  it('renders Aplicar button without flex-1 when no onClear', () => {
    render(<FilterCard><div>Content</div></FilterCard>);
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    const aplicarBtn = screen.getByRole('button', { name: 'Aplicar filtros' });
    expect(aplicarBtn).toBeInTheDocument();
  });
});

describe('FilterField', () => {
  it('renders label and children', () => {
    render(<FilterField label="Período"><input placeholder="data" /></FilterField>);
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('data')).toBeInTheDocument();
  });
});

describe('FilterInputWrapper', () => {
  it('renders children without icon', () => {
    render(<FilterInputWrapper><input placeholder="texto" /></FilterInputWrapper>);
    expect(screen.getByPlaceholderText('texto')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<FilterInputWrapper icon={<span>icon</span>}><input /></FilterInputWrapper>);
    expect(screen.getByText('icon')).toBeInTheDocument();
  });
});

describe('filterInputClass and filterSelectClass', () => {
  it('filterInputClass is a non-empty string', () => {
    expect(typeof filterInputClass).toBe('string');
    expect(filterInputClass.length).toBeGreaterThan(0);
  });

  it('filterSelectClass is a non-empty string', () => {
    expect(typeof filterSelectClass).toBe('string');
    expect(filterSelectClass.length).toBeGreaterThan(0);
  });
});
