import { useMemo } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/common/lib/cn';
import type { FilaProgramacion } from '@/common/types/proyecto';

const ANCHO_SEMANA = 56; // px

/** Diagrama de barras semanal, equivalente a la cuadricula de la hoja PROGRAMACION. */
export function Gantt({ filas }: { filas: FilaProgramacion[] }) {
  const conFechas = useMemo(() => filas.filter((f) => f.fecha_inicio && f.fecha_fin), [filas]);

  const semanas = useMemo(() => {
    if (conFechas.length === 0) return [];
    const inicio = startOfWeek(
      conFechas.reduce<Date>(
        (min, f) => {
          const d = parseISO(f.fecha_inicio as string);
          return d < min ? d : min;
        },
        parseISO(conFechas[0]?.fecha_inicio as string),
      ),
      { weekStartsOn: 1 },
    );
    const fin = conFechas.reduce<Date>(
      (max, f) => {
        const d = parseISO(f.fecha_fin as string);
        return d > max ? d : max;
      },
      parseISO(conFechas[0]?.fecha_fin as string),
    );

    const lista: Date[] = [];
    for (let d = inicio; d <= fin; d = addDays(d, 7)) lista.push(d);
    return lista;
  }, [conFechas]);

  if (semanas.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
        Calcula la programación para ver el diagrama.
      </p>
    );
  }

  const origen = semanas[0] as Date;
  const anchoTotal = semanas.length * ANCHO_SEMANA;
  const posicion = (fechaIso: string): number =>
    (differenceInCalendarDays(parseISO(fechaIso), origen) / 7) * ANCHO_SEMANA;

  return (
    <div className="overflow-x-auto">
      <div style={{ width: anchoTotal + 260 }}>
        <div className="flex border-b border-border bg-muted/60 text-[11px] text-muted-foreground">
          <div className="w-[260px] shrink-0 px-3 py-1.5 font-medium">Actividad</div>
          {semanas.map((semana) => (
            <div
              key={format(semana, 'yyyy-MM-dd')}
              className="shrink-0 border-l border-border px-1 py-1.5 text-center"
              style={{ width: ANCHO_SEMANA }}
            >
              {format(semana, 'dd MMM', { locale: es })}
            </div>
          ))}
        </div>

        {conFechas.map((fila) => {
          const izquierda = posicion(fila.fecha_inicio as string);
          const ancho = Math.max(
            ANCHO_SEMANA / 7,
            ((differenceInCalendarDays(parseISO(fila.fecha_fin as string), parseISO(fila.fecha_inicio as string)) +
              1) /
              7) *
              ANCHO_SEMANA,
          );
          const avance = Number(fila.avance_pct);

          return (
            <div key={fila.id} className="flex items-center border-b border-border">
              <div className="w-[260px] shrink-0 px-3 py-1.5">
                <p className="truncate text-xs text-foreground" title={fila.descripcion}>
                  <span className="mr-1 font-mono text-[10px] text-muted-foreground/80">{fila.codigo}</span>
                  {fila.descripcion}
                </p>
              </div>
              <div className="relative h-8 shrink-0" style={{ width: anchoTotal }}>
                <div
                  className={cn(
                    'absolute top-1.5 h-5 overflow-hidden rounded-full ring-1',
                    avance >= 100
                      ? 'bg-exito/15 ring-exito/35'
                      : 'bg-accent ring-primary/40',
                  )}
                  style={{ left: izquierda, width: ancho }}
                  title={`${fila.descripcion} · ${fila.duracion_dias ?? 0} d`}
                >
                  {avance > 0 && (
                    <div
                      className={cn(
                        'h-full',
                        avance >= 100 ? 'bg-exito' : 'bg-primary',
                      )}
                      style={{ width: `${Math.min(avance, 100)}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
