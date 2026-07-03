import { useContext } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { PageHeaderActionsSlotContext } from './PageHeaderActionsSlot';
import { WorkspaceActionsSlotContext } from './WorkspaceActionsSlot';

interface ListPageShellProps {
  actions?: ReactNode;
  summary?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  summaryColumns?: 2 | 3 | 4;
}

const summaryGridCols: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 xl:grid-cols-4'
};

export function ListPageShell({
  actions,
  summary,
  filters,
  children,
  summaryColumns = 3
}: ListPageShellProps) {
  const workspaceSlot = useContext(WorkspaceActionsSlotContext);
  const headerSlot = useContext(PageHeaderActionsSlotContext);

  // Workspace slot takes priority; header slot is the fallback for standalone pages.
  // undefined = no context → render inline; null = context exists but not mounted yet → hide.
  const activeSlot = workspaceSlot !== undefined ? workspaceSlot : headerSlot;
  const renderInline = activeSlot === undefined;

  const actionsContent = actions ? (
    <div className="flex flex-wrap items-center gap-3">{actions}</div>
  ) : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {renderInline
        ? actionsContent
        : activeSlot && actionsContent ? createPortal(actionsContent, activeSlot) : null}

      {summary && (
        <section className={`grid gap-3 sm:gap-4 ${summaryGridCols[summaryColumns]}`}>{summary}</section>
      )}

      {filters}

      {children}
    </div>
  );
}
