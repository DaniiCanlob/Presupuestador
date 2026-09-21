import { supabase } from '@/common/lib/supabase';
import { traducirError, desempacar } from '@/common/lib/errores';
import { terminoBusqueda } from '@/common/lib/texto';
import { armarPagina, rango } from '@/common/lib/paginacion';
import { MINIMO_CARACTERES_BUSQUEDA } from '@/common/constants/catalogo';
import type { Pagina } from '@/common/types/api';
import type {
  Actividad,
  EntradaActividad,
  EntradaApuItem,
  EntradaInsumo,
  Especificacion,
  FiltrosActividades,
  FiltrosInsumos,
  Insumo,
} from '@/common/types/catalogo';
import type { ApuItemRow, CapituloRow, PrecioInsumoRow } from '@/common/types/database.types';

type ActividadConCapitulo = Actividad & {
  capitulos: { nombre: string; codigo: string } | null;
};

const aplanar = (fila: ActividadConCapitulo): Actividad => ({
  ...fila,
  capitulo_nombre: fila.capitulos?.nombre ?? null,
  capitulo_codigo: fila.capitulos?.codigo ?? null,
});

export const catalogoService = {
  // ------------------------------------------------------------- capitulos
  async listarCapitulos(): Promise<CapituloRow[]> {
    const respuesta = await supabase
      .from('capitulos')
      .select('*')
      .order('orden', { ascending: true });
    return desempacar(respuesta);
  },

  // ------------------------------------------------------------- actividades
  async listarActividades(filtros: FiltrosActividades): Promise<Pagina<Actividad>> {
    const r = rango(filtros);
    let consulta = supabase
      .from('actividades')
      .select('*, capitulos(nombre, codigo)', { count: 'exact' })
      .eq('activo', true);

    const busqueda = (filtros.busqueda ?? '').trim();
    if (busqueda.length >= MINIMO_CARACTERES_BUSQUEDA) {
      consulta = consulta.ilike('busqueda', terminoBusqueda(busqueda));
    }
    if (filtros.capituloId) consulta = consulta.eq('capitulo_id', filtros.capituloId);
    if (filtros.soloPropias) consulta = consulta.not('owner_id', 'is', null);

    const { data, error, count } = await consulta
      .order('orden', { ascending: true })
      .range(r.desde, r.hasta)
      .returns<ActividadConCapitulo[]>();
    if (error) throw traducirError(error);

    return armarPagina((data ?? []).map(aplanar), count ?? 0, r);
  },

  async obtenerActividad(id: string): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividades')
      .select('*, capitulos(nombre, codigo)')
      .eq('id', id)
      .single<ActividadConCapitulo>();
    if (error) throw traducirError(error);
    return aplanar(data);
  },

  async crearActividad(entrada: EntradaActividad): Promise<Actividad> {
    const { data: usuario } = await supabase.auth.getUser();
    const respuesta = await supabase
      .from('actividades')
      .insert({ ...entrada, owner_id: usuario.user?.id ?? null })
      .select()
      .single();
    return desempacar(respuesta) as Actividad;
  },

  async actualizarActividad(id: string, entrada: Partial<EntradaActividad>): Promise<Actividad> {
    const respuesta = await supabase
      .from('actividades')
      .update(entrada)
      .eq('id', id)
      .select()
      .single();
    return desempacar(respuesta) as Actividad;
  },

  async eliminarActividad(id: string): Promise<void> {
    const { error } = await supabase.from('actividades').delete().eq('id', id);
    if (error) throw traducirError(error);
  },

  /** Duplica una actividad del catalogo global como actividad propia editable. */
  async clonarActividad(id: string, codigoNuevo: string): Promise<Actividad> {
    const original = await catalogoService.obtenerActividad(id);
    const apu = await catalogoService.listarApu(id);

    const copia = await catalogoService.crearActividad({
      codigo: codigoNuevo,
      descripcion: original.descripcion,
      unidad: original.unidad,
      capitulo_id: original.capitulo_id,
      rendimiento_dia: original.rendimiento_dia,
    });

    if (apu.length > 0) {
      const { error } = await supabase.from('apu_items').insert(
        apu.map((i, indice) => ({
          actividad_id: copia.id,
          orden: indice + 1,
          grupo: i.grupo,
          tipo: i.tipo,
          insumo_id: i.insumo_id,
          descripcion: i.descripcion,
          unidad: i.unidad,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          es_porcentaje: i.es_porcentaje,
        })),
      );
      if (error) throw traducirError(error);
    }
    return copia;
  },

  // ------------------------------------------------------------- APU
  async listarApu(actividadId: string): Promise<ApuItemRow[]> {
    const respuesta = await supabase
      .from('apu_items')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('orden', { ascending: true });
    return desempacar(respuesta);
  },

  /** Reemplaza el APU completo de una actividad propia. */
  async guardarApu(actividadId: string, items: EntradaApuItem[]): Promise<ApuItemRow[]> {
    const { error: errorBorrado } = await supabase
      .from('apu_items')
      .delete()
      .eq('actividad_id', actividadId);
    if (errorBorrado) throw traducirError(errorBorrado);

    if (items.length === 0) return [];

    const respuesta = await supabase
      .from('apu_items')
      .insert(
        items.map((i, indice) => ({
          actividad_id: actividadId,
          orden: indice + 1,
          grupo: i.grupo,
          tipo: i.tipo,
          insumo_id: i.insumo_id,
          descripcion: i.descripcion,
          unidad: i.unidad,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          es_porcentaje: i.es_porcentaje,
        })),
      )
      .select();
    return desempacar(respuesta);
  },

  // ------------------------------------------------------------- especificaciones
  async obtenerEspecificacion(actividadId: string): Promise<Especificacion | null> {
    const { data, error } = await supabase
      .from('especificaciones')
      .select('*')
      .eq('actividad_id', actividadId)
      .maybeSingle();
    if (error) throw traducirError(error);
    return data;
  },

  async guardarEspecificacion(
    actividadId: string,
    entrada: Partial<Especificacion>,
  ): Promise<Especificacion> {
    const respuesta = await supabase
      .from('especificaciones')
      .upsert({ ...entrada, actividad_id: actividadId })
      .select()
      .single();
    return desempacar(respuesta);
  },

  // ------------------------------------------------------------- insumos
  async listarInsumos(filtros: FiltrosInsumos): Promise<Pagina<Insumo>> {
    const r = rango(filtros);
    let consulta = supabase.from('insumos').select('*', { count: 'exact' }).eq('activo', true);

    const busqueda = (filtros.busqueda ?? '').trim();
    if (busqueda.length >= MINIMO_CARACTERES_BUSQUEDA) {
      consulta = consulta.ilike('busqueda', terminoBusqueda(busqueda));
    }
    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);
    if (filtros.soloPropios) consulta = consulta.not('owner_id', 'is', null);
    if (filtros.soloAuxiliares) consulta = consulta.eq('es_auxiliar', true);

    const { data, error, count } = await consulta
      .order('descripcion', { ascending: true })
      .range(r.desde, r.hasta);
    if (error) throw traducirError(error);

    return armarPagina(data ?? [], count ?? 0, r);
  },

  async crearInsumo(entrada: EntradaInsumo): Promise<Insumo> {
    const { data: usuario } = await supabase.auth.getUser();
    const respuesta = await supabase
      .from('insumos')
      .insert({ ...entrada, owner_id: usuario.user?.id ?? null })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async actualizarInsumo(id: string, entrada: Partial<EntradaInsumo>): Promise<Insumo> {
    const respuesta = await supabase.from('insumos').update(entrada).eq('id', id).select().single();
    return desempacar(respuesta);
  },

  async eliminarInsumo(id: string): Promise<void> {
    const { error } = await supabase.from('insumos').delete().eq('id', id);
    if (error) throw traducirError(error);
  },

  // ------------------------------------------------------------- precios propios
  async listarPreciosPropios(): Promise<PrecioInsumoRow[]> {
    const respuesta = await supabase.from('precios_insumo').select('*');
    return desempacar(respuesta);
  },

  async fijarPrecio(insumoId: string, precio: number, nota?: string): Promise<PrecioInsumoRow> {
    const { data: usuario } = await supabase.auth.getUser();
    const respuesta = await supabase
      .from('precios_insumo')
      .upsert({
        owner_id: usuario.user?.id,
        insumo_id: insumoId,
        precio_unitario: precio,
        nota: nota ?? null,
      })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async quitarPrecio(insumoId: string): Promise<void> {
    const { error } = await supabase.from('precios_insumo').delete().eq('insumo_id', insumoId);
    if (error) throw traducirError(error);
  },
};
