import { Component, type ReactNode } from 'react';
import { Button, Result } from 'antd';

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
          <Result
            status="error"
            title="Algo deu errado"
            subTitle={this.state.message ?? 'Ocorreu um erro inesperado nesta página.'}
            extra={[
              <Button key="reload" type="primary" onClick={() => window.location.reload()}>
                Recarregar página
              </Button>,
              <Button key="reset" onClick={this.reset}>
                Tentar novamente
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
