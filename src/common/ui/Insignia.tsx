import type { ReactNode } from 'react';
import { cn } from '@/common/lib/cn';

export function Insignia({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        'bg-muted text-muted-foreground ring-border',
        className,
      )}
    >
      {children}
    </span>
  );
}
