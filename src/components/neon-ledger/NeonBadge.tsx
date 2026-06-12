import React from 'react';

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'neutral';
  fill?: 'solid' | 'ghost';
  size?: 'sm' | 'md';
}

const NeonBadgeComponent: React.FC<NeonBadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  fill = 'ghost',
  size = 'md'
}) => {
  const baseClasses = "font-label uppercase tracking-widest font-bold rounded-full text-center inline-flex items-center justify-center";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-[11px]"
  };

  const variants = {
    primary: {
      solid: "bg-primary text-on-primary",
      ghost: "bg-primary/10 text-primary border border-primary/20"
    },
    secondary: {
      solid: "bg-secondary text-on-secondary",
      ghost: "bg-secondary/10 text-secondary border border-secondary/20"
    },
    error: {
      solid: "bg-error text-on-error",
      ghost: "bg-error/10 text-error border border-error/20"
    },
    warning: {
      solid: "bg-warning text-[#3a2a00]",
      ghost: "bg-warning/10 text-warning border border-warning/20"
    },
    info: {
      solid: "bg-surface-bright text-on-surface",
      ghost: "bg-surface-container-highest text-on-surface border border-outline-variant/30"
    },
    neutral: {
      solid: "bg-surface-container-highest text-on-surface-variant",
      ghost: "bg-transparent text-on-surface-variant border border-outline-variant/20"
    }
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variants[variant][fill]}`}>
      {children}
    </span>
  );
};

export const NeonBadge = React.memo(NeonBadgeComponent);
