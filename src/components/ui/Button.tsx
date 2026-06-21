import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 no-underline';

// Important (`!`) garante que o Button prevaleça sobre o reset de âncora do AntD,
// que é "unlayered" e venceria as utilities do Tailwind v4 (@layer) em elementos <a>.
const variantClass: Record<ButtonVariant, string> = {
  primary: '!border !border-primary/40 !bg-primary/15 !text-primary hover:!bg-primary/25',
  secondary:
    '!border !border-white/12 !bg-surface-container !text-on-surface hover:!border-white/25 hover:!bg-surface-container-high',
  ghost: '!text-on-surface-variant hover:!bg-white/5 hover:!text-on-surface',
  danger: '!border !border-error/40 !bg-error/10 !text-error hover:!bg-error/20'
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-14 px-5 text-base'
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

type ButtonElementProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined };

type LinkElementProps = CommonProps & { to: string };

export function Button(props: ButtonElementProps | LinkElementProps) {
  const { variant = 'primary', size = 'md', icon, iconRight, loading = false, className = '', children } = props;
  const classes = `${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className}`;
  const content = (
    <>
      {loading ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : icon}
      {children}
      {iconRight}
    </>
  );

  if ('to' in props && props.to !== undefined) {
    return (
      <Link to={props.to} className={classes}>
        {content}
      </Link>
    );
  }

  const { variant: _v, size: _s, icon: _i, iconRight: _ir, loading: _l, className: _c, children: _ch, disabled, ...buttonProps } =
    props as ButtonElementProps;
  return (
    <button className={classes} disabled={disabled || loading} {...buttonProps}>
      {content}
    </button>
  );
}
