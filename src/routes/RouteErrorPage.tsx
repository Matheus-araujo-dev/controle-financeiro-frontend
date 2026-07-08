import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '../components/ui/Button';

/**
 * UI amigável para erros de rota/loader/import dinâmico do React Router.
 * O React Router intercepta esses erros ANTES do ErrorBoundary React de topo, então
 * sem um `errorElement` o usuário veria a tela crua padrão do router.
 */
export function RouteErrorPage() {
  const error = useRouteError();

  let message = 'Ocorreu um erro inesperado ao carregar esta página.';
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? 'Página não encontrada.' : `Erro ${error.status}: ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const isChunkError = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message);

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
          {isChunkError
            ? 'Uma nova versão do app foi publicada. Recarregue para continuar.'
            : message}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => window.location.reload()}
            icon={<span aria-hidden="true" className="material-symbols-outlined text-sm">refresh</span>}
          >
            Recarregar página
          </Button>
          <Button type="button" variant="secondary" onClick={() => (window.location.href = '/dashboard')}>
            Ir para o início
          </Button>
        </div>
      </div>
    </div>
  );
}
