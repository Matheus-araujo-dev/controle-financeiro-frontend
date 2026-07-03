import { createContext } from 'react';

/**
 * Context for hoisting page action buttons into a parent workspace header slot.
 * - undefined  → no workspace wrapping this component; render actions inline
 * - null       → workspace exists but slot div not mounted yet; suppress inline render
 * - HTMLElement → portal actions into this element
 */
export const WorkspaceActionsSlotContext = createContext<HTMLElement | null | undefined>(undefined);
