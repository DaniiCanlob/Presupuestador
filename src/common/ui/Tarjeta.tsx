import type { ReactNode } from 'react';
import { cn } from '@/common/lib/cn';

interface TarjetaProps {
  titulo?: string;
  descripcion?: string;
  acciones?: ReactNode;
  /** Superficie traslúcida. Para paneles laterales y resúmenes, no para tablas. */
  vidrio?: boolean;
  className?: string;
  children: ReactNode;
}

export function Tarjeta({
  titulo,
  descripcion,
  acciones,
  vidrio,
  className,
  children,
}: TarjetaProps) {
  return (
    <section className={cn(vidrio ? 'vidrio rounded-xl' : 'panel', 'p-4', className)}>
      {(titulo || acciones) && (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {titulo && <h2 className="font-heading text-sm font-semibold">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
          </div>
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

interface DatoProps {
  etiqueta: string;
  valor: ReactNode;
  destacado?: boolean;
}

export function Dato({ etiqueta, valor, destacado }: DatoProps) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd
        className={cn(
          'mt-0.5 tabular-nums',
          destacado ? 'font-heading text-lg font-semibold' : 'text-sm',
        )}
      >
        {valor}
      </dd>
    </div>
  );
}
