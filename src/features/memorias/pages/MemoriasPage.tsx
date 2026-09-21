import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePresupuesto } from '@/features/presupuesto/hooks/usePresupuesto';
import { TablaMemoria } from '@/features/memorias/components/TablaMemoria';
import { GaleriaItem } from '@/features/documentos/components/GaleriaItem';
import { BotonesExporte } from '@/features/reportes/components/BotonesExporte';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { numero } from '@/common/lib/formato';
import { cn } from '@/common/lib/cn';
import { MENSAJES } from '@/common/constants/mensajes';

export default function MemoriasPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto } = useProyectoActual();
  const [parametros, setParametros] = useSearchParams();
  const items = usePresupuesto(proyectoId);
  const [itemActivo, setItemActivo] = useState<string | null>(parametros.get('item'));

  useEffect(() => {
    if (!itemActivo && items.data && items.data.length > 0) {
      setItemActivo(items.data[0]?.id ?? null);
    }
  }, [items.data, itemActivo]);

  const seleccionado = items.data?.find((i) => i.id === itemActivo);

  const elegir = (id: string): void => {
    setItemActivo(id);
    setParametros({ item: id }, { replace: true });
  };

  if (items.isLoading) return <Cargando />;
  if (items.error) return <ErrorCarga error={items.error} />;
  if (!items.data || items.data.length === 0) {
    return (
      <EstadoVacio
        titulo={MENSAJES.sinActividades}
        descripcion="Las memorias de cantidades se llenan sobre las actividades del presupuesto."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="no-imprimir">
        <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-card ring-1 ring-border">
          <ul className="divide-y divide-border">
            {items.data.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => elegir(item.id)}
                  className={cn(
                    'w-full px-3 py-2 text-left transition',
                    item.id === itemActivo ? 'bg-accent' : 'hover:bg-muted/60',
                  )}
                >
                  <p className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[11px] text-muted-foreground/80">{item.codigo ?? item.orden}</span>
                    <span className="line-clamp-2 text-xs text-foreground">{item.descripcion}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {numero(item.cantidad)} {item.unidad}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="space-y-4">
        <div className="flex justify-end no-imprimir">
          <BotonesExporte reporte="memorias" proyecto={proyecto} />
        </div>

        {seleccionado ? (
          <>
            <Tarjeta>
              <TablaMemoria proyectoId={proyectoId} item={seleccionado} />
            </Tarjeta>
            <GaleriaItem proyectoId={proyectoId} itemId={seleccionado.id} />
          </>
        ) : (
          <EstadoVacio titulo="Elige una actividad" />
        )}
      </div>
    </div>
  );
}
