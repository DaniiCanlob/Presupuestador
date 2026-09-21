import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentosService } from '@/features/documentos/services/documentos.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';
import type { Documento } from '@/common/types/proyecto';
import type { TipoDocumento } from '@/common/types/database.types';

export function useDocumentos(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.documentos(proyectoId ?? ''),
    queryFn: () => documentosService.listar(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useAccionesDocumentos(proyectoId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();
  const refrescar = (): void => {
    cliente.invalidateQueries({ queryKey: CLAVES.documentos(proyectoId) });
  };
  const alFallar = (error: Error): void => notificar(error.message, 'error');

  const subir = useMutation({
    mutationFn: (datos: { archivo: File; tipo?: TipoDocumento; itemId?: string | null }) =>
      documentosService.subir(proyectoId, datos.archivo, datos.tipo ?? 'otro', datos.itemId ?? null),
    onSuccess: () => {
      refrescar();
      notificar('Archivo subido.');
    },
    onError: alFallar,
  });

  const eliminar = useMutation({
    mutationFn: (documento: Documento) => documentosService.eliminar(documento),
    onSuccess: () => {
      refrescar();
      notificar(MENSAJES.eliminado);
    },
    onError: alFallar,
  });

  return { subir, eliminar };
}
