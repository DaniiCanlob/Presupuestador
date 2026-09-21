import { useState } from 'react';
import { Check } from 'lucide-react';
import { useInsumos } from '@/features/catalogo/hooks/useCatalogo';
import { useListado } from '@/common/hooks/useListado';
import { Modal } from '@/common/ui/Modal';
import { Boton } from '@/common/ui/Boton';
import { Buscador } from '@/common/ui/Buscador';
import { Selector } from '@/common/ui/campos';
import { Paginacion } from '@/common/ui/Paginacion';
import { Cargando, EstadoVacio } from '@/common/ui/Estados';
import { moneda } from '@/common/lib/formato';
import { cn } from '@/common/lib/cn';
import { TAMANO_PAGINA_BUSCADOR, TIPOS_INSUMO } from '@/common/constants/catalogo';
import { MENSAJES } from '@/common/constants/mensajes';
import type { FiltrosInsumos, Insumo } from '@/common/types/catalogo';
import type { TipoInsumo } from '@/common/types/database.types';

interface SelectorInsumosProps {
  abierto: boolean;
  onCerrar: () => void;
  onElegir: (insumos: Insumo[]) => void;
}

export function SelectorInsumos({ abierto, onCerrar, onElegir }: SelectorInsumosProps) {
  const [seleccion, setSeleccion] = useState<Map<string, Insumo>>(new Map());
  const { busqueda, setBusqueda, pagina, setPagina, filtros, aplicarFiltros, parametros } =
    useListado<FiltrosInsumos>({ tipo: null }, TAMANO_PAGINA_BUSCADOR);

  const insumos = useInsumos(parametros);

  const alternar = (insumo: Insumo): void => {
    setSeleccion((previa) => {
      const copia = new Map(previa);
      if (copia.has(insumo.id)) copia.delete(insumo.id);
      else copia.set(insumo.id, insumo);
      return copia;
    });
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Agregar insumos al APU"
      ancho="lg"
      pie={
        <>
          <span className="mr-auto text-xs text-muted-foreground">{seleccion.size} seleccionado(s)</span>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            disabled={seleccion.size === 0}
            onClick={() => {
              onElegir([...seleccion.values()]);
              setSeleccion(new Map());
            }}
          >
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
          placeholder="Cemento, cuadrilla, retroexcavadora…"
          className="w-full sm:flex-1"
        />
        <Selector
          className="w-full sm:w-52"
          vacio="Todos los tipos"
          value={filtros.tipo ?? ''}
          onChange={(e) => aplicarFiltros({ tipo: (e.target.value || null) as TipoInsumo | null })}
          opciones={TIPOS_INSUMO.map((t) => ({ valor: t.valor, etiqueta: t.plural }))}
        />
      </div>

      {insumos.isLoading && <Cargando />}
      {insumos.data?.filas.length === 0 && <EstadoVacio titulo={MENSAJES.sinResultados} />}

      <ul className="max-h-[45vh] divide-y divide-border overflow-y-auto rounded-lg ring-1 ring-border">
        {insumos.data?.filas.map((insumo) => {
          const marcado = seleccion.has(insumo.id);
          return (
            <li key={insumo.id}>
              <button
                type="button"
                onClick={() => alternar(insumo)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left',
                  marcado ? 'bg-accent' : 'hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    marcado ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}
                >
                  {marcado && <Check className="h-3 w-3" aria-hidden />}
                </span>
                <span className="flex-1 text-sm text-foreground">{insumo.descripcion}</span>
                <span className="w-12 text-xs text-muted-foreground">{insumo.unidad}</span>
                <span className="w-28 text-right text-sm tabular-nums text-foreground">
                  {moneda(insumo.precio_unitario)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {insumos.data && (
        <Paginacion
          pagina={pagina}
          paginas={insumos.data.paginas}
          total={insumos.data.total}
          onCambiar={setPagina}
        />
      )}
    </Modal>
  );
}
