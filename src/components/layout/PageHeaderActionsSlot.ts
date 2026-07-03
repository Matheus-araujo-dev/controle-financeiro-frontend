import { createContext } from 'react';

/**
 * Context for hoisting page action buttons into the page header (same line as the h1 title).
 * Provided by NeonLedgerLayout. Same tri-state semantics as WorkspaceActionsSlotContext:
 * - undefined  → no layout wrapping; render actions inline
 * - null       → layout exists but slot div not mounted yet; suppress inline render
 * - HTMLElement → portal actions into this element
 */
export const PageHeaderActionsSlotContext = createContext<HTMLElement | null | undefined>(undefined);
