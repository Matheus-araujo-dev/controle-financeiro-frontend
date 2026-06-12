import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/AppProviders';
import { appRouter } from './routes/router';

export default function App() {
  return (
    <AppProviders>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-surface font-body text-on-surface-variant">
            <span className="animate-pulse text-sm font-bold uppercase tracking-widest">Carregando...</span>
          </div>
        }
      >
        <RouterProvider router={appRouter} />
      </Suspense>
    </AppProviders>
  );
}
