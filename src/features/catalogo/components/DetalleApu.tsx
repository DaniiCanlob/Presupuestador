import { Fragment } from 'react';
import { agruparApu } from '@/common/lib/calculos';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { moneda, numero } from '@/common/lib/formato';
import type { ApuItemRow } from '@/common/types/database.types';

interface DetalleApuProps {
  items: ApuItemRow[];
  unidad?: string;
  compacto?: boolean;
}

/** Analisis de precios unitarios con el mismo desglose del Excel. */
export function DetalleApu({ items, unidad, compacto }: DetalleApuProps) {
  const grupos = agruparApu(items);
  const total = grupos.reduce((suma, g) => suma + g.subtotal, 0);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Esta actividad no tiene APU cargado.</p>;
  }

  return (
    <Tabla className={compacto ? 'text-xs' : undefined}>
      <Encabezado>
        <tr>
          <Th>Descripción</Th>
          <Th className="w-16">Unidad</Th>
          <Th numerico className="w-28">
            Cant / Rend
          </Th>
          <Th numerico className="w-32">
            Precio unitario
          </Th>
          <Th numerico className="w-32">
            Vr parcial
          </Th>
        </tr>
      </Encabezado>
      <Cuerpo>
        {grupos.map((grupo) => (
          <Fragment key={`${grupo.tipo}-${grupo.grupo}`}>
            <tr className="bg-muted/60">
              <td colSpan={5} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {grupo.grupo}
              </td>
            </tr>
            {grupo.items.map((item) => (
              <Fila key={item.id}>
                <Td>{item.descripcion}</Td>
                <Td className="text-xs text-muted-foreground">{item.unidad ?? '—'}</Td>
                <Td numerico>
                  {numero(item.cantidad, 4)}
                  {item.es_porcentaje ? ' %' : ''}
                </Td>
                <Td numerico>{moneda(item.precio_unitario)}</Td>
                <Td numerico>{moneda(item.valor_parcial)}</Td>
              </Fila>
            ))}
            <tr>
              <td colSpan={4} className="px-3 py-1 text-right text-xs text-muted-foreground">
                Subtotal
              </td>
              <td className="px-3 py-1 text-right text-xs font-medium tabular-nums text-foreground">
                {moneda(grupo.subtotal)}
              </td>
            </tr>
          </Fragment>
        ))}
        <tr className="bg-muted">
          <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-foreground">
            Valor costo directo{unidad ? ` por ${unidad}` : ''}
          </td>
          <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground">
            {moneda(total)}
          </td>
        </tr>
      </Cuerpo>
    </Tabla>
  );
}
