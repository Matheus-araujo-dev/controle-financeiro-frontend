import { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { lazyWithRetry } from './lazy-with-retry';

describe('lazyWithRetry', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    window.sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('renderiza o componente quando o import funciona', async () => {
    const Comp = lazyWithRetry(async () => ({ default: () => <div>conteudo ok</div> }));
    render(
      <Suspense fallback={<div>carregando</div>}>
        <Comp />
      </Suspense>
    );
    expect(await screen.findByText('conteudo ok')).toBeInTheDocument();
  });

  it('tenta novamente uma vez e entao renderiza', async () => {
    let calls = 0;
    const factory = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('falha transiente');
      return { default: () => <div>recuperou</div> };
    });

    const Comp = lazyWithRetry(factory);
    render(
      <Suspense fallback={<div>carregando</div>}>
        <Comp />
      </Suspense>
    );

    expect(await screen.findByText('recuperou')).toBeInTheDocument();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('forca reload quando falha persistente e sem tentativa previa', async () => {
    const factory = vi.fn(async () => {
      throw new Error('Failed to fetch dynamically imported module');
    });

    const Comp = lazyWithRetry(factory);
    render(
      <Suspense fallback={<div>carregando</div>}>
        <Comp />
      </Suspense>
    );

    await waitFor(() => expect(window.location.reload).toHaveBeenCalledOnce());
    expect(window.sessionStorage.getItem('chunk-reload-attempted')).toBe('1');
  });
});
