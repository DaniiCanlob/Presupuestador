import { Fragment, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { useResumenInsumos } from '@/features/insumos-proyecto/hooks/useResumenInsumos';
import { BotonesExporte } from '@/features/reportes/components/BotonesExporte';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { Tarjeta, Dato } from '@/common/ui/Tarjeta';
import { moneda, numero } from '@/common/lib/formato';
import { ETIQUETA_TIPO, ORDEN_TIPO } from '@/common/constants/catalogo';
import { totalPorTipo } from '@/common/lib/calculos';
import type { TipoInsumo } from '@/common/types/database.types';

export default function ResumenInsumosPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto } = useProyectoActual();
  const resumen = useResumenInsumos(proyectoId);

  const porTipo = useMemo(() => {
    const filas = resumen.data ?? [];
    const agrupado = new Map<TipoInsumo, typeof filas>();
    for (const fila of filas) {
      const lista = agrupado.get(fila.tipo) ?? [];
      lista.push(fila);
      agrupado.set(fila.tipo, lista);
    }
    return ORDEN_TIPO.filter((t) => agrupado.has(t)).map((tipo) => ({
      tipo,
      filas: agrupado.get(tipo) ?? [],
      subtotal: (agrupado.get(tipo) ?? []).reduce((s, f) => s + Number(f.valor_total), 0),
    }));
  }, [resumen.data]);

  const totales = totalPorTipo(resumen.data ?? []);
  const total = Object.values(totales).reduce((s, v) => s + v, 0);

  if (resumen.isLoading) return <Cargando />;
  if (resumen.error) return <ErrorCarga error={resumen.error} />;
  if (!resumen.data || resumen.data.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin insumos que resumir"
        descripcion="Agrega actividades con cantidad al presupuesto: el resumen explota el APU de cada una."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-imprimir">
        <p className="text-xs text-muted-foreground">
          Cantidades totales de obra, calculadas multiplicando el APU de cada actividad por su
          cantidad.
        </p>
        <BotonesExporte reporte="insumos" proyecto={proyecto} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ORDEN_TIPO.map((tipo) => (
          <Tarjeta key={tipo}>
            <Dato etiqueta={ETIQUETA_TIPO[tipo]} valor={moneda(totales[tipo])} destacado />
          </Tarjeta>
        ))}
      </div>

      <Tabla>
        <Encabezado>
          <tr>
            <Th>Descripción</Th>
            <Th>Unidad</Th>
            <Th numerico>Cantidad total</Th>
            <Th numerico>Precio unitario</Th>
            <Th numerico>Valor total</Th>
          </tr>
        </Encabezado>
        <Cuerpo>
          {porTipo.map((grupo) => (
            <Fragment key={grupo.tipo}>
              <tr className="bg-muted/60">
                <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {ETIQUETA_TIPO[grupo.tipo]}
                </td>
                <td className="px-3 py-1.5 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                  {moneda(grupo.subtotal)}
                </td>
              </tr>
              {grupo.filas.map((fila) => (
                <Fila key={`${grupo.tipo}-${fila.descripcion}`}>
                  <Td>{fila.descripcion}</Td>
                  <Td className="text-xs text-muted-foreground">{fila.unidad}</Td>
                  <Td numerico>{numero(fila.cantidad_total, 4)}</Td>
                  <Td numerico>{moneda(fila.precio_unitario)}</Td>
                  <Td numerico className="font-medium text-foreground">
                    {moneda(fila.valor_total)}
                  </Td>
                </Fila>
              ))}
            </Fragment>
          ))}
          <tr className="bg-muted">
            <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-foreground">
              Valor total de insumos
            </td>
            <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground">
              {moneda(total)}
            </td>
          </tr>
        </Cuerpo>
      </Tabla>
    </div>
  );
}
