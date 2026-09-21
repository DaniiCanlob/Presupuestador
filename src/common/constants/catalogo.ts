import type { TipoInsumo } from '@/common/types/database.types';

export const TIPOS_INSUMO: { valor: TipoInsumo; etiqueta: string; plural: string }[] = [
  { valor: 'material', etiqueta: 'Material', plural: 'Materiales' },
  { valor: 'equipo', etiqueta: 'Equipo', plural: 'Equipo y herramientas' },
  { valor: 'transporte', etiqueta: 'Transporte', plural: 'Transportes' },
  { valor: 'mano_obra', etiqueta: 'Mano de obra', plural: 'Mano de obra' },
  { valor: 'otro', etiqueta: 'Otro', plural: 'Otros' },
];

export const ETIQUETA_TIPO: Record<TipoInsumo, string> = {
  material: 'Materiales',
  equipo: 'Equipo y herramientas',
  transporte: 'Transportes',
  mano_obra: 'Mano de obra',
  otro: 'Otros',
};

export const ORDEN_TIPO: TipoInsumo[] = ['material', 'equipo', 'transporte', 'mano_obra', 'otro'];

/** Un tono por tipo de insumo, con la misma luminosidad en claro y oscuro. */
export const COLOR_TIPO: Record<TipoInsumo, string> = {
  material: 'bg-material-suave text-material ring-material/20',
  equipo: 'bg-equipo-suave text-equipo ring-equipo/20',
  transporte: 'bg-transporte-suave text-transporte ring-transporte/20',
  mano_obra: 'bg-mano-suave text-mano ring-mano/20',
  otro: 'bg-otro-suave text-otro ring-otro/20',
};

/** Unidades usadas por el catalogo original. */
export const UNIDADES = [
  'Un', 'm', 'm2', 'm3', 'ml', 'Kg', 'Ton', 'Lt', 'Gal', 'Día', 'Hr', 'Mes',
  'Glb', 'Par', 'Pto', 'Bto', 'Rll', '%',
] as const;

export const TAMANO_PAGINA = 25;
export const TAMANO_PAGINA_BUSCADOR = 15;
export const MINIMO_CARACTERES_BUSQUEDA = 2;
export const RETARDO_BUSQUEDA_MS = 300;
