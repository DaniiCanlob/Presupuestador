import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { DECIMALES, FORMATO_FECHA, LOCALE, MONEDA_DEFECTO } from '@/common/constants/formatos';

const cacheMoneda = new Map<string, Intl.NumberFormat>();

export function moneda(valor: number | null | undefined, divisa = MONEDA_DEFECTO): string {
  const clave = `${divisa}`;
  let formateador = cacheMoneda.get(clave);
  if (!formateador) {
    formateador = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: divisa,
      minimumFractionDigits: DECIMALES.moneda,
      maximumFractionDigits: DECIMALES.moneda,
    });
    cacheMoneda.set(clave, formateador);
  }
  return formateador.format(valor ?? 0);
}

export function numero(valor: number | null | undefined, decimales: number = DECIMALES.cantidad): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(valor ?? 0);
}

export function porcentaje(valor: number | null | undefined, decimales: number = 1): string {
  return `${numero(valor, decimales)} %`;
}

export function fecha(valor: string | Date | null | undefined, patron = FORMATO_FECHA): string {
  if (!valor) return '—';
  const d = typeof valor === 'string' ? parseISO(valor) : valor;
  return isValid(d) ? format(d, patron, { locale: es }) : '—';
}

/** yyyy-MM-dd, que es lo que espera Postgres en columnas date. */
export function fechaIso(valor: Date | null | undefined): string | null {
  return valor && isValid(valor) ? format(valor, 'yyyy-MM-dd') : null;
}

export function pesoArchivo(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  return `${numero(bytes / 1024 ** i, 1)} ${unidades[i]}`;
}
