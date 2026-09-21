import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/common/lib/cn';

/**
 * Tabla sobre superficie sólida: los números se leen mejor sin traslucidez
 * detrás. El vidrio se reserva para barras y paneles.
 */
export function Tabla({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="panel overflow-x-auto">
      <table className={cn('min-w-full border-separate border-spacing-0', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function Encabezado({ children }: { children: ReactNode }) {
  return (
    <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted/80 [&_th]:backdrop-blur">
      {children}
    </thead>
  );
}

export function Cuerpo({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Th({
  className,
  numerico,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { numerico?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground',
        numerico ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  numerico,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numerico?: boolean }) {
  return (
    <td
      className={cn(
        'border-b border-border/60 px-3 py-2 text-sm',
        numerico && 'text-right tabular-nums',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function Fila({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-accent/35', className)} {...props}>
      {children}
    </tr>
  );
}
