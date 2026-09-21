import type { ParametrosLista } from '@/common/types/api';

/** Claves de cache de TanStack Query, centralizadas para invalidar sin adivinar. */
export const CLAVES = {
  perfil: ['perfil'] as const,

  capitulos: ['capitulos'] as const,
  actividades: (p: ParametrosLista) => ['actividades', p] as const,
  actividad: (id: string) => ['actividad', id] as const,
  apu: (actividadId: string) => ['apu', actividadId] as const,
  especificacion: (actividadId: string) => ['especificacion', actividadId] as const,
  insumos: (p: ParametrosLista) => ['insumos', p] as const,
  preciosPropios: ['precios-propios'] as const,

  proyectos: (p: ParametrosLista) => ['proyectos', p] as const,
  proyecto: (id: string) => ['proyecto', id] as const,
  totales: (id: string) => ['totales', id] as const,
  avance: (id: string) => ['avance', id] as const,

  presupuesto: (proyectoId: string) => ['presupuesto', proyectoId] as const,
  memoria: (itemId: string) => ['memoria', itemId] as const,
  programacion: (proyectoId: string) => ['programacion', proyectoId] as const,
  resumenInsumos: (proyectoId: string) => ['resumen-insumos', proyectoId] as const,
  apuProyecto: (proyectoId: string) => ['apu-proyecto', proyectoId] as const,
  especificacionesProyecto: (proyectoId: string) => ['especificaciones-proyecto', proyectoId] as const,
  actas: (proyectoId: string) => ['actas', proyectoId] as const,
  actaItems: (actaId: string) => ['acta-items', actaId] as const,
  bitacora: (proyectoId: string) => ['bitacora', proyectoId] as const,
  documentos: (proyectoId: string) => ['documentos', proyectoId] as const,
} as const;

/** El catalogo global casi no cambia: se cachea agresivamente. */
export const TIEMPOS_CACHE = {
  catalogo: 1000 * 60 * 30,
  proyecto: 1000 * 30,
  corto: 1000 * 10,
} as const;
