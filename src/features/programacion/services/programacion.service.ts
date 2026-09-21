import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError } from '@/common/lib/errores';
import type { FilaProgramacion } from '@/common/types/proyecto';
import type { FechasProyecto, ProgramacionItemRow } from '@/common/types/database.types';

type FilaCruda = ProgramacionItemRow & {
  presupuesto_items: {
    codigo: string | null;
    descripcion: string;
    unidad: string;
    cantidad: number;
    valor_parcial: number;
    orden: number;
  } | null;
};

export const programacionService = {
  /** Calcula duraciones y fechas en cascada para todo el proyecto. */
  async recalcular(proyectoId: string): Promise<number> {
    const { data, error } = await supabase.rpc('programar_proyecto', { p_proyecto: proyectoId });
    if (error) throw traducirError(error);
    return (data as number) ?? 0;
  },

  async listar(proyectoId: string): Promise<FilaProgramacion[]> {
    // `programacion_items` apunta dos veces a `presupuesto_items`
    // (presupuesto_item_id y predecesor_item_id), asi que hay que decirle a
    // PostgREST por cual de las dos llaves queremos el embebido.
    const { data, error } = await supabase
      .from('programacion_items')
      .select(
        '*, presupuesto_items!presupuesto_item_id(codigo, descripcion, unidad, cantidad, valor_parcial, orden)',
      )
      .eq('proyecto_id', proyectoId)
      .returns<FilaCruda[]>();
    if (error) throw traducirError(error);

    return (data ?? [])
      .map((fila) => ({
        ...fila,
        codigo: fila.presupuesto_items?.codigo ?? null,
        descripcion: fila.presupuesto_items?.descripcion ?? '',
        unidad: fila.presupuesto_items?.unidad ?? '',
        cantidad: Number(fila.presupuesto_items?.cantidad ?? 0),
        valor_parcial: Number(fila.presupuesto_items?.valor_parcial ?? 0),
        orden: fila.presupuesto_items?.orden ?? 0,
      }))
      .sort((a, b) => a.orden - b.orden);
  },

  /** Plazo contractual frente al fin que sale del cronograma. */
  async fechas(proyectoId: string): Promise<FechasProyecto | null> {
    const { data, error } = await supabase.rpc('fechas_proyecto', { p_proyecto: proyectoId });
    if (error) throw traducirError(error);
    return ((data ?? []) as unknown as FechasProyecto[])[0] ?? null;
  },

  async actualizar(id: string, cambios: Partial<ProgramacionItemRow>): Promise<ProgramacionItemRow> {
    const respuesta = await supabase
      .from('programacion_items')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    return desempacar(respuesta);
  },
};
