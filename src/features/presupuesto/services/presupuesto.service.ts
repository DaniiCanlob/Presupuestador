import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError } from '@/common/lib/errores';
import type { PresupuestoItem } from '@/common/types/proyecto';
import type { ApuItemRow } from '@/common/types/database.types';

export interface EntradaItemManual {
  descripcion: string;
  unidad: string;
  cantidad: number;
  valor_unitario: number;
  capitulo_nombre: string | null;
  nota: string | null;
}

export const presupuestoService = {
  async listar(proyectoId: string): Promise<PresupuestoItem[]> {
    const respuesta = await supabase
      .from('presupuesto_items')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('orden', { ascending: true });
    return desempacar(respuesta);
  },

  /** Agrega actividades del catalogo congelando el precio vigente. */
  async agregarDelCatalogo(proyectoId: string, actividades: string[]): Promise<PresupuestoItem[]> {
    const { data, error } = await supabase.rpc('agregar_actividades_presupuesto', {
      p_proyecto: proyectoId,
      p_actividades: actividades,
      p_cantidad: 0,
    });
    if (error) throw traducirError(error);
    return (data ?? []) as unknown as PresupuestoItem[];
  },

  async agregarManual(proyectoId: string, entrada: EntradaItemManual): Promise<PresupuestoItem> {
    const { data: ultimo } = await supabase
      .from('presupuesto_items')
      .select('orden')
      .eq('proyecto_id', proyectoId)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    const respuesta = await supabase
      .from('presupuesto_items')
      .insert({
        proyecto_id: proyectoId,
        orden: (ultimo?.orden ?? 0) + 1,
        cantidad_desde_memoria: false,
        ...entrada,
      })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async actualizar(id: string, cambios: Partial<PresupuestoItem>): Promise<PresupuestoItem> {
    const respuesta = await supabase
      .from('presupuesto_items')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    return desempacar(respuesta);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('presupuesto_items').delete().eq('id', id);
    if (error) throw traducirError(error);
  },

  async reordenar(items: { id: string; orden: number }[]): Promise<void> {
    await Promise.all(
      items.map(({ id, orden }) =>
        supabase.from('presupuesto_items').update({ orden }).eq('id', id),
      ),
    );
  },

  async actualizarPrecios(proyectoId: string): Promise<number> {
    const { data, error } = await supabase.rpc('actualizar_precios_presupuesto', {
      p_proyecto: proyectoId,
    });
    if (error) throw traducirError(error);
    return (data as number) ?? 0;
  },

  /** APU de todas las actividades del presupuesto, para la vista "APU del proyecto". */
  async apuDelProyecto(proyectoId: string): Promise<Record<string, ApuItemRow[]>> {
    const items = await presupuestoService.listar(proyectoId);
    const ids = [...new Set(items.map((i) => i.actividad_id).filter((v): v is string => Boolean(v)))];
    if (ids.length === 0) return {};

    const respuesta = await supabase
      .from('apu_items')
      .select('*')
      .in('actividad_id', ids)
      .order('orden', { ascending: true });
    const filas = desempacar(respuesta);

    return filas.reduce<Record<string, ApuItemRow[]>>((acumulado, fila) => {
      (acumulado[fila.actividad_id] ??= []).push(fila);
      return acumulado;
    }, {});
  },
};
