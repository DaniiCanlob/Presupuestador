import { Tarjeta } from '@/common/ui/Tarjeta';
import { moneda, porcentaje } from '@/common/lib/formato';
import type { Proyecto } from '@/common/types/proyecto';
import type { TotalesProyecto } from '@/common/types/database.types';

interface ResumenTotalesProps {
  proyecto: Proyecto;
  totales: TotalesProyecto | undefined;
}

export function ResumenTotales({ proyecto, totales }: ResumenTotalesProps) {
  if (!totales) return null;

  const filas: { etiqueta: string; valor: number; detalle?: string }[] = [
    { etiqueta: 'Costo directo', valor: totales.costo_directo },
  ];

  if (proyecto.aplica_aiu) {
    filas.push(
      {
        etiqueta: 'Administración',
        valor: totales.administracion,
        detalle: porcentaje(proyecto.administracion_pct),
      },
      {
        etiqueta: 'Imprevistos',
        valor: totales.imprevistos,
        detalle: porcentaje(proyecto.imprevistos_pct),
      },
      { etiqueta: 'Utilidad', valor: totales.utilidad, detalle: porcentaje(proyecto.utilidad_pct) },
      {
        etiqueta: 'IVA sobre utilidad',
        valor: totales.iva_utilidad,
        detalle: porcentaje(proyecto.iva_utilidad_pct),
      },
    );
  }

  return (
    <Tarjeta titulo="Totales del presupuesto">
      <dl className="space-y-1.5">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">
              {f.etiqueta}
              {f.detalle && <span className="ml-1 text-xs text-muted-foreground/80">({f.detalle})</span>}
            </dt>
            <dd className="tabular-nums text-foreground">{moneda(f.valor)}</dd>
          </div>
        ))}

        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2 text-base font-semibold">
          <dt className="text-foreground">Total</dt>
          <dd className="tabular-nums text-foreground">{moneda(totales.total)}</dd>
        </div>

        {proyecto.anticipo_pct > 0 && (
          <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
            <dt>Anticipo ({porcentaje(proyecto.anticipo_pct)})</dt>
            <dd className="tabular-nums">{moneda(totales.anticipo)}</dd>
          </div>
        )}
      </dl>
    </Tarjeta>
  );
}
