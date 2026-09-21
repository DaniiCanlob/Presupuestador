export type TipoReporte =
  | 'presupuesto'
  | 'memorias'
  | 'programacion'
  | 'insumos'
  | 'apu'
  | 'especificaciones';

export type CeldaReporte = string | number;

export interface SeccionReporte {
  titulo?: string;
  subtitulo?: string;
  columnas: string[];
  filas: CeldaReporte[][];
  /** Filas que deben resaltarse (subtotales, totales). */
  destacadas?: number[];
  /** Bloques de texto, para especificaciones tecnicas. */
  textos?: { titulo: string; cuerpo: string }[];
}

export interface DocumentoReporte {
  titulo: string;
  archivo: string;
  encabezado: [string, string][];
  secciones: SeccionReporte[];
  pie?: string;
}
