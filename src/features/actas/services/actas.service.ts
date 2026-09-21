import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError } from '@/common/lib/errores';
import type { Acta, ActaItem } from '@/common/types/proyecto';
import type { EstadoActa } from '@/common/types/database.types';

export interface EntradaActa {
  numero: number;
  tipo: string;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  estado: EstadoActa;
  observaciones: string | null;
}

export const actasService = {
  async listar(proyectoId: string): Promise<Acta[]> {
    const respuesta = await supabase
      .from('actas')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('numero', { ascending: false });
    return desempacar(respuesta);
  },

  async crear(proyectoId: string, entrada: Partial<EntradaActa>): Promise<Acta> {
    const { data: ultima } = await supabase
      .from('actas')
      .select('numero')
      .eq('proyecto_id', proyectoId)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle();

    const respuesta = await supabase
      .from('actas')
      .insert({ proyecto_id: proyectoId, numero: (ultima?.numero ?? 0) + 1, ...entrada })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async actualizar(id: string, cambios: Partial<EntradaActa>): Promise<Acta> {
    const respuesta = await supabase.from('actas').update(cambios).eq('id', id).select().single();
    return desempacar(respuesta);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('actas').delete().eq('id', id);
    if (error) throw traducirError(error);
  },

  async items(actaId: string): Promise<ActaItem[]> {
    const respuesta = await supabase.from('acta_items').select('*').eq('acta_id', actaId);
    return desempacar(respuesta);
  },

  /** Guarda la cantidad ejecutada de una actividad dentro del acta. */
  async registrarEjecutado(
    actaId: string,
    presupuestoItemId: string,
    cantidad: number,
    valorUnitario: number,
  ): Promise<ActaItem> {
    const respuesta = await supabase
      .from('acta_items')
      .upsert(
        {
          acta_id: actaId,
          presupuesto_item_id: presupuestoItemId,
          cantidad_ejecutada: cantidad,
          valor_unitario: valorUnitario,
        },
        { onConflict: 'acta_id,presupuesto_item_id' },
      )
      .select()
      .single();
    return desempacar(respuesta);
  },
};
