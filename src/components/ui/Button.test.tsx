import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button } from './Button';

describe('Button', () => {
  it('renders a button with default primary variant', () => {
    render(<MemoryRouter><Button>Salvar</Button></MemoryRouter>);
    const btn = screen.getByRole('button', { name: 'Salvar' });
    expect(btn).toBeInTheDocument();
  });

  it('renders as Link when `to` prop is provided', () => {
    render(<MemoryRouter><Button to="/destino">Ir</Button></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Ir' })).toHaveAttribute('href', '/destino');
  });

  it('shows spinner instead of icon when loading', () => {
    const { container } = render(
      <MemoryRouter>
        <Button loading icon={<span data-testid="icon">★</span>}>Aguarde</Button>
      </MemoryRouter>
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders icon when not loading', () => {
    render(
      <MemoryRouter>
        <Button icon={<span data-testid="icon">★</span>}>Ação</Button>
      </MemoryRouter>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders iconRight when provided', () => {
    render(
      <MemoryRouter>
        <Button iconRight={<span data-testid="icon-right">→</span>}>Ação</Button>
      </MemoryRouter>
    );
    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
  });

  it('renders disabled button when disabled prop is set', () => {
    render(<MemoryRouter><Button disabled>Inativo</Button></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Inativo' })).toBeDisabled();
  });

  it('applies secondary variant class', () => {
    const { container } = render(
      <MemoryRouter><Button variant="secondary">Sec</Button></MemoryRouter>
    );
    expect(container.querySelector('button')?.className).toContain('bg-surface-container');
  });

  it('applies ghost variant', () => {
    const { container } = render(
      <MemoryRouter><Button variant="ghost">Ghost</Button></MemoryRouter>
    );
    expect(container.querySelector('button')?.className).toContain('text-on-surface-variant');
  });

  it('applies danger variant', () => {
    const { container } = render(
      <MemoryRouter><Button variant="danger">Danger</Button></MemoryRouter>
    );
    expect(container.querySelector('button')?.className).toContain('text-error');
  });

  it('applies sm and lg size classes', () => {
    const { container: c1 } = render(<MemoryRouter><Button size="sm">S</Button></MemoryRouter>);
    expect(c1.querySelector('button')?.className).toContain('h-10');

    const { container: c2 } = render(<MemoryRouter><Button size="lg">L</Button></MemoryRouter>);
    expect(c2.querySelector('button')?.className).toContain('h-14');
  });

  it('is disabled when loading', () => {
    render(<MemoryRouter><Button loading>Carregando</Button></MemoryRouter>);
    expect(screen.getByRole('button', { name: /Carregando/i })).toBeDisabled();
  });
});
