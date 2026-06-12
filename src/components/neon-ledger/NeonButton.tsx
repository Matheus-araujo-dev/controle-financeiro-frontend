import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const NeonButtonComponent: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '',
  ...props 
}) => {
  const baseClasses = "flex items-center justify-center gap-2 font-headline font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variantClasses = {
    primary: "bg-gradient-to-br from-primary to-primary-container text-on-primary hover:shadow-[0_0_20px_rgba(63,255,139,0.3)] hover:brightness-110",
    secondary: "bg-surface-container-highest text-on-surface hover:bg-surface-bright border border-outline-variant/20 hover:border-primary/40",
    ghost: "bg-transparent text-on-surface hover:bg-surface-container-highest",
    danger: "bg-error-container text-on-error-container hover:bg-error hover:text-on-error"
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};

export const NeonButton = React.memo(NeonButtonComponent);
