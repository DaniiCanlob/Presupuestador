import { NavLink } from 'react-router-dom';
import { cn } from '@/common/lib/cn';

export interface Pestana {
  a: string;
  etiqueta: string;
}

/** Píldoras sobre vidrio: sin líneas duras, la activa se marca con el acento. */
export function Pestanas({ pestanas }: { pestanas: Pestana[] }) {
  return (
    <nav
      className="vidrio flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full p-1"
      aria-label="Secciones"
    >
      {pestanas.map((p) => (
        <NavLink
          key={p.a}
          to={p.a}
          end
          className={({ isActive }) =>
            cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/45 hover:text-foreground',
            )
          }
        >
          {p.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
