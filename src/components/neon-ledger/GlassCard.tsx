import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'glass';
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  variant = 'solid',
  hoverable = false
}) => {
  const baseClasses = "rounded-2xl transition-all duration-300 overflow-hidden";
  const variantClasses = variant === 'glass' 
    ? "bg-surface-container/70 backdrop-blur-xl border border-outline-variant/10" 
    : "bg-surface-container";
  
  const hoverClasses = hoverable 
    ? "hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px] border border-transparent hover:border-primary/20" 
    : "";

  return (
    <div className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};
