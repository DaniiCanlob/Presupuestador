import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { proyectosService } from '@/features/proyectos/services/proyectos.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';
import { RUTAS } from '@/common/constants/rutas';
import type { EntradaProyecto, FiltrosProyectos } from '@/common/types/proyecto';

export function useProyectos(filtros: FiltrosProyectos) {
  return useQuery({
    queryKey: CLAVES.proyectos(filtros),
    queryFn: () => proyectosService.listar(filtros),
    placeholderData: (previo) => previo,
  });
}

export function useProyecto(id: string | undefined) {
  return useQuery({
    queryKey: CLAVES.proyecto(id ?? ''),
    queryFn: () => proyectosService.obtener(id as string),
    enabled: Boolean(id),
  });
}

export function useTotales(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.totales(proyectoId ?? ''),
    queryFn: () => proyectosService.totales(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useAvance(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.avance(proyectoId ?? ''),
    queryFn: () => proyectosService.avance(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useCrearProyecto() {
  const cliente = useQueryClient();
  const navegar = useNavigate();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (entrada: Partial<EntradaProyecto>) => proyectosService.crear(entrada),
    onSuccess: (proyecto) => {
      cliente.invalidateQueries({ queryKey: ['proyectos'] });
      notificar('Proyecto creado.');
      navegar(RUTAS.presupuesto(proyecto.id));
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useActualizarProyecto(id: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (entrada: Partial<EntradaProyecto>) => proyectosService.actualizar(id, entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.proyecto(id) });
      cliente.invalidateQueries({ queryKey: CLAVES.totales(id) });
      cliente.invalidateQueries({ queryKey: ['proyectos'] });
      notificar(MENSAJES.guardado);
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useAccionesProyecto() {
  const cliente = useQueryClient();
  const navegar = useNavigate();
  const notificar = useNotificar();

  const invalidar = (): void => {
    cliente.invalidateQueries({ queryKey: ['proyectos'] });
  };

  const eliminar = useMutation({
    mutationFn: (id: string) => proyectosService.eliminar(id),
    onSuccess: () => {
      invalidar();
      notificar(MENSAJES.eliminado);
      navegar(RUTAS.proyectos);
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });

  const archivar = useMutation({
    mutationFn: ({ id, archivado }: { id: string; archivado: boolean }) =>
      proyectosService.archivar(id, archivado),
    onSuccess: invalidar,
    onError: (error: Error) => notificar(error.message, 'error'),
  });

  const duplicar = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) =>
      proyectosService.duplicar(id, nombre),
    onSuccess: (nuevoId) => {
      invalidar();
      notificar('Proyecto duplicado.');
      navegar(RUTAS.presupuesto(nuevoId));
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });

  return { eliminar, archivar, duplicar };
}
