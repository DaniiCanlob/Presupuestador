/** Contrato unico para todos los listados paginados con busqueda. */
export interface ParametrosLista {
  busqueda?: string;
  pagina?: number;
  tamano?: number;
  orden?: string;
  ascendente?: boolean;
  [filtro: string]: unknown;
}

export interface Pagina<T> {
  filas: T[];
  total: number;
  pagina: number;
  tamano: number;
  paginas: number;
}

export const paginaVacia = <T>(tamano: number): Pagina<T> => ({
  filas: [],
  total: 0,
  pagina: 1,
  tamano,
  paginas: 0,
});

export interface Opcion<T = string> {
  valor: T;
  etiqueta: string;
}
