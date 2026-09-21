import type { EstadoActa, EstadoProyecto, TipoContrato, TipoDocumento } from '@/common/types/database.types';

export const TIPOS_CONTRATO: { valor: TipoContrato; etiqueta: string }[] = [
  { valor: 'obra', etiqueta: 'Obra' },
  { valor: 'consultoria', etiqueta: 'Consultoría' },
  { valor: 'interventoria', etiqueta: 'Interventoría' },
  { valor: 'suministro', etiqueta: 'Suministro' },
  { valor: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export const ESTADOS_PROYECTO: { valor: EstadoProyecto; etiqueta: string; color: string }[] = [
  { valor: 'borrador', etiqueta: 'Borrador', color: 'bg-otro-suave text-otro ring-otro/20' },
  { valor: 'en_curso', etiqueta: 'En curso', color: 'bg-accent text-accent-foreground ring-primary/25' },
  { valor: 'suspendido', etiqueta: 'Suspendido', color: 'bg-material-suave text-alerta ring-alerta/25' },
  { valor: 'terminado', etiqueta: 'Terminado', color: 'bg-mano-suave text-exito ring-exito/25' },
  { valor: 'liquidado', etiqueta: 'Liquidado', color: 'bg-transporte-suave text-transporte ring-transporte/20' },
];

export const ESTADOS_ACTA: { valor: EstadoActa; etiqueta: string }[] = [
  { valor: 'borrador', etiqueta: 'Borrador' },
  { valor: 'presentada', etiqueta: 'Presentada' },
  { valor: 'aprobada', etiqueta: 'Aprobada' },
  { valor: 'pagada', etiqueta: 'Pagada' },
];

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; etiqueta: string }[] = [
  { valor: 'foto', etiqueta: 'Fotografía' },
  { valor: 'plano', etiqueta: 'Plano' },
  { valor: 'contrato', etiqueta: 'Contrato' },
  { valor: 'acta', etiqueta: 'Acta' },
  { valor: 'cotizacion', etiqueta: 'Cotización' },
  { valor: 'otro', etiqueta: 'Otro' },
];

/** Valores tipicos de AIU en contratacion publica colombiana. */
export const AIU_SUGERIDO = {
  administracion: 15,
  imprevistos: 5,
  utilidad: 5,
  ivaUtilidad: 19,
} as const;

export const DIAS_HABILES_OPCIONES = [
  { valor: 5, etiqueta: 'Lunes a viernes (5 días)' },
  { valor: 6, etiqueta: 'Lunes a sábado (6 días)' },
  { valor: 7, etiqueta: 'Todos los días (7 días)' },
];

export const CLIMA_OPCIONES = ['Soleado', 'Nublado', 'Lluvia ligera', 'Lluvia fuerte', 'Tormenta'];
