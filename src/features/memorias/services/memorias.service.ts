import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError } from '@/common/lib/errores';
import type { MemoriaItem } from '@/common/types/proyecto';

export interface EntradaMemoria {
  descripcion: string | null;
  largo: number | null;
  ancho: number | null;
  alto: number | null;
  veces: number;
}

export const memoriasService = {
  async listar(presupuestoItemId: string): Promise<MemoriaItem[]> {
    const respuesta = await supabase
      .from('memoria_items')
      .select('*')
      .eq('presupuesto_item_id', presupuestoItemId)
      .order('orden', { ascending: true });
    return desempacar(respuesta);
  },

  async listarDelProyecto(proyectoId: string): Promise<Record<string, MemoriaItem[]>> {
    const { data: items, error: errorItems } = await supabase
      .from('presupuesto_items')
      .select('id')
      .eq('proyecto_id', proyectoId);
    if (errorItems) throw traducirError(errorItems);

    const ids = (items ?? []).map((i) => i.id);
    if (ids.length === 0) return {};

    const respuesta = await supabase
      .from('memoria_items')
      .select('*')
      .in('presupuesto_item_id', ids)
      .order('orden', { ascending: true });
    const filas = desempacar(respuesta);

    return filas.reduce<Record<string, MemoriaItem[]>>((acumulado, fila) => {
      (acumulado[fila.presupuesto_item_id] ??= []).push(fila);
      return acumulado;
    }, {});
  },

  async agregar(presupuestoItemId: string, entrada: Partial<EntradaMemoria>): Promise<MemoriaItem> {
    const { data: ultimo } = await supabase
      .from('memoria_items')
      .select('orden')
      .eq('presupuesto_item_id', presupuestoItemId)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    const respuesta = await supabase
      .from('memoria_items')
      .insert({
        presupuesto_item_id: presupuestoItemId,
        orden: (ultimo?.orden ?? 0) + 1,
        veces: 1,
        ...entrada,
      })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async actualizar(id: string, cambios: Partial<EntradaMemoria>): Promise<MemoriaItem> {
    const respuesta = await supabase
      .from('memoria_items')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    return desempacar(respuesta);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('memoria_items').delete().eq('id', id);
    if (error) throw traducirError(error);
  },
};
