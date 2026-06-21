import { Component, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-8">
          <div className="flex w-full max-w-2xl flex-col items-center rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 text-center shadow-2xl">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error">
              <span aria-hidden="true" className="material-symbols-outlined text-5xl">
                error
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">Algo deu errado</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-on-surface-variant">
              {this.state.message ?? 'Ocorreu um erro inesperado nesta página.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => window.location.reload()}
                icon={<span aria-hidden="true" className="material-symbols-outlined text-sm">refresh</span>}
              >
                Recarregar página
              </Button>
              <Button type="button" variant="secondary" onClick={this.reset}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
