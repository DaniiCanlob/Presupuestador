import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { perfilService } from '@/features/perfil/services/perfil.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';
import type { EntradaPerfil } from '@/common/types/auth';

export function usePerfil() {
  return useQuery({ queryKey: CLAVES.perfil, queryFn: () => perfilService.obtener() });
}

export function useGuardarPerfil() {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (entrada: Partial<EntradaPerfil>) => perfilService.actualizar(entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.perfil });
      notificar(MENSAJES.guardado);
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useSubirLogo() {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (archivo: File) => perfilService.subirLogo(archivo),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.perfil });
      notificar('Logo actualizado.');
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}
