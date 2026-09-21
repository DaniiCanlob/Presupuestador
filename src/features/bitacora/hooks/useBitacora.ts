import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bitacoraService, type EntradaBitacora } from '@/features/bitacora/services/bitacora.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';

export function useBitacora(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.bitacora(proyectoId ?? ''),
    queryFn: () => bitacoraService.listar(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useAccionesBitacora(proyectoId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();
  const refrescar = (): void => {
    cliente.invalidateQueries({ queryKey: CLAVES.bitacora(proyectoId) });
  };
  const alFallar = (error: Error): void => notificar(error.message, 'error');

  const crear = useMutation({
    mutationFn: (entrada: EntradaBitacora) => bitacoraService.crear(proyectoId, entrada),
    onSuccess: () => {
      refrescar();
      notificar('Apunte guardado.');
    },
    onError: alFallar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => bitacoraService.eliminar(id),
    onSuccess: () => {
      refrescar();
      notificar(MENSAJES.eliminado);
    },
    onError: alFallar,
  });

  return { crear, eliminar };
}
