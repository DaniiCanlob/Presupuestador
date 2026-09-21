import type { Pagina, ParametrosLista } from '@/common/types/api';
import { TAMANO_PAGINA } from '@/common/constants/catalogo';

export interface RangoConsulta {
  desde: number;
  hasta: number;
  pagina: number;
  tamano: number;
}

export function rango(parametros: ParametrosLista): RangoConsulta {
  const pagina = Math.max(1, parametros.pagina ?? 1);
  const tamano = Math.max(1, parametros.tamano ?? TAMANO_PAGINA);
  const desde = (pagina - 1) * tamano;
  return { desde, hasta: desde + tamano - 1, pagina, tamano };
}

export function armarPagina<T>(filas: T[], total: number, r: RangoConsulta): Pagina<T> {
  return {
    filas,
    total,
    pagina: r.pagina,
    tamano: r.tamano,
    paginas: Math.max(1, Math.ceil(total / r.tamano)),
  };
}
