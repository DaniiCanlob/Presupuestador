import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/common/lib/cn';

export function Cargando({ texto = 'Cargando…', className }: { texto?: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
      {texto}
    </div>
  );
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/60">
        <Inbox className="h-5 w-5 text-accent-foreground/70" aria-hidden />
      </span>
      <p className="mt-4 font-heading text-sm font-semibold">{titulo}</p>
      {descripcion && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{descripcion}</p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

export function ErrorCarga({ error, className }: { error: unknown; className?: string }) {
  const mensaje = error instanceof Error ? error.message : 'No pudimos cargar la información.';
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{mensaje}</span>
    </div>
  );
}
