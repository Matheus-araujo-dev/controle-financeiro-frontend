import type { ReactNode } from 'react';

type FormSectionProps = {
  title?: string;
  eyebrow?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  sticky?: boolean;
  compact?: boolean;
};

export function FormSection({ title, eyebrow, icon, children, className = '', sticky = false, compact = false }: FormSectionProps) {
  return (
    <section
      className={`bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-lg ${sticky ? 'sticky top-28' : ''} ${className}`}
    >
      {(title || eyebrow || icon) && (
        <div className={`mb-6 flex items-center gap-3 ${compact ? 'mb-5' : ''}`}>
          {icon && (
            <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shadow border border-white/5 shrink-0 text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{eyebrow}</p>}
            {title && <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">{title}</h3>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
