import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Erro controlado de teste');
  return <div>Conteúdo normal</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  it('renders default error UI with message when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Erro controlado de teste')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recarregar página/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('renders default message when error has no message', () => {
    function ThrowNoMessage(): React.ReactElement {
      throw {} as Error;
    }
    render(
      <ErrorBoundary>
        <ThrowNoMessage />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
  });

  it('renders custom fallback instead of default UI', () => {
    render(
      <ErrorBoundary fallback={<p>Página com erro</p>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Página com erro')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });

  it('resets and re-renders children after clicking Tentar novamente', async () => {
    let shouldThrowRef = true;
    function ThrowRefBased() {
      if (shouldThrowRef) throw new Error('Erro de teste');
      return <div>Conteúdo normal</div>;
    }

    render(
      <ErrorBoundary>
        <ThrowRefBased />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    shouldThrowRef = false;
    await userEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });
});
