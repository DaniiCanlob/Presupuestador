import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useActividades, useCapitulos, useGuardarActividad } from '@/features/catalogo/hooks/useCatalogo';
import { FormularioActividad } from '@/features/catalogo/components/FormularioActividad';
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
import { RUTAS } from '@/common/constants/rutas';
import { MENSAJES } from '@/common/constants/mensajes';
import type { FiltrosActividades } from '@/common/types/catalogo';

export default function ActividadesPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { busqueda, setBusqueda, pagina, setPagina, filtros, aplicarFiltros, parametros } =
    useListado<FiltrosActividades>({ capituloId: null, soloPropias: false });

  const capitulos = useCapitulos();
  const actividades = useActividades(parametros);
  const guardar = useGuardarActividad();

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Catálogo de actividades</h1>
          <p className="text-xs text-muted-foreground">
            Base de actividades con su APU y especificación técnica. Puedes crear las tuyas.
          </p>
        </div>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModalAbierto(true)}>
          Nueva actividad
        </Boton>
      </header>

      <div className="flex flex-wrap gap-2">
        <Buscador
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar por código o descripción…"
          className="w-full sm:w-96"
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
        <Selector
          className="w-44"
          value={filtros.soloPropias ? 'propias' : 'todas'}
          onChange={(e) => aplicarFiltros({ soloPropias: e.target.value === 'propias' })}
          opciones={[
            { valor: 'todas', etiqueta: 'Todo el catálogo' },
            { valor: 'propias', etiqueta: 'Solo las mías' },
          ]}
        />
      </div>

      {actividades.isLoading && <Cargando />}
      {actividades.error && <ErrorCarga error={actividades.error} />}
      {actividades.data?.filas.length === 0 && <EstadoVacio titulo={MENSAJES.sinResultados} />}

      {actividades.data && actividades.data.filas.length > 0 && (
        <Tabla>
          <Encabezado>
            <tr>
              <Th className="w-24">Código</Th>
              <Th>Descripción</Th>
              <Th className="w-40">Capítulo</Th>
              <Th className="w-16">Und</Th>
              <Th numerico className="w-36">
                Vr unitario
              </Th>
            </tr>
          </Encabezado>
          <Cuerpo>
            {actividades.data.filas.map((a) => (
              <Fila key={a.id}>
                <Td className="font-mono text-xs text-muted-foreground">
                  <Link to={RUTAS.actividad(a.id)} className="hover:text-marca">
                    {a.codigo}
                  </Link>
                </Td>
                <Td>
                  <Link to={RUTAS.actividad(a.id)} className="text-foreground hover:text-marca">
                    {a.descripcion}
                  </Link>
                  {a.owner_id && <Insignia className="ml-2">Mía</Insignia>}
                </Td>
                <Td className="text-xs text-muted-foreground">{a.capitulo_nombre ?? '—'}</Td>
                <Td className="text-xs text-muted-foreground">{a.unidad}</Td>
                <Td numerico className="font-medium">
                  {moneda(a.valor_unitario)}
                </Td>
              </Fila>
            ))}
          </Cuerpo>
        </Tabla>
      )}

      {actividades.data && (
        <Paginacion
          pagina={pagina}
          paginas={actividades.data.paginas}
          total={actividades.data.total}
          onCambiar={setPagina}
        />
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Nueva actividad"
        descripcion="Queda en tu catálogo; el APU se arma en el detalle."
      >
        <FormularioActividad
          capitulos={capitulos.data ?? []}
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
