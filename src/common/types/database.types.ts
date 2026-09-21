/**
 * Tipado de la base de datos.
 * Puede regenerarse con `npm run gen:types` (supabase CLI).
 */

export type TipoInsumo = 'material' | 'equipo' | 'transporte' | 'mano_obra' | 'otro';
export type TipoContrato =
  | 'obra'
  | 'consultoria'
  | 'interventoria'
  | 'suministro'
  | 'mantenimiento'
  | 'otro';
export type EstadoProyecto = 'borrador' | 'en_curso' | 'suspendido' | 'terminado' | 'liquidado';
export type EstadoActa = 'borrador' | 'presentada' | 'aprobada' | 'pagada';
export type TipoDocumento = 'foto' | 'plano' | 'contrato' | 'acta' | 'cotizacion' | 'otro';

type Tabla<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type CapituloRow = {
  id: string;
  owner_id: string | null;
  codigo: string;
  nombre: string;
  orden: number;
  created_at: string;
}

export type InsumoRow = {
  id: string;
  owner_id: string | null;
  descripcion: string;
  unidad: string;
  tipo: TipoInsumo;
  precio_unitario: number;
  es_auxiliar: boolean;
  marca: string | null;
  proveedor: string | null;
  notas: string | null;
  activo: boolean;
  busqueda: string;
  created_at: string;
  updated_at: string;
}

export type InsumoComponenteRow = {
  id: string;
  auxiliar_id: string;
  orden: number;
  grupo: string;
  tipo: TipoInsumo;
  insumo_id: string | null;
  descripcion: string;
  unidad: string | null;
  cantidad: number;
  precio_unitario: number;
  es_porcentaje: boolean;
  valor_parcial: number;
}

export type ActividadRow = {
  id: string;
  owner_id: string | null;
  capitulo_id: string | null;
  codigo: string;
  descripcion: string;
  unidad: string;
  valor_unitario: number;
  rendimiento_dia: number | null;
  orden: number;
  activo: boolean;
  busqueda: string;
  created_at: string;
  updated_at: string;
}

export type ApuItemRow = {
  id: string;
  actividad_id: string;
  orden: number;
  grupo: string;
  tipo: TipoInsumo;
  insumo_id: string | null;
  descripcion: string;
  unidad: string | null;
  cantidad: number;
  precio_unitario: number;
  es_porcentaje: boolean;
  valor_parcial: number;
}

export type EspecificacionRow = {
  actividad_id: string;
  titulo: string | null;
  descripcion: string | null;
  ejecucion: string | null;
  materiales: string | null;
  herramientas_equipo: string | null;
  personal: string | null;
  ensayos: string | null;
  tolerancia: string | null;
  unidad_medida: string | null;
  unidad_pago: string | null;
  updated_at: string;
}

export type PrecioInsumoRow = {
  owner_id: string;
  insumo_id: string;
  precio_unitario: number;
  vigente_desde: string;
  nota: string | null;
  updated_at: string;
}

export type PerfilRow = {
  id: string;
  nombre_completo: string | null;
  empresa: string | null;
  nit: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  logo_url: string | null;
  moneda: string;
  created_at: string;
  updated_at: string;
}

export type ProyectoRow = {
  id: string;
  owner_id: string;
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
  fecha_fin: string | null;
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
  archivado: boolean;
  created_at: string;
  updated_at: string;
}

export type PresupuestoItemRow = {
  id: string;
  proyecto_id: string;
  orden: number;
  capitulo_id: string | null;
  capitulo_nombre: string | null;
  actividad_id: string | null;
  codigo: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valor_unitario: number;
  cantidad_desde_memoria: boolean;
  nota: string | null;
  valor_parcial: number;
  created_at: string;
  updated_at: string;
}

export type MemoriaItemRow = {
  id: string;
  presupuesto_item_id: string;
  orden: number;
  descripcion: string | null;
  largo: number | null;
  ancho: number | null;
  alto: number | null;
  veces: number;
  subtotal: number;
  created_at: string;
}

export type ProgramacionItemRow = {
  id: string;
  proyecto_id: string;
  presupuesto_item_id: string;
  rendimiento_dia: number | null;
  cuadrillas: number;
  duracion_dias: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  predecesor_item_id: string | null;
  avance_pct: number;
  responsable: string | null;
  notas: string | null;
  updated_at: string;
}

