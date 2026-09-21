import type {
  ActaItemRow,
  ActaRow,
  BitacoraRow,
  DocumentoRow,
  EstadoProyecto,
  MemoriaItemRow,
  PresupuestoItemRow,
  ProgramacionItemRow,
  ProyectoRow,
  TipoContrato,
} from '@/common/types/database.types';
import type { ParametrosLista } from '@/common/types/api';

export type Proyecto = ProyectoRow;
export type PresupuestoItem = PresupuestoItemRow;
export type MemoriaItem = MemoriaItemRow;
export type Acta = ActaRow;
export type ActaItem = ActaItemRow;
export type ApunteBitacora = BitacoraRow;
export type Documento = DocumentoRow;

export interface FiltrosProyectos extends ParametrosLista {
  estado?: EstadoProyecto | null;
  archivado?: boolean;
}

export interface EntradaProyecto {
  nombre: string;
  numero_contrato: string | null;
  tipo_contrato: TipoContrato;
  objeto: string | null;
  contratista: string | null;
  interventoria: string | null;
  supervision: string | null;
  entidad_contratante: string | null;
  ubicacion: string | null;
  municipio: string | null;
  departamento: string | null;
  fecha_inicio: string | null;
  plazo_dias: number | null;
  estado: EstadoProyecto;
  aplica_aiu: boolean;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
  iva_utilidad_pct: number;
  anticipo_pct: number;
  jornada_horas: number;
  dias_habiles_semana: number;
  observaciones: string | null;
}

/** Fila de programacion con los datos del presupuesto ya resueltos. */
export interface FilaProgramacion extends ProgramacionItemRow {
  codigo: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valor_parcial: number;
  orden: number;
}

export interface CapituloPresupuesto {
  capitulo: string;
  items: PresupuestoItem[];
  subtotal: number;
}
