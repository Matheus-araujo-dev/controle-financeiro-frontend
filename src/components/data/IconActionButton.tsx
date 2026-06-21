import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

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

  const content = loading ? (
    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
  ) : (
    <span className="flex items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
      {icon}
    </span>
  );

  if (href && !disabled) {
    return (
      <Link to={href} aria-label={label} title={label} className={classes} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      style={style}
    >
      {content}
    </button>
  );
}

export const IconActionButton = React.memo(IconActionButtonComponent);
