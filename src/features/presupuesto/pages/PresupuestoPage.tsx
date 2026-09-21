import { Fragment, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { useAccionesPresupuesto, usePresupuesto } from '@/features/presupuesto/hooks/usePresupuesto';
import { SelectorActividades } from '@/features/presupuesto/components/SelectorActividades';
import { FilaPresupuesto } from '@/features/presupuesto/components/FilaPresupuesto';
import { ResumenTotales } from '@/features/presupuesto/components/ResumenTotales';
import { BotonesExporte } from '@/features/reportes/components/BotonesExporte';
import { Boton } from '@/common/ui/Boton';
import { Cuerpo, Encabezado, Tabla, Th } from '@/common/ui/Tabla';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { Tarjeta, Dato } from '@/common/ui/Tarjeta';
import { MENSAJES } from '@/common/constants/mensajes';
import { moneda, numero } from '@/common/lib/formato';
import { agruparPorCapitulo } from '@/common/lib/calculos';

export default function PresupuestoPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto, totales } = useProyectoActual();
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  const items = usePresupuesto(proyectoId);
  const acciones = useAccionesPresupuesto(proyectoId);

  const capitulos = useMemo(() => agruparPorCapitulo(items.data ?? []), [items.data]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 no-imprimir">
          <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setSelectorAbierto(true)}>
            Agregar actividades
          </Boton>
          <Boton
            variante="secundario"
            icono={<RefreshCw className="h-4 w-4" />}
            cargando={acciones.actualizarPrecios.isPending}
            onClick={() => acciones.actualizarPrecios.mutate()}
          >
            Actualizar precios
          </Boton>
          <div className="ml-auto">
            <BotonesExporte reporte="presupuesto" proyecto={proyecto} />
          </div>
        </div>

        {items.isLoading && <Cargando />}
        {items.error && <ErrorCarga error={items.error} />}

        {items.data?.length === 0 && (
          <EstadoVacio
            titulo={MENSAJES.sinActividades}
            descripcion="Agrega actividades del catálogo; el valor unitario viene del APU."
            accion={<Boton onClick={() => setSelectorAbierto(true)}>Agregar actividades</Boton>}
          />
        )}

        {items.data && items.data.length > 0 && (
          <Tabla>
            <Encabezado>
              <tr>
                <Th>N°</Th>
                <Th>Código</Th>
                <Th>Actividad</Th>
                <Th>Und</Th>
                <Th numerico>Cantidad</Th>
                <Th numerico>Vr unitario</Th>
                <Th numerico>Vr parcial</Th>
                <Th aria-label="Acciones" />
              </tr>
            </Encabezado>
            <Cuerpo>
              {capitulos.map((capitulo) => (
                <Fragment key={capitulo.capitulo}>
                  {capitulos.length > 1 && (
                    <tr className="bg-muted/60">
                      <td colSpan={6} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {capitulo.capitulo}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {moneda(capitulo.subtotal)}
                      </td>
                      <td />
                    </tr>
                  )}
                  {capitulo.items.map((item) => (
                    <FilaPresupuesto
                      key={item.id}
                      indice={item.orden}
                      item={item}
                      proyectoId={proyectoId}
                      onCambiar={(cambios) => acciones.actualizar.mutate({ id: item.id, cambios })}
                      onVincularMemoria={() => acciones.vincularMemoria.mutate(item.id)}
                      onEliminar={() => {
                        if (window.confirm(`¿Quitar "${item.descripcion}" del presupuesto?`)) {
                          acciones.eliminar.mutate(item.id);
                        }
                      }}
                    />
                  ))}
                </Fragment>
              ))}
            </Cuerpo>
          </Tabla>
        )}
      </div>

      <aside className="space-y-3">
        <ResumenTotales proyecto={proyecto} totales={totales} />
        <Tarjeta titulo="Resumen">
          <dl className="grid grid-cols-2 gap-3">
            <Dato etiqueta="Actividades" valor={numero(items.data?.length ?? 0, 0)} />
            <Dato
              etiqueta="Con cantidad"
              valor={numero((items.data ?? []).filter((i) => i.cantidad > 0).length, 0)}
            />
          </dl>
        </Tarjeta>
      </aside>

      <SelectorActividades
        abierto={selectorAbierto}
        onCerrar={() => setSelectorAbierto(false)}
        agregando={acciones.agregarDelCatalogo.isPending}
        onAgregar={(ids) =>
          acciones.agregarDelCatalogo.mutate(ids, { onSuccess: () => setSelectorAbierto(false) })
        }
      />
    </div>
  );
}
