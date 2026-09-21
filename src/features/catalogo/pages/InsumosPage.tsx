import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useFijarPrecio,
  useGuardarInsumo,
  useInsumos,
  usePreciosPropios,
} from '@/features/catalogo/hooks/useCatalogo';
import { FormularioInsumo } from '@/features/catalogo/components/FormularioInsumo';
import { useListado } from '@/common/hooks/useListado';
import { Boton } from '@/common/ui/Boton';
import { Buscador } from '@/common/ui/Buscador';
import { Modal } from '@/common/ui/Modal';
import { Insignia } from '@/common/ui/Insignia';
import { Paginacion } from '@/common/ui/Paginacion';
import { Selector } from '@/common/ui/campos';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { moneda } from '@/common/lib/formato';
import { COLOR_TIPO, ETIQUETA_TIPO, TIPOS_INSUMO } from '@/common/constants/catalogo';
import { MENSAJES } from '@/common/constants/mensajes';
import type { FiltrosInsumos } from '@/common/types/catalogo';
import type { TipoInsumo } from '@/common/types/database.types';

export default function InsumosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { busqueda, setBusqueda, pagina, setPagina, filtros, aplicarFiltros, parametros } =
    useListado<FiltrosInsumos>({ tipo: null, soloPropios: false });

  const insumos = useInsumos(parametros);
  const precios = usePreciosPropios();
  const fijarPrecio = useFijarPrecio();
  const guardar = useGuardarInsumo();

  const misPrecios = useMemo(
    () => new Map((precios.data ?? []).map((p) => [p.insumo_id, Number(p.precio_unitario)])),
    [precios.data],
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Insumos</h1>
          <p className="text-xs text-muted-foreground">
            Materiales, equipo, transporte y mano de obra. Puedes fijar tu propio precio sin tocar el
            catálogo.
          </p>
        </div>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModalAbierto(true)}>
          Nuevo insumo
        </Boton>
      </header>

      <div className="flex flex-wrap gap-2">
        <Buscador
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar insumo…"
          className="w-full sm:w-96"
        />
        <Selector
          className="w-52"
          vacio="Todos los tipos"
          value={filtros.tipo ?? ''}
          onChange={(e) => aplicarFiltros({ tipo: (e.target.value || null) as TipoInsumo | null })}
          opciones={TIPOS_INSUMO.map((t) => ({ valor: t.valor, etiqueta: t.plural }))}
        />
        <Selector
          className="w-44"
          value={filtros.soloPropios ? 'propios' : 'todos'}
          onChange={(e) => aplicarFiltros({ soloPropios: e.target.value === 'propios' })}
          opciones={[
            { valor: 'todos', etiqueta: 'Todo el catálogo' },
            { valor: 'propios', etiqueta: 'Solo los míos' },
          ]}
        />
      </div>

      {insumos.isLoading && <Cargando />}
      {insumos.error && <ErrorCarga error={insumos.error} />}
      {insumos.data?.filas.length === 0 && <EstadoVacio titulo={MENSAJES.sinResultados} />}

      {insumos.data && insumos.data.filas.length > 0 && (
        <Tabla>
          <Encabezado>
            <tr>
              <Th>Descripción</Th>
              <Th className="w-44">Tipo</Th>
              <Th className="w-16">Und</Th>
              <Th numerico className="w-36">
                Precio catálogo
              </Th>
              <Th numerico className="w-40">
                Mi precio
              </Th>
            </tr>
          </Encabezado>
          <Cuerpo>
            {insumos.data.filas.map((insumo) => {
              const propio = misPrecios.get(insumo.id);
              return (
                <Fila key={insumo.id}>
                  <Td>
                    {insumo.descripcion}
                    {insumo.es_auxiliar && <Insignia className="ml-2">Auxiliar</Insignia>}
                    {insumo.owner_id && <Insignia className="ml-2">Mío</Insignia>}
                  </Td>
                  <Td>
                    <Insignia className={COLOR_TIPO[insumo.tipo]}>
                      {ETIQUETA_TIPO[insumo.tipo]}
                    </Insignia>
                  </Td>
                  <Td className="text-xs text-muted-foreground">{insumo.unidad}</Td>
                  <Td numerico>{moneda(insumo.precio_unitario)}</Td>
                  <Td>
                    <input
                      className="celda-editable text-right tabular-nums"
                      inputMode="decimal"
                      defaultValue={propio ?? ''}
                      placeholder="—"
                      onBlur={(e) => {
                        const texto = e.target.value.trim();
                        const valor = texto === '' ? null : Number(texto);
                        if (valor !== null && !Number.isFinite(valor)) return;
                        if (valor === (propio ?? null)) return;
                        fijarPrecio.mutate({ insumoId: insumo.id, precio: valor });
                      }}
                      aria-label={`Mi precio para ${insumo.descripcion}`}
                    />
                  </Td>
                </Fila>
              );
            })}
          </Cuerpo>
        </Tabla>
      )}

      {insumos.data && (
        <Paginacion
          pagina={pagina}
          paginas={insumos.data.paginas}
          total={insumos.data.total}
          onCambiar={setPagina}
        />
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Nuevo insumo"
        descripcion="Queda disponible para armar tus propios APU."
      >
        <FormularioInsumo
          guardando={guardar.isPending}
          onCancelar={() => setModalAbierto(false)}
          onGuardar={(entrada) =>
            guardar.mutate({ entrada }, { onSuccess: () => setModalAbierto(false) })
          }
        />
      </Modal>
    </div>
  );
}
