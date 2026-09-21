import { Monitor, Moon, Sun } from 'lucide-react';
import { useTema, type Tema } from '@/common/hooks/useTema';
import { cn } from '@/common/lib/cn';

const OPCIONES: { valor: Tema; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: 'sistema', etiqueta: 'Según el sistema', Icono: Monitor },
  { valor: 'claro', etiqueta: 'Claro', Icono: Sun },
  { valor: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
];

export function SelectorTema({ className }: { className?: string }) {
  const { tema, cambiar } = useTema();

  return (
    <div
      className={cn('flex items-center gap-0.5 rounded-full border bg-card/60 p-0.5', className)}
      role="radiogroup"
      aria-label="Tema de la interfaz"
    >
      {OPCIONES.map(({ valor, etiqueta, Icono }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={tema === valor}
          title={etiqueta}
          onClick={() => cambiar(valor)}
          className={cn(
            'rounded-full p-1.5 transition-colors',
            tema === valor
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icono className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">{etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
