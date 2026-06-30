import { createPortal } from 'react-dom';
import { useRef, useState, type ReactNode } from 'react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  side?: TooltipSide;
}

interface TooltipPos {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transform?: string;
}

const GAP = 8;

function getPosition(rect: DOMRect, side: TooltipSide): TooltipPos {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  switch (side) {
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + GAP, transform: 'translateY(-50%)' };

    case 'left':
      return { top: rect.top + rect.height / 2, right: vw - rect.left + GAP, transform: 'translateY(-50%)' };

    case 'bottom':
      return { top: rect.bottom + GAP, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };

    case 'top':
      return { bottom: vh - rect.top + GAP, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };

    default: {
      // auto: show below when near the top of viewport, above otherwise
      const goBelow = rect.top < 120;
      return goBelow
        ? { top: rect.bottom + GAP, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
        : { bottom: vh - rect.top + GAP, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
    }
  }
}

export function Tooltip({ content, children, disabled = false, side = 'auto' }: TooltipProps) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  function show() {
    if (disabled || !content || !wrapperRef.current) return;
    // display:contents makes the span invisible to layout — get rect from first real child
    const trigger = (wrapperRef.current.children[0] as HTMLElement | undefined) ?? wrapperRef.current;
    setPos(getPosition(trigger.getBoundingClientRect(), side));
  }

  function hide() {
    setPos(null);
  }

  return (
    <span ref={wrapperRef} style={{ display: 'contents' }} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && createPortal(
        <div style={{ position: 'fixed', zIndex: 300, pointerEvents: 'none', ...pos }}>
          <span
            className="block whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-on-surface"
            style={{
              backgroundColor: 'var(--color-surface-container-highest)',
              border: '1px solid rgba(43, 245, 142, 0.25)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(43,245,142,0.08)',
            }}
          >
            {content}
          </span>
        </div>,
        document.body
      )}
    </span>
  );
}
