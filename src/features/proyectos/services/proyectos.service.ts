import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError } from '@/common/lib/errores';
import { armarPagina, rango } from '@/common/lib/paginacion';
import { terminoBusqueda } from '@/common/lib/texto';
import { MINIMO_CARACTERES_BUSQUEDA } from '@/common/constants/catalogo';
import type { Pagina } from '@/common/types/api';
import type { EntradaProyecto, FiltrosProyectos, Proyecto } from '@/common/types/proyecto';
import type { AvanceProyecto, TotalesProyecto } from '@/common/types/database.types';

export const proyectosService = {
  async listar(filtros: FiltrosProyectos): Promise<Pagina<Proyecto>> {
    const r = rango(filtros);
    let consulta = supabase
      .from('proyectos')
      .select('*', { count: 'exact' })
      .eq('archivado', filtros.archivado ?? false);

    const busqueda = (filtros.busqueda ?? '').trim();
    if (busqueda.length >= MINIMO_CARACTERES_BUSQUEDA) {
      const patron = terminoBusqueda(busqueda);
      consulta = consulta.or(
        `nombre.ilike.${patron},numero_contrato.ilike.${patron},objeto.ilike.${patron}`,
      );
    }
    if (filtros.estado) consulta = consulta.eq('estado', filtros.estado);

    const { data, error, count } = await consulta
      .order('created_at', { ascending: false })
      .range(r.desde, r.hasta);
    if (error) throw traducirError(error);

    return armarPagina(data ?? [], count ?? 0, r);
  },

  async obtener(id: string): Promise<Proyecto> {
    const respuesta = await supabase.from('proyectos').select('*').eq('id', id).single();
    return desempacar(respuesta);
  },

  async crear(entrada: Partial<EntradaProyecto>): Promise<Proyecto> {
    const { data: usuario } = await supabase.auth.getUser();
    const respuesta = await supabase
      .from('proyectos')
      .insert({ ...entrada, owner_id: usuario.user?.id })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async actualizar(id: string, entrada: Partial<EntradaProyecto>): Promise<Proyecto> {
    const respuesta = await supabase
      .from('proyectos')
      .update(entrada)
      .eq('id', id)
      .select()
      .single();
    return desempacar(respuesta);
  },

  async archivar(id: string, archivado: boolean): Promise<void> {
    const { error } = await supabase.from('proyectos').update({ archivado }).eq('id', id);
    if (error) throw traducirError(error);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) throw traducirError(error);
  },

  async duplicar(id: string, nombre: string): Promise<string> {
    const { data, error } = await supabase.rpc('duplicar_proyecto', {
      p_proyecto: id,
      p_nombre: nombre,
    });
    if (error) throw traducirError(error);
    return data as string;
  },

  async totales(id: string): Promise<TotalesProyecto> {
    const { data, error } = await supabase.rpc('totales_proyecto', { p_proyecto: id });
    if (error) throw traducirError(error);
    const filas = (data ?? []) as unknown as TotalesProyecto[];
    return (
      filas[0] ?? {
        actividades: 0,
        costo_directo: 0,
        administracion: 0,
        imprevistos: 0,
        utilidad: 0,
        iva_utilidad: 0,
        aiu: 0,
        total: 0,
        anticipo: 0,
      }
    );
  },

  async avance(id: string): Promise<AvanceProyecto> {
    const { data, error } = await supabase.rpc('avance_proyecto', { p_proyecto: id });
    if (error) throw traducirError(error);
    const filas = (data ?? []) as unknown as AvanceProyecto[];
    return filas[0] ?? { valor_total: 0, valor_ejecutado: 0, avance_pct: 0, actividades: 0, terminadas: 0 };
  },
};
