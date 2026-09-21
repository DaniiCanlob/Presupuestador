import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actasService, type EntradaActa } from '@/features/actas/services/actas.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';

export function useActas(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.actas(proyectoId ?? ''),
    queryFn: () => actasService.listar(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useItemsActa(actaId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.actaItems(actaId ?? ''),
    queryFn: () => actasService.items(actaId as string),
    enabled: Boolean(actaId),
  });
}

export function useAccionesActas(proyectoId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();
  const alFallar = (error: Error): void => notificar(error.message, 'error');

  const crear = useMutation({
    mutationFn: (entrada: Partial<EntradaActa>) => actasService.crear(proyectoId, entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.actas(proyectoId) });
      notificar('Acta creada.');
    },
    onError: alFallar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<EntradaActa> }) =>
      actasService.actualizar(id, cambios),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.actas(proyectoId) }),
    onError: alFallar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => actasService.eliminar(id),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.actas(proyectoId) });
      notificar(MENSAJES.eliminado);
    },
    onError: alFallar,
  });

  const registrar = useMutation({
    mutationFn: (datos: {
      actaId: string;
      presupuestoItemId: string;
      cantidad: number;
      valorUnitario: number;
    }) =>
      actasService.registrarEjecutado(
        datos.actaId,
        datos.presupuestoItemId,
        datos.cantidad,
        datos.valorUnitario,
      ),
    onSuccess: (_fila, variables) =>
      cliente.invalidateQueries({ queryKey: CLAVES.actaItems(variables.actaId) }),
    onError: alFallar,
  });

  return { crear, actualizar, eliminar, registrar };
}
