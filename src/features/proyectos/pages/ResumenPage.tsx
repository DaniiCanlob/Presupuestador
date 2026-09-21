import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { useAvance } from '@/features/proyectos/hooks/useProyectos';
import { usePresupuesto } from '@/features/presupuesto/hooks/usePresupuesto';
import { useResumenInsumos } from '@/features/insumos-proyecto/hooks/useResumenInsumos';
import { ResumenTotales } from '@/features/presupuesto/components/ResumenTotales';
import { Tarjeta, Dato } from '@/common/ui/Tarjeta';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { EstadoVacio } from '@/common/ui/Estados';
import { moneda, numero, porcentaje, fecha } from '@/common/lib/formato';
import { totalPorTipo } from '@/common/lib/calculos';
import { ETIQUETA_TIPO, ORDEN_TIPO } from '@/common/constants/catalogo';
import { RUTAS } from '@/common/constants/rutas';

export default function ResumenPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto, totales } = useProyectoActual();
  const avance = useAvance(proyectoId);
  const items = usePresupuesto(proyectoId);
  const insumos = useResumenInsumos(proyectoId);

  const porTipo = useMemo(() => totalPorTipo(insumos.data ?? []), [insumos.data]);

  const mayores = useMemo(
    () => [...(items.data ?? [])].sort((a, b) => Number(b.valor_parcial) - Number(a.valor_parcial)).slice(0, 8),
    [items.data],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Tarjeta>
            <Dato etiqueta="Valor del contrato" valor={moneda(totales?.total ?? 0)} destacado />
          </Tarjeta>
          <Tarjeta>
            <Dato etiqueta="Actividades" valor={numero(totales?.actividades ?? 0, 0)} destacado />
          </Tarjeta>
          <Tarjeta>
            <Dato etiqueta="Avance ejecutado" valor={porcentaje(avance.data?.avance_pct ?? 0)} destacado />
          </Tarjeta>
          <Tarjeta>
            <Dato etiqueta="Fin del plazo" valor={fecha(proyecto.fecha_fin)} destacado />
          </Tarjeta>
        </div>

        <Tarjeta
          titulo="Actividades de mayor peso"
          descripcion="Donde se concentra el valor del presupuesto."
        >
          {mayores.length === 0 ? (
            <EstadoVacio
              titulo="Presupuesto vacío"
              descripcion="Agrega actividades para ver el resumen."
              accion={
                <Link
                  to={RUTAS.presupuesto(proyectoId)}
                  className="text-sm font-medium text-marca hover:underline"
                >
                  Ir al presupuesto
                </Link>
              }
            />
          ) : (
            <Tabla>
              <Encabezado>
                <tr>
                  <Th>Actividad</Th>
                  <Th numerico>Cantidad</Th>
                  <Th numerico>Vr parcial</Th>
                  <Th numerico>% del total</Th>
                </tr>
              </Encabezado>
              <Cuerpo>
                {mayores.map((item) => (
                  <Fila key={item.id}>
                    <Td>
                      <span className="mr-2 font-mono text-xs text-muted-foreground/80">{item.codigo}</span>
                      {item.descripcion}
                    </Td>
                    <Td numerico>
                      {numero(item.cantidad)} {item.unidad}
                    </Td>
                    <Td numerico>{moneda(item.valor_parcial)}</Td>
                    <Td numerico>
                      {porcentaje(
                        totales?.costo_directo
                          ? (Number(item.valor_parcial) * 100) / Number(totales.costo_directo)
                          : 0,
                      )}
                    </Td>
                  </Fila>
                ))}
              </Cuerpo>
            </Tabla>
          )}
        </Tarjeta>

        <Tarjeta titulo="Composición del costo directo" descripcion="Según el APU de cada actividad.">
          <dl className="grid gap-3 sm:grid-cols-5">
            {ORDEN_TIPO.map((tipo) => (
              <Dato key={tipo} etiqueta={ETIQUETA_TIPO[tipo]} valor={moneda(porTipo[tipo])} />
            ))}
          </dl>
        </Tarjeta>
      </div>

      <aside className="space-y-3">
        <ResumenTotales proyecto={proyecto} totales={totales} />

        <Tarjeta titulo="Datos del contrato">
          <dl className="space-y-2">
            <Dato etiqueta="Contratista" valor={proyecto.contratista ?? '—'} />
            <Dato etiqueta="Entidad contratante" valor={proyecto.entidad_contratante ?? '—'} />
            <Dato etiqueta="Interventoría" valor={proyecto.interventoria ?? '—'} />
            <Dato etiqueta="Supervisión" valor={proyecto.supervision ?? '—'} />
            <Dato
              etiqueta="Ubicación"
              valor={[proyecto.ubicacion, proyecto.municipio, proyecto.departamento].filter(Boolean).join(', ') || '—'}
            />
            <Dato
              etiqueta="Plazo"
              valor={proyecto.plazo_dias ? `${proyecto.plazo_dias} días calendario` : '—'}
            />
          </dl>
        </Tarjeta>
      </aside>
    </div>
  );
}
