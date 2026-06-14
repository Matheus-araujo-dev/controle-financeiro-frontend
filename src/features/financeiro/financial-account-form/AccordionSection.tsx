import { useState, type ReactNode } from 'react';
import { DownOutlined } from '@ant-design/icons';

type AccordionSectionProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
};

export function AccordionSection({ icon, title, subtitle, defaultOpen = false, badge, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-container-low rounded-3xl border border-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-7 py-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="text-on-surface-variant text-lg">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-base font-headline font-bold text-on-surface">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-on-surface-variant">{subtitle}</span>}
        </span>
        {badge}
        <DownOutlined className={`text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={open ? 'px-7 pb-7' : 'hidden'}>{children}</div>
    </div>
  );
}
