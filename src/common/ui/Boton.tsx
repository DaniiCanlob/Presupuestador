import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/common/lib/cn';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';
type Tamano = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-primary text-primary-foreground shadow-sm hover:brightness-[1.04] active:brightness-95',
  secundario:
    'border bg-card/70 text-foreground backdrop-blur-sm hover:bg-card hover:border-foreground/15',
  fantasma: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
  peligro: 'bg-destructive text-destructive-foreground shadow-sm hover:brightness-110',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: ReactNode;
}

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = 'primario', tamano = 'md', cargando, icono, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-[background-color,border-color,filter,box-shadow] duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
      {...props}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icono}
      {children}
    </button>
  );
});
