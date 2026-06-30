import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from '../ui/Tooltip';

type IconActionButtonProps = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'default' | 'primary' | 'text' | 'link';
};

function IconActionButtonComponent({
  label,
  icon,
  href,
  onClick,
  danger = false,
  disabled = false,
  loading = false,
  type: _type = 'default'
}: IconActionButtonProps) {
  const classes = `inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent bg-transparent text-[18px] leading-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-primary/10 active:bg-transparent active:text-primary focus:bg-transparent ${
    danger ? 'text-error hover:text-error' : 'text-primary hover:text-primary'
  }`;

  const style = danger ? undefined : { color: 'var(--color-primary)' };

  const iconContent = loading ? (
    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
  ) : (
    <span className="flex items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
      {icon}
    </span>
  );

  const trigger = href && !disabled ? (
    <Link to={href} aria-label={label} className={classes} style={style}>
      {iconContent}
    </Link>
  ) : (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      style={style}
    >
      {iconContent}
    </button>
  );

  return (
    <Tooltip content={label} disabled={disabled}>
      {trigger}
    </Tooltip>
  );
}

export const IconActionButton = React.memo(IconActionButtonComponent);
