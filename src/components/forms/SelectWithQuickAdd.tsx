import type { ComponentPropsWithoutRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';

type SelectWithQuickAddProps = ComponentPropsWithoutRef<'select'> & {
  onAddNew?: () => void;
};

export function SelectWithQuickAdd({ onAddNew, disabled, className, children, ...props }: SelectWithQuickAddProps) {
  return (
    <div className="flex items-stretch">
      <select
        {...props}
        disabled={disabled}
        className={`${className ?? ''} flex-1 !rounded-r-none`}
      >
        {children}
      </select>
      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          disabled={disabled}
          title="Adicionar novo"
          className="shrink-0 px-3 bg-surface-container-highest rounded-r-2xl text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-l border-white/5"
        >
          <PlusOutlined />
        </button>
      )}
    </div>
  );
}
