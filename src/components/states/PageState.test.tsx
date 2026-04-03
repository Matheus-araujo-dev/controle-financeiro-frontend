import { render, screen } from '@testing-library/react';
import { PageState } from './PageState';

describe('PageState', () => {
  it('renders the loading state', () => {
    render(<PageState state="loading" title="Carregando dashboard" />);

    expect(screen.getByTestId('page-state-loading')).toBeInTheDocument();
    expect(screen.getByText('Carregando dashboard')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    render(<PageState state="error" title="Falha" subtitle="Tente novamente." />);

    expect(screen.getByTestId('page-state-error')).toBeInTheDocument();
    expect(screen.getByText('Falha')).toBeInTheDocument();
    expect(screen.getByText('Tente novamente.')).toBeInTheDocument();
  });
});
