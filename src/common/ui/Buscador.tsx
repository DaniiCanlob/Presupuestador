import { Search, X } from 'lucide-react';
import { cn } from '@/common/lib/cn';

interface BuscadorProps {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function Buscador({ valor, onCambiar, placeholder = 'Buscar…', className, autoFocus }: BuscadorProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={valor}
        autoFocus={autoFocus}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-full border bg-card/70 pl-10 pr-9 text-sm backdrop-blur-sm',
          'placeholder:text-muted-foreground/70 transition-[border-color,box-shadow,background-color]',
          'hover:border-foreground/15 focus:border-ring focus:bg-card focus:outline-none focus:ring-4 focus:ring-ring/15',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambiar('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
