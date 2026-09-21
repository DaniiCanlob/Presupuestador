import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/common/lib/cn';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  ancho?: 'sm' | 'md' | 'lg' | 'xl';
  pie?: ReactNode;
  children: ReactNode;
}

const ANCHOS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
} as const;

export function Modal({ abierto, onCerrar, titulo, descripcion, ancho = 'md', pie, children }: ModalProps) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="fixed inset-0 bg-foreground/20 backdrop-blur-[3px] animate-in fade-in duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          'vidrio relative z-10 w-full rounded-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          ANCHOS[ancho],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-3.5">
          <div>
            <h2 className="font-heading text-sm font-semibold">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {pie && (
          <footer className="flex items-center justify-end gap-2 border-t px-5 py-3">{pie}</footer>
        )}
      </div>
    </div>
  );
}
