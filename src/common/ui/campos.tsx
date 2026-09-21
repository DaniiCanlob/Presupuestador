import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/common/lib/cn';

const BASE =
  'block w-full rounded-lg border bg-card/70 px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground/70 transition-[border-color,box-shadow,background-color] ' +
  'hover:border-foreground/15 focus:border-ring focus:bg-card focus:outline-none ' +
  'focus:ring-4 focus:ring-ring/15 disabled:bg-muted/60 disabled:text-muted-foreground';

export interface CampoProps {
  etiqueta?: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  className?: string;
  children: ReactNode;
}

export function Campo({ etiqueta, ayuda, error, requerido, className, children }: CampoProps) {
  return (
    <label className={cn('block', className)}>
      {etiqueta && (
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {etiqueta}
          {requerido && <span className="text-destructive"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : ayuda ? (
        <span className="mt-1 block text-xs text-muted-foreground">{ayuda}</span>
      ) : null}
    </label>
  );
}

export const Entrada = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Entrada({ className, ...props }, ref) {
    return <input ref={ref} className={cn(BASE, className)} {...props} />;
  },
);

export const AreaTexto = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AreaTexto({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(BASE, 'resize-y', className)} {...props} />;
  },
);

export interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  opciones: { valor: string | number; etiqueta: string }[];
  vacio?: string;
}

export const Selector = forwardRef<HTMLSelectElement, SelectorProps>(function Selector(
  { opciones, vacio, className, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(BASE, 'cursor-pointer pr-8', className)} {...props}>
      {vacio !== undefined && <option value="">{vacio}</option>}
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ))}
    </select>
  );
});

/** Entrada numerica alineada a la derecha, pensada para tablas de cantidades. */
export const EntradaNumero = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function EntradaNumero({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        className={cn(BASE, 'text-right tabular-nums', className)}
        {...props}
      />
    );
  },
);
