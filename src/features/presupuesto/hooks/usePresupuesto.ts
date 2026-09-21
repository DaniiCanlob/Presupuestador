import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  presupuestoService,
  type EntradaItemManual,
} from '@/features/presupuesto/services/presupuesto.service';
import { CLAVES } from '@/common/constants/consultas';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';
import type { PresupuestoItem } from '@/common/types/proyecto';

export function usePresupuesto(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.presupuesto(proyectoId ?? ''),
    queryFn: () => presupuestoService.listar(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

export function useApuProyecto(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.apuProyecto(proyectoId ?? ''),
    queryFn: () => presupuestoService.apuDelProyecto(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}

/** Mutaciones del presupuesto; todas refrescan tabla y totales. */
export function useAccionesPresupuesto(proyectoId: string) {
  const cliente = useQueryClient();
  const notificar = useNotificar();

  const refrescar = (): void => {
    cliente.invalidateQueries({ queryKey: CLAVES.presupuesto(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.totales(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.resumenInsumos(proyectoId) });
    cliente.invalidateQueries({ queryKey: CLAVES.avance(proyectoId) });
  };

  const alFallar = (error: Error): void => notificar(error.message, 'error');

  const agregarDelCatalogo = useMutation({
    mutationFn: (actividades: string[]) =>
      presupuestoService.agregarDelCatalogo(proyectoId, actividades),
    onSuccess: (filas) => {
      refrescar();
      notificar(`${filas.length} actividad${filas.length === 1 ? '' : 'es'} agregada(s).`);
    },
    onError: alFallar,
  });

  const agregarManual = useMutation({
    mutationFn: (entrada: EntradaItemManual) => presupuestoService.agregarManual(proyectoId, entrada),
    onSuccess: () => {
      refrescar();
      notificar('Actividad agregada.');
    },
    onError: alFallar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<PresupuestoItem> }) =>
      presupuestoService.actualizar(id, cambios),
    onSuccess: refrescar,
    onError: alFallar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => presupuestoService.eliminar(id),
    onSuccess: () => {
      refrescar();
      notificar(MENSAJES.eliminado);
    },
    onError: alFallar,
  });

  const actualizarPrecios = useMutation({
    mutationFn: () => presupuestoService.actualizarPrecios(proyectoId),
    onSuccess: (filas) => {
      refrescar();
      notificar(
        filas > 0 ? `${filas} precio(s) actualizados con el catálogo.` : 'Los precios ya estaban al día.',
      );
    },
    onError: alFallar,
  });

  return { agregarDelCatalogo, agregarManual, actualizar, eliminar, actualizarPrecios };
}
