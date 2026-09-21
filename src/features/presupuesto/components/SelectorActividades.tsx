import { useState } from 'react';
import { Check } from 'lucide-react';
import { useActividades, useCapitulos } from '@/features/catalogo/hooks/useCatalogo';
import { useListado } from '@/common/hooks/useListado';
import { Modal } from '@/common/ui/Modal';
import { Boton } from '@/common/ui/Boton';
import { Buscador } from '@/common/ui/Buscador';
import { Selector } from '@/common/ui/campos';
import { Paginacion } from '@/common/ui/Paginacion';
import { Cargando, EstadoVacio } from '@/common/ui/Estados';
import { moneda } from '@/common/lib/formato';
import { cn } from '@/common/lib/cn';
import { TAMANO_PAGINA_BUSCADOR } from '@/common/constants/catalogo';
import { MENSAJES } from '@/common/constants/mensajes';
import type { FiltrosActividades } from '@/common/types/catalogo';

interface SelectorActividadesProps {
  abierto: boolean;
  onCerrar: () => void;
  onAgregar: (ids: string[]) => void;
  agregando?: boolean;
}

export function SelectorActividades({
  abierto,
  onCerrar,
  onAgregar,
  agregando,
}: SelectorActividadesProps) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const { busqueda, setBusqueda, pagina, setPagina, filtros, aplicarFiltros, parametros } =
    useListado<FiltrosActividades>({ capituloId: null }, TAMANO_PAGINA_BUSCADOR);

  const capitulos = useCapitulos();
  const actividades = useActividades(parametros);

  const alternar = (id: string): void => {
    setSeleccion((previa) => {
      const copia = new Set(previa);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  };

  const confirmar = (): void => {
    onAgregar([...seleccion]);
    setSeleccion(new Set());
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Agregar actividades al presupuesto"
      descripcion="Busca en el catálogo por código o descripción. Puedes marcar varias."
      ancho="xl"
      pie={
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {seleccion.size} actividad{seleccion.size === 1 ? '' : 'es'} seleccionada(s)
          </span>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={confirmar} disabled={seleccion.size === 0} cargando={agregando}>
            Agregar
          </Boton>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Buscador
          valor={busqueda}
          onCambiar={setBusqueda}
          autoFocus
          placeholder="Ej: excavación, 1.01, concreto 3000 psi…"
          className="w-full sm:flex-1"
        />
        <Selector
          className="w-full sm:w-72"
          vacio="Todos los capítulos"
          value={filtros.capituloId ?? ''}
          onChange={(e) => aplicarFiltros({ capituloId: e.target.value || null })}
          opciones={(capitulos.data ?? []).map((c) => ({
            valor: c.id,
            etiqueta: `${c.codigo}. ${c.nombre}`,
          }))}
        />
      </div>

      {actividades.isLoading && <Cargando />}
      {actividades.data?.filas.length === 0 && <EstadoVacio titulo={MENSAJES.sinResultados} />}

      <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-lg ring-1 ring-border">
        {actividades.data?.filas.map((a) => {
          const marcada = seleccion.has(a.id);
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => alternar(a.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left transition',
                  marcada ? 'bg-accent' : 'hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    marcada ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}
                >
                  {marcada && <Check className="h-3 w-3" aria-hidden />}
                </span>
                <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{a.codigo}</span>
                <span className="flex-1 text-sm text-foreground">{a.descripcion}</span>
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{a.unidad}</span>
                <span className="w-28 shrink-0 text-right text-sm tabular-nums text-foreground">
                  {moneda(a.valor_unitario)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {actividades.data && (
        <Paginacion
          pagina={pagina}
          paginas={actividades.data.paginas}
          total={actividades.data.total}
          onCambiar={setPagina}
        />
      )}
    </Modal>
  );
}
