import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'chunk-reload-attempted';

/**
 * Igual ao `lazy` do React, mas resiliente a falhas de import dinâmico — o caso clássico
 * de "Failed to fetch dynamically imported module" que ocorre quando um deploy troca os
 * chunks com hash e o navegador ainda referencia os antigos (ou por falha transiente de CDN).
 *
 * Estratégia: tenta o import; em falha, tenta uma segunda vez; persistindo, força UM reload
 * completo da página (busca index.html e chunks novos). Uma flag em sessionStorage evita
 * loop de reload — se mesmo após recarregar continuar falhando, o erro é propagado.
 */
// Mesma assinatura genérica do React.lazy (ComponentType<any>) para aceitar componentes
// com quaisquer props sem atrito de tipos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await factory();
      window.sessionStorage.removeItem(RELOAD_FLAG);
      return component;
    } catch (error) {
      // Segunda tentativa cobre falhas transientes de rede/CDN.
      try {
        const component = await factory();
        window.sessionStorage.removeItem(RELOAD_FLAG);
        return component;
      } catch {
        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG);
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          // Mantém o Suspense em loading enquanto a página recarrega.
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }
    }
  });
}
