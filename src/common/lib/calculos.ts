import type { ApuItemRow, TipoInsumo } from '@/common/types/database.types';
import type { GrupoApu } from '@/common/types/catalogo';
import type { CapituloPresupuesto, PresupuestoItem, Proyecto } from '@/common/types/proyecto';
import { ORDEN_TIPO } from '@/common/constants/catalogo';

export const redondear = (valor: number, decimales = 2): number => {
  const f = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * f) / f;
};

/** Igual que la columna generada `valor_parcial` de la base. */
export function valorParcialApu(item: {
  cantidad: number;
  precio_unitario: number;
  es_porcentaje: boolean;
}): number {
  return redondear(
    item.es_porcentaje
      ? (item.precio_unitario * item.cantidad) / 100
      : item.precio_unitario * item.cantidad,
  );
}

/** Subtotal de una fila de memoria: los campos vacios valen 1, como en el Excel. */
export function subtotalMemoria(fila: {
  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;
  veces?: number | null;
}): number {
  const f = (v: number | null | undefined): number => (v && v !== 0 ? v : 1);
  return redondear(f(fila.largo) * f(fila.ancho) * f(fila.alto) * f(fila.veces), 4);
}

export function agruparApu(items: ApuItemRow[]): GrupoApu[] {
  const mapa = new Map<string, GrupoApu>();
  for (const item of items) {
    const clave = `${item.tipo}|${item.grupo}`;
    const grupo = mapa.get(clave) ?? { tipo: item.tipo, grupo: item.grupo, items: [], subtotal: 0 };
    grupo.items.push(item);
    grupo.subtotal = redondear(grupo.subtotal + Number(item.valor_parcial));
    mapa.set(clave, grupo);
  }
  return [...mapa.values()].sort(
    (a, b) => ORDEN_TIPO.indexOf(a.tipo) - ORDEN_TIPO.indexOf(b.tipo) || a.grupo.localeCompare(b.grupo),
  );
}

export function agruparPorCapitulo(items: PresupuestoItem[]): CapituloPresupuesto[] {
  const mapa = new Map<string, CapituloPresupuesto>();
  for (const item of items) {
    const clave = item.capitulo_nombre ?? 'Sin capítulo';
    const grupo = mapa.get(clave) ?? { capitulo: clave, items: [], subtotal: 0 };
    grupo.items.push(item);
    grupo.subtotal = redondear(grupo.subtotal + Number(item.valor_parcial));
    mapa.set(clave, grupo);
  }
  return [...mapa.values()];
}

export interface TotalesCalculados {
  costoDirecto: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
  ivaUtilidad: number;
  aiu: number;
  total: number;
  anticipo: number;
}

/**
 * Misma formula que `totales_proyecto` en la base. Se replica en el cliente
 * para previsualizar cambios de AIU sin ida y vuelta al servidor.
 */
export function calcularTotales(proyecto: Proyecto, costoDirecto: number): TotalesCalculados {
  const pct = (p: number): number => (proyecto.aplica_aiu ? redondear((costoDirecto * p) / 100) : 0);
  const administracion = pct(Number(proyecto.administracion_pct));
  const imprevistos = pct(Number(proyecto.imprevistos_pct));
  const utilidad = pct(Number(proyecto.utilidad_pct));
  const ivaUtilidad = redondear((utilidad * Number(proyecto.iva_utilidad_pct)) / 100);
  const total = redondear(costoDirecto + administracion + imprevistos + utilidad + ivaUtilidad);
  return {
    costoDirecto: redondear(costoDirecto),
    administracion,
    imprevistos,
    utilidad,
    ivaUtilidad,
    aiu: redondear(administracion + imprevistos + utilidad),
    total,
    anticipo: redondear((total * Number(proyecto.anticipo_pct)) / 100),
  };
}

/** Rendimiento sugerido (u/día) a partir de la mano de obra del APU. */
export function rendimientoSugerido(items: ApuItemRow[]): number | null {
  const dias = items
    .filter(
      (i) =>
        i.tipo === 'mano_obra' &&
        !i.es_porcentaje &&
        ['dia', 'dias', 'jornal'].includes(
          (i.unidad ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
        ),
    )
    .map((i) => Number(i.cantidad));
  const maximo = Math.max(0, ...dias);
  return maximo > 0 ? redondear(1 / maximo, 4) : null;
}

export function duracionDias(cantidad: number, rendimiento: number | null, cuadrillas = 1): number {
  if (!rendimiento || rendimiento <= 0 || cantidad <= 0) return 1;
  return Math.max(1, Math.ceil(cantidad / (rendimiento * (cuadrillas || 1))));
}

export function totalPorTipo(
  filas: { tipo: TipoInsumo; valor_total: number }[],
): Record<TipoInsumo, number> {
  const base: Record<TipoInsumo, number> = {
    material: 0,
    equipo: 0,
    transporte: 0,
    mano_obra: 0,
    otro: 0,
  };
  for (const fila of filas) base[fila.tipo] = redondear(base[fila.tipo] + Number(fila.valor_total));
  return base;
}
