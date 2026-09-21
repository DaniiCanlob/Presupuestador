import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { EstadoVacio } from '@/common/ui/Estados';
import type { PuntoCurva } from '@/features/programacion/lib/curvaS';

/**
 * Los colores salen de los tokens --serie-a / --serie-b: cambian solos con el
 * tema y estan validados para daltonismo en claro y en oscuro (ΔE > 24).
 */
const COLORES = {
  programado: 'var(--serie-a)',
  ejecutado: 'var(--serie-b)',
} as const;

export function CurvaS({ datos }: { datos: PuntoCurva[] }) {
  if (datos.length === 0) {
    return (
      <Tarjeta titulo="Curva S">
        <EstadoVacio
          titulo="Sin programación"
          descripcion="Calcula la programación para ver el avance previsto contra el ejecutado."
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      titulo="Curva S"
      descripcion="Avance acumulado del contrato: previsto según la programación, ejecutado según las actas."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="2 5"
              vertical={false}
            />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={46}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v} %`}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              formatter={(valor, nombre) => [
                valor === null || valor === undefined ? '—' : `${String(valor)} %`,
                String(nombre),
              ]}
              labelFormatter={(etiqueta) => `Semana del ${String(etiqueta)}`}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                fontSize: 12,
                boxShadow: 'var(--sombra-panel)',
              }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: 4 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }}
            />
            <Line
              type="monotone"
              dataKey="programado"
              name="Programado"
              stroke={COLORES.programado}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            />
            <Line
              type="monotone"
              dataKey="ejecutado"
              name="Ejecutado"
              stroke={COLORES.ejecutado}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}
