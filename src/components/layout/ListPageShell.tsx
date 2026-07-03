import { useContext } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
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
  const actionsSlot = useContext(WorkspaceActionsSlotContext);
  const isInWorkspace = actionsSlot !== undefined;

  const actionsContent = actions ? (
    <div className="flex flex-wrap items-center justify-end gap-3">{actions}</div>
  ) : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* When inside a workspace, portal actions to the tab-bar slot; otherwise render inline */}
      {isInWorkspace
        ? actionsSlot && actionsContent ? createPortal(actionsContent, actionsSlot) : null
        : actionsContent}

      {summary && (
        <section className={`grid gap-3 sm:gap-4 ${summaryGridCols[summaryColumns]}`}>{summary}</section>
      )}

      {filters}

      {children}
    </div>
  );
}
