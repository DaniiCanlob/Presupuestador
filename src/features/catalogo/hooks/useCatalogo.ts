import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogoService } from '@/features/catalogo/services/catalogo.service';
import { CLAVES, TIEMPOS_CACHE } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';
import type {
  EntradaActividad,
  EntradaApuItem,
  EntradaInsumo,
  FiltrosActividades,
  FiltrosInsumos,
} from '@/common/types/catalogo';

export function useCapitulos() {
  return useQuery({
    queryKey: CLAVES.capitulos,
    queryFn: () => catalogoService.listarCapitulos(),
    staleTime: TIEMPOS_CACHE.catalogo,
  });
}

export function useActividades(filtros: FiltrosActividades) {
  return useQuery({
    queryKey: CLAVES.actividades(filtros),
    queryFn: () => catalogoService.listarActividades(filtros),
    staleTime: TIEMPOS_CACHE.catalogo,
    placeholderData: (previo) => previo,
  });
}

export function useActividad(id: string | undefined) {
  return useQuery({
    queryKey: CLAVES.actividad(id ?? ''),
    queryFn: () => catalogoService.obtenerActividad(id as string),
    enabled: Boolean(id),
    staleTime: TIEMPOS_CACHE.catalogo,
  });
}

export function useApu(actividadId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.apu(actividadId ?? ''),
    queryFn: () => catalogoService.listarApu(actividadId as string),
    enabled: Boolean(actividadId),
    staleTime: TIEMPOS_CACHE.catalogo,
  });
}

export function useEspecificacion(actividadId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.especificacion(actividadId ?? ''),
    queryFn: () => catalogoService.obtenerEspecificacion(actividadId as string),
    enabled: Boolean(actividadId),
    staleTime: TIEMPOS_CACHE.catalogo,
  });
}

export function useInsumos(filtros: FiltrosInsumos) {
  return useQuery({
    queryKey: CLAVES.insumos(filtros),
    queryFn: () => catalogoService.listarInsumos(filtros),
    staleTime: TIEMPOS_CACHE.catalogo,
    placeholderData: (previo) => previo,
  });
}

export function useGuardarActividad() {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (datos: { id?: string; entrada: EntradaActividad }) =>
      datos.id
        ? catalogoService.actualizarActividad(datos.id, datos.entrada)
        : catalogoService.crearActividad(datos.entrada),
    onSuccess: (actividad) => {
      cliente.invalidateQueries({ queryKey: ['actividades'] });
      cliente.invalidateQueries({ queryKey: CLAVES.actividad(actividad.id) });
      notificar(MENSAJES.guardado);
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useGuardarApu(actividadId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (items: EntradaApuItem[]) => catalogoService.guardarApu(actividadId, items),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.apu(actividadId) });
      cliente.invalidateQueries({ queryKey: CLAVES.actividad(actividadId) });
      notificar('APU actualizado.');
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useClonarActividad() {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: ({ id, codigo }: { id: string; codigo: string }) =>
      catalogoService.clonarActividad(id, codigo),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['actividades'] });
      notificar('Copia creada en tu catálogo.');
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useGuardarInsumo() {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (datos: { id?: string; entrada: EntradaInsumo }) =>
      datos.id
        ? catalogoService.actualizarInsumo(datos.id, datos.entrada)
        : catalogoService.crearInsumo(datos.entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['insumos'] });
      notificar(MENSAJES.guardado);
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function usePreciosPropios() {
  return useQuery({
    queryKey: CLAVES.preciosPropios,
    queryFn: () => catalogoService.listarPreciosPropios(),
    staleTime: TIEMPOS_CACHE.proyecto,
  });
}

export function useFijarPrecio() {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: async ({ insumoId, precio }: { insumoId: string; precio: number | null }) => {
      if (precio === null) await catalogoService.quitarPrecio(insumoId);
      else await catalogoService.fijarPrecio(insumoId, precio);
    },
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.preciosPropios });
      notificar('Precio actualizado. Aplica a los próximos presupuestos.');
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}
