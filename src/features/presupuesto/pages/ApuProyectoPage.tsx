import { useParams } from 'react-router-dom';
import { useApuProyecto, usePresupuesto } from '@/features/presupuesto/hooks/usePresupuesto';
import { DetalleApu } from '@/features/catalogo/components/DetalleApu';
import { BotonesExporte } from '@/features/reportes/components/BotonesExporte';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { MENSAJES } from '@/common/constants/mensajes';
import { moneda, numero } from '@/common/lib/formato';

export default function ApuProyectoPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto } = useProyectoActual();
  const items = usePresupuesto(proyectoId);
  const apu = useApuProyecto(proyectoId);

  if (items.isLoading || apu.isLoading) return <Cargando />;
  if (items.error) return <ErrorCarga error={items.error} />;
  if (!items.data || items.data.length === 0) {
    return <EstadoVacio titulo={MENSAJES.sinActividades} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 no-imprimir">
        <p className="text-xs text-muted-foreground">
          Análisis de precios unitarios de las actividades incluidas en el presupuesto.
        </p>
        <BotonesExporte reporte="apu" proyecto={proyecto} />
      </div>

      {items.data.map((item) => (
        <Tarjeta
          key={item.id}
          titulo={`${item.codigo ?? item.orden} · ${item.descripcion}`}
          descripcion={`Unidad ${item.unidad} · Cantidad ${numero(item.cantidad)} · Vr unitario ${moneda(
            item.valor_unitario,
          )}`}
        >
          <DetalleApu
            items={item.actividad_id ? (apu.data?.[item.actividad_id] ?? []) : []}
            unidad={item.unidad}
            compacto
          />
        </Tarjeta>
      ))}
    </div>
  );
}
