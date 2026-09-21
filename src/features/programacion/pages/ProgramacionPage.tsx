import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import {
  useAccionesProgramacion,
  useFechasProyecto,
  useProgramacion,
} from '@/features/programacion/hooks/useProgramacion';
import { useActas, useItemsActa } from '@/features/actas/hooks/useActas';
import { Gantt } from '@/features/programacion/components/Gantt';
import { CurvaS } from '@/features/programacion/components/CurvaS';
import { construirCurvaS } from '@/features/programacion/lib/curvaS';
import { BotonesExporte } from '@/features/reportes/components/BotonesExporte';
import { Boton } from '@/common/ui/Boton';
import { Tarjeta, Dato } from '@/common/ui/Tarjeta';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { fecha, numero } from '@/common/lib/formato';

export default function ProgramacionPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto } = useProyectoActual();
  const programacion = useProgramacion(proyectoId);
  const acciones = useAccionesProgramacion(proyectoId);
  const actas = useActas(proyectoId);
  const itemsPrimerActa = useItemsActa(actas.data?.[0]?.id);
  const fechas = useFechasProyecto(proyectoId);

  const curva = useMemo(
    () => construirCurvaS(programacion.data ?? [], actas.data ?? [], itemsPrimerActa.data ?? []),
    [programacion.data, actas.data, itemsPrimerActa.data],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <Boton
          icono={<CalendarClock className="h-4 w-4" />}
          cargando={acciones.recalcular.isPending}
          onClick={() => acciones.recalcular.mutate()}
        >
          Calcular programación
        </Boton>
        <p className="text-xs text-muted-foreground">
          Usa el rendimiento de la mano de obra del APU y {proyecto.dias_habiles_semana} días
          laborables por semana.
        </p>
        <div className="ml-auto">
          <BotonesExporte reporte="programacion" proyecto={proyecto} />
        </div>
      </div>

      {programacion.isLoading && <Cargando />}
      {programacion.error && <ErrorCarga error={programacion.error} />}

      {programacion.data?.length === 0 && (
        <EstadoVacio
          titulo="Sin programación"
          descripcion="Calcula la programación para estimar duraciones y fechas de cada actividad."
          accion={<Boton onClick={() => acciones.recalcular.mutate()}>Calcular programación</Boton>}
        />
      )}

      {fechas.data?.fin_programacion && (
        <Tarjeta vidrio>
          <dl className="grid gap-3 sm:grid-cols-4">
            <Dato etiqueta="Inicio" valor={fecha(fechas.data.fecha_inicio)} />
            <Dato
              etiqueta="Fin del plazo"
              valor={
                fechas.data.fin_plazo
                  ? `${fecha(fechas.data.fin_plazo)} (${numero(fechas.data.plazo_dias ?? 0, 0)} días)`
                  : 'Sin plazo definido'
              }
            />
            <Dato etiqueta="Fin programado" valor={fecha(fechas.data.fin_programacion)} destacado />
            <Dato
              etiqueta="Diferencia"
              destacado
              valor={
                fechas.data.desfase_dias === null ? (
                  '—'
                ) : (
                  <span className={fechas.data.desfase_dias > 0 ? 'text-destructive' : 'text-exito'}>
                    {fechas.data.desfase_dias > 0
                      ? `+${numero(fechas.data.desfase_dias, 0)} d sobre el plazo`
                      : `${numero(Math.abs(fechas.data.desfase_dias), 0)} d de holgura`}
                  </span>
                )
              }
            />
          </dl>
        </Tarjeta>
      )}

      {programacion.data && programacion.data.length > 0 && (
        <>
          <Tabla>
            <Encabezado>
              <tr>
                <Th>Código</Th>
                <Th>Actividad</Th>
                <Th numerico>Cantidad</Th>
                <Th numerico>Rend. (u/día)</Th>
                <Th numerico>Cuadrillas</Th>
                <Th numerico>Duración (d)</Th>
                <Th>Inicio</Th>
                <Th>Fin</Th>
                <Th numerico>Avance %</Th>
                <Th>Responsable</Th>
              </tr>
            </Encabezado>
            <Cuerpo>
              {programacion.data.map((fila) => (
                <Fila key={fila.id}>
                  <Td className="font-mono text-xs text-muted-foreground">{fila.codigo}</Td>
                  <Td className="max-w-xs truncate" title={fila.descripcion}>
                    {fila.descripcion}
                  </Td>
                  <Td numerico>
                    {numero(fila.cantidad)} {fila.unidad}
                  </Td>
                  <Td numerico>
                    <input
                      className="celda-editable w-24 text-right tabular-nums"
                      defaultValue={fila.rendimiento_dia ?? ''}
                      inputMode="decimal"
                      onBlur={(e) =>
                        acciones.actualizar.mutate({
                          id: fila.id,
                          cambios: { rendimiento_dia: e.target.value ? Number(e.target.value) : null },
                        })
                      }
                      aria-label="Rendimiento por día"
                    />
                  </Td>
                  <Td numerico>
                    <input
                      className="celda-editable w-16 text-right tabular-nums"
                      defaultValue={fila.cuadrillas}
                      inputMode="decimal"
                      onBlur={(e) =>
                        acciones.actualizar.mutate({
                          id: fila.id,
                          cambios: { cuadrillas: Number(e.target.value) || 1 },
                        })
                      }
                      aria-label="Cuadrillas"
                    />
                  </Td>
                  <Td numerico>{numero(fila.duracion_dias ?? 0, 1)}</Td>
                  <Td>{fecha(fila.fecha_inicio)}</Td>
                  <Td>{fecha(fila.fecha_fin)}</Td>
                  <Td numerico>
                    <input
                      className="celda-editable w-16 text-right tabular-nums"
                      defaultValue={fila.avance_pct}
                      inputMode="decimal"
                      onBlur={(e) =>
                        acciones.actualizar.mutate({
                          id: fila.id,
                          cambios: {
                            avance_pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          },
                        })
                      }
                      aria-label="Avance ejecutado"
                    />
                  </Td>
                  <Td>
                    <input
                      className="celda-editable w-32"
                      defaultValue={fila.responsable ?? ''}
                      onBlur={(e) =>
                        acciones.actualizar.mutate({
                          id: fila.id,
                          cambios: { responsable: e.target.value || null },
                        })
                      }
                      aria-label="Responsable"
                    />
                  </Td>
                </Fila>
              ))}
            </Cuerpo>
          </Tabla>

          <Tarjeta titulo="Diagrama de barras" descripcion="Cada barra muestra el avance registrado.">
            <Gantt filas={programacion.data} />
          </Tarjeta>

          <CurvaS datos={curva} />
        </>
      )}
    </div>
  );
}
