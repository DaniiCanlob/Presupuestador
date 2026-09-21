import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Boton } from '@/common/ui/Boton';
import { numero } from '@/common/lib/formato';

interface PaginacionProps {
  pagina: number;
  paginas: number;
  total: number;
  onCambiar: (pagina: number) => void;
}

export function Paginacion({ pagina, paginas, total, onCambiar }: PaginacionProps) {
  if (total === 0) return null;

  return (
    <nav className="flex items-center justify-between gap-3 py-2" aria-label="Paginación">
      <p className="text-xs text-muted-foreground">
        {numero(total, 0)} registro{total === 1 ? '' : 's'} · página {pagina} de {paginas}
      </p>
      <div className="flex items-center gap-1">
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
          icono={<ChevronLeft className="h-4 w-4" />}
          aria-label="Página anterior"
        />
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={pagina >= paginas}
          onClick={() => onCambiar(pagina + 1)}
          icono={<ChevronRight className="h-4 w-4" />}
          aria-label="Página siguiente"
        />
      </div>
    </nav>
  );
}
