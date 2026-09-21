import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { programacionService } from '@/features/programacion/services/programacion.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import type { ProgramacionItemRow } from '@/common/types/database.types';

export function useProgramacion(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.programacion(proyectoId ?? ''),
    queryFn: () => programacionService.listar(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useFechasProyecto(proyectoId: string | undefined) {
  return useQuery({
    queryKey: [...CLAVES.programacion(proyectoId ?? ''), 'fechas'],
    queryFn: () => programacionService.fechas(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useAccionesProgramacion(proyectoId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  const refrescar = (): void => {
    // La clave de fechas cuelga de la de programacion, asi que se invalida sola.
    cliente.invalidateQueries({ queryKey: CLAVES.programacion(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.avance(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.proyecto(proyectoId) });
  };

  const recalcular = useMutation({
    mutationFn: () => programacionService.recalcular(proyectoId),
    onSuccess: (filas) => {
      refrescar();
      notificar(`Programación calculada para ${filas} actividad(es).`);
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<ProgramacionItemRow> }) =>
      programacionService.actualizar(id, cambios),
    onSuccess: refrescar,
    onError: (error: Error) => notificar(error.message, 'error'),
  });

  return { recalcular, actualizar };
}
