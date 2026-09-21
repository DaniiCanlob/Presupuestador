import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoriasService, type EntradaMemoria } from '@/features/memorias/services/memorias.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';

export function useMemoria(presupuestoItemId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.memoria(presupuestoItemId ?? ''),
    queryFn: () => memoriasService.listar(presupuestoItemId as string),
    enabled: Boolean(presupuestoItemId),
  });
}

export function useAccionesMemoria(proyectoId: string, presupuestoItemId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  const refrescar = (): void => {
    cliente.invalidateQueries({ queryKey: CLAVES.memoria(presupuestoItemId) });
    cliente.invalidateQueries({ queryKey: CLAVES.presupuesto(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.totales(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.resumenInsumos(proyectoId) });
  };

  const alFallar = (error: Error): void => notificar(error.message, 'error');

  const agregar = useMutation({
    mutationFn: (entrada: Partial<EntradaMemoria>) =>
      memoriasService.agregar(presupuestoItemId, entrada),
    onSuccess: refrescar,
    onError: alFallar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<EntradaMemoria> }) =>
      memoriasService.actualizar(id, cambios),
    onSuccess: refrescar,
    onError: alFallar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => memoriasService.eliminar(id),
    onSuccess: refrescar,
    onError: alFallar,
  });

  return { agregar, actualizar, eliminar };
}
