import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

type PageStateProps =
  | {
      state: 'loading';
      title?: string;
    }
  | {
      state: 'empty' | 'error';
      title: string;
      subtitle: string;
      actionLabel?: string;
      onAction?: () => void;
      icon?: ReactNode;
    };

export function PageState(props: PageStateProps) {
  if (props.state === 'loading') {
    return (
      <div
        className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 text-center"
        data-testid="page-state-loading"
      >
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        <p className="font-headline text-lg font-bold text-on-surface">{props.title ?? 'Carregando...'}</p>
      </div>
    );
  }

  const icon =
    props.icon ?? (
      <span className={`material-symbols-outlined text-5xl ${props.state === 'error' ? 'text-error' : 'text-primary'}`}>
        {props.state === 'error' ? 'error' : 'inbox'}
      </span>
    );

  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 text-center"
      data-testid={`page-state-${props.state}`}
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">{icon}</div>
      <h2 className="font-headline text-2xl font-bold text-on-surface">{props.title}</h2>
      <p className="mt-2 max-w-xl text-sm font-medium text-on-surface-variant">{props.subtitle}</p>
      {props.onAction && props.actionLabel ? (
        <Button
          type="button"
          className="mt-8"
          onClick={props.onAction}
          icon={<span aria-hidden="true" className="material-symbols-outlined text-sm">refresh</span>}
        >
          {props.actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
