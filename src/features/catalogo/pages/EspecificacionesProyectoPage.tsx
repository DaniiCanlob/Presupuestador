import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { usePresupuesto } from '@/features/presupuesto/hooks/usePresupuesto';
import { DetalleEspecificacion } from '@/features/catalogo/components/DetalleEspecificacion';
import { BotonesExporte } from '@/features/reportes/components/BotonesExporte';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { supabase } from '@/common/lib/supabase';
import { desempacar } from '@/common/lib/errores';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { Cargando, EstadoVacio } from '@/common/ui/Estados';
import { CLAVES } from '@/common/constants/consultas';
import { MENSAJES } from '@/common/constants/mensajes';
import type { EspecificacionRow } from '@/common/types/database.types';

export default function EspecificacionesProyectoPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto } = useProyectoActual();
  const items = usePresupuesto(proyectoId);

  const ids = (items.data ?? [])
    .map((i) => i.actividad_id)
    .filter((v): v is string => Boolean(v));

  const especificaciones = useQuery({
    queryKey: CLAVES.especificacionesProyecto(proyectoId),
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, EspecificacionRow>> => {
      const respuesta = await supabase.from('especificaciones').select('*').in('actividad_id', ids);
      const filas = desempacar(respuesta);
      return Object.fromEntries(filas.map((f) => [f.actividad_id, f]));
    },
  });

  if (items.isLoading) return <Cargando />;
  if (!items.data || items.data.length === 0) {
    return <EstadoVacio titulo={MENSAJES.sinActividades} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 no-imprimir">
        <p className="text-xs text-muted-foreground">
          Especificaciones técnicas de las actividades del presupuesto.
        </p>
        <BotonesExporte reporte="especificaciones" proyecto={proyecto} />
      </div>

      {items.data.map((item) => (
        <Tarjeta
          key={item.id}
          titulo={`${item.codigo ?? item.orden} · ${item.descripcion}`}
          descripcion={`Unidad ${item.unidad}`}
        >
          <DetalleEspecificacion
            especificacion={
              item.actividad_id ? (especificaciones.data?.[item.actividad_id] ?? null) : null
            }
          />
        </Tarjeta>
      ))}
    </div>
  );
}
