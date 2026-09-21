import { useQuery } from '@tanstack/react-query';
import { insumosProyectoService } from '@/features/insumos-proyecto/services/insumosProyecto.service';
import { CLAVES } from '@/common/constants/consultas';

export function useResumenInsumos(proyectoId: string | undefined) {
  return useQuery({
    queryKey: CLAVES.resumenInsumos(proyectoId ?? ''),
    queryFn: () => insumosProyectoService.resumen(proyectoId as string),
    enabled: Boolean(proyectoId),
  });
}
