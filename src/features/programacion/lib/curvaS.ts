import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import { redondear } from '@/common/lib/calculos';
import type { FilaProgramacion } from '@/common/types/proyecto';
import type { ActaItemRow, ActaRow } from '@/common/types/database.types';

export interface PuntoCurva {
  semana: string;
  etiqueta: string;
  programado: number;
  ejecutado: number | null;
}

/**
 * Curva S: el valor de cada actividad se reparte de forma lineal entre su fecha
 * de inicio y su fecha de fin, y se acumula por semana. El ejecutado sale de las
 * actas aprobadas (no del avance declarado), que es lo que efectivamente se cobra.
 */
export function construirCurvaS(
  filas: FilaProgramacion[],
  actas: ActaRow[] = [],
  itemsActas: ActaItemRow[] = [],
): PuntoCurva[] {
  const conFechas = filas.filter((f) => f.fecha_inicio && f.fecha_fin);
  if (conFechas.length === 0) return [];

  const inicio = startOfWeek(
    conFechas.reduce<Date>((min, f) => {
      const d = parseISO(f.fecha_inicio as string);
      return d < min ? d : min;
    }, parseISO(conFechas[0]?.fecha_inicio as string)),
    { weekStartsOn: 1 },
  );

  const fin = conFechas.reduce<Date>((max, f) => {
    const d = parseISO(f.fecha_fin as string);
    return d > max ? d : max;
  }, parseISO(conFechas[0]?.fecha_fin as string));

  const semanas: Date[] = [];
  for (let d = inicio; d <= fin; d = addDays(d, 7)) semanas.push(d);
  if (semanas.length === 0) semanas.push(inicio);

  const total = conFechas.reduce((suma, f) => suma + Number(f.valor_parcial), 0);
  if (total <= 0) return [];

  // Valor ejecutado por semana segun el corte de cada acta.
  const valorPorActa = new Map<string, number>();
  for (const item of itemsActas) {
    valorPorActa.set(item.acta_id, (valorPorActa.get(item.acta_id) ?? 0) + Number(item.valor));
  }

  const hoy = new Date();
  let acumuladoProgramado = 0;
  let acumuladoEjecutado = 0;

  return semanas.map((semana) => {
    const corte = addDays(semana, 6);

    acumuladoProgramado = conFechas.reduce((suma, f) => {
      const desde = parseISO(f.fecha_inicio as string);
      const hasta = parseISO(f.fecha_fin as string);
      const dias = Math.max(1, differenceInCalendarDays(hasta, desde) + 1);
      const transcurridos = Math.min(Math.max(differenceInCalendarDays(corte, desde) + 1, 0), dias);
      return suma + (Number(f.valor_parcial) * transcurridos) / dias;
    }, 0);

    acumuladoEjecutado = actas
      .filter((a) => a.periodo_fin && parseISO(a.periodo_fin) <= corte)
      .reduce((suma, a) => suma + (valorPorActa.get(a.id) ?? 0), 0);

    return {
      semana: format(semana, 'yyyy-MM-dd'),
      etiqueta: format(semana, 'dd/MM'),
      programado: redondear((acumuladoProgramado * 100) / total, 1),
      ejecutado: semana > hoy ? null : redondear((acumuladoEjecutado * 100) / total, 1),
    };
  });
}