export type ActaRow = {
  id: string;
  proyecto_id: string;
  numero: number;
  tipo: string;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  estado: EstadoActa;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export type ActaItemRow = {
  id: string;
  acta_id: string;
  presupuesto_item_id: string;
  cantidad_ejecutada: number;
  valor_unitario: number;
  valor: number;
}

export type BitacoraRow = {
  id: string;
  proyecto_id: string;
  fecha: string;
  clima: string | null;
  personal_obra: number | null;
  actividades: string | null;
  observaciones: string | null;
  created_at: string;
}

export type DocumentoRow = {
  id: string;
  proyecto_id: string;
  presupuesto_item_id: string | null;
  nombre: string;
  tipo: TipoDocumento;
  ruta: string;
  mime: string | null;
  tamano_bytes: number | null;
  created_at: string;
}

export type TotalesProyecto = {
  actividades: number;
  costo_directo: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
  iva_utilidad: number;
  aiu: number;
  total: number;
  anticipo: number;
}

export type ResumenInsumoFila = {
  tipo: TipoInsumo;
  insumo_id: string | null;
  descripcion: string;
  unidad: string;
  cantidad_total: number;
  precio_unitario: number;
  valor_total: number;
}

export type FechasProyecto = {
  fecha_inicio: string | null;
  plazo_dias: number | null;
  /** Fin del plazo contractual: fecha_inicio + plazo_dias - 1. */
  fin_plazo: string | null;
  /** Fin que resulta de la programación de actividades. */
  fin_programacion: string | null;
  dias_programados: number | null;
  /** Positivo = el cronograma se pasa del plazo. */
  desfase_dias: number | null;
}

export type AvanceProyecto = {
  valor_total: number;
  valor_ejecutado: number;
  avance_pct: number;
  actividades: number;
  terminadas: number;
}

export type Database = {
  public: {
    Tables: {
      capitulos: Tabla<CapituloRow>;
      insumos: Tabla<InsumoRow>;
      insumo_componentes: Tabla<InsumoComponenteRow>;
      actividades: Tabla<ActividadRow>;
      apu_items: Tabla<ApuItemRow>;
      especificaciones: Tabla<EspecificacionRow>;
      precios_insumo: Tabla<PrecioInsumoRow>;
      perfiles: Tabla<PerfilRow>;
      proyectos: Tabla<ProyectoRow>;
      presupuesto_items: Tabla<PresupuestoItemRow>;
      memoria_items: Tabla<MemoriaItemRow>;
      programacion_items: Tabla<ProgramacionItemRow>;
      actas: Tabla<ActaRow>;
      acta_items: Tabla<ActaItemRow>;
      bitacora: Tabla<BitacoraRow>;
      documentos: Tabla<DocumentoRow>;
    };
    Views: Record<string, never>;
    Functions: {
      valor_unitario_actividad: { Args: { p_actividad: string }; Returns: number };
      rendimiento_sugerido: { Args: { p_actividad: string }; Returns: number | null };
      agregar_actividades_presupuesto: {
        Args: { p_proyecto: string; p_actividades: string[]; p_cantidad?: number };
        Returns: PresupuestoItemRow[];
      };
      actualizar_precios_presupuesto: { Args: { p_proyecto: string }; Returns: number };
      totales_proyecto: { Args: { p_proyecto: string }; Returns: TotalesProyecto[] };
      resumen_insumos: { Args: { p_proyecto: string }; Returns: ResumenInsumoFila[] };
      programar_proyecto: { Args: { p_proyecto: string }; Returns: number };
      avance_proyecto: { Args: { p_proyecto: string }; Returns: AvanceProyecto[] };
      fechas_proyecto: { Args: { p_proyecto: string }; Returns: FechasProyecto[] };
      duplicar_proyecto: { Args: { p_proyecto: string; p_nombre: string }; Returns: string };
    };
    Enums: {
      tipo_insumo: TipoInsumo;
      tipo_contrato: TipoContrato;
      estado_proyecto: EstadoProyecto;
      estado_acta: EstadoActa;
      tipo_documento: TipoDocumento;
    };
    CompositeTypes: Record<string, never>;
  };
}
