import type {
  ActividadRow,
  ApuItemRow,
  EspecificacionRow,
  InsumoRow,
  TipoInsumo,
} from '@/common/types/database.types';
import type { ParametrosLista } from '@/common/types/api';

export interface Actividad extends ActividadRow {
  capitulo_nombre?: string | null;
  capitulo_codigo?: string | null;
}

export interface GrupoApu {
  tipo: TipoInsumo;
  grupo: string;
  items: ApuItemRow[];
  subtotal: number;
}

export interface ApuCompleto {
  actividad: Actividad;
  grupos: GrupoApu[];
  total: number;
}

export interface FiltrosActividades extends ParametrosLista {
  capituloId?: string | null;
  soloPropias?: boolean;
}

export interface FiltrosInsumos extends ParametrosLista {
  tipo?: TipoInsumo | null;
  soloPropios?: boolean;
  soloAuxiliares?: boolean;
}

export interface EntradaActividad {
  codigo: string;
  descripcion: string;
  unidad: string;
  capitulo_id: string | null;
  rendimiento_dia: number | null;
}

export interface EntradaApuItem {
  id?: string;
  grupo: string;
  tipo: TipoInsumo;
  insumo_id: string | null;
  descripcion: string;
  unidad: string | null;
  cantidad: number;
  precio_unitario: number;
  es_porcentaje: boolean;
}

export interface EntradaInsumo {
  descripcion: string;
  unidad: string;
  tipo: TipoInsumo;
  precio_unitario: number;
  proveedor: string | null;
  marca: string | null;
  notas: string | null;
}

export type Especificacion = EspecificacionRow;
export type Insumo = InsumoRow;
