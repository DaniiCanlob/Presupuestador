import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError } from '@/common/lib/errores';
import type { ApunteBitacora } from '@/common/types/proyecto';

export interface EntradaBitacora {
  fecha: string;
  clima: string | null;
  personal_obra: number | null;
  actividades: string | null;
  observaciones: string | null;
}

export const bitacoraService = {
  async listar(proyectoId: string): Promise<ApunteBitacora[]> {
    const respuesta = await supabase
      .from('bitacora')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false });
    return desempacar(respuesta);
  },

  async crear(proyectoId: string, entrada: EntradaBitacora): Promise<ApunteBitacora> {
    const respuesta = await supabase
      .from('bitacora')
      .insert({ proyecto_id: proyectoId, ...entrada })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async actualizar(id: string, cambios: Partial<EntradaBitacora>): Promise<ApunteBitacora> {
    const respuesta = await supabase.from('bitacora').update(cambios).eq('id', id).select().single();
    return desempacar(respuesta);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('bitacora').delete().eq('id', id);
    if (error) throw traducirError(error);
  },
};
