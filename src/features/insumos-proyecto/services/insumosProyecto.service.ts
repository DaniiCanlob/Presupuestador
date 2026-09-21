import { supabase } from '@/common/lib/supabase';
import { traducirError } from '@/common/lib/errores';
import type { ResumenInsumoFila } from '@/common/types/database.types';

export const insumosProyectoService = {
  /**
   * Explota el APU de cada actividad del presupuesto por la cantidad de obra
   * y consolida los insumos. El calculo corre en la base (RPC resumen_insumos).
   */
  async resumen(proyectoId: string): Promise<ResumenInsumoFila[]> {
    const { data, error } = await supabase.rpc('resumen_insumos', { p_proyecto: proyectoId });
    if (error) throw traducirError(error);
    return (data ?? []) as unknown as ResumenInsumoFila[];
  },
};
