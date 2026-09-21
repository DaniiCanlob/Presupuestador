import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAccionesActas, useActas, useItemsActa } from '@/features/actas/hooks/useActas';
import { usePresupuesto } from '@/features/presupuesto/hooks/usePresupuesto';
import { Boton } from '@/common/ui/Boton';
import { Tarjeta, Dato } from '@/common/ui/Tarjeta';
import { Selector } from '@/common/ui/campos';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { Cargando, EstadoVacio } from '@/common/ui/Estados';
import { ESTADOS_ACTA } from '@/common/constants/proyecto';
import { fecha, moneda, numero, porcentaje } from '@/common/lib/formato';
import { cn } from '@/common/lib/cn';
import type { EstadoActa } from '@/common/types/database.types';

export default function ActasPage() {
  const { proyectoId = '' } = useParams();
  const actas = useActas(proyectoId);
  const acciones = useAccionesActas(proyectoId);
  const items = usePresupuesto(proyectoId);
  const [actaActiva, setActaActiva] = useState<string | null>(null);

  const actaId = actaActiva ?? actas.data?.[0]?.id ?? null;
  const itemsActa = useItemsActa(actaId ?? undefined);
  const acta = actas.data?.find((a) => a.id === actaId);

  const ejecutado = useMemo(
    () => new Map((itemsActa.data ?? []).map((i) => [i.presupuesto_item_id, i])),
    [itemsActa.data],
  );

  const totalActa = (itemsActa.data ?? []).reduce((suma, i) => suma + Number(i.valor), 0);
  const totalContrato = (items.data ?? []).reduce((suma, i) => suma + Number(i.valor_parcial), 0);

  if (actas.isLoading) return <Cargando />;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2 no-imprimir">
        <Boton
          className="w-full"
          icono={<Plus className="h-4 w-4" />}
          cargando={acciones.crear.isPending}
          onClick={() =>
            acciones.crear.mutate({
              tipo: 'parcial',
              estado: 'borrador',
              periodo_fin: new Date().toISOString().slice(0, 10),
            })
          }
        >
          Nueva acta
        </Boton>

        <ul className="divide-y divide-border rounded-xl bg-card ring-1 ring-border">
          {(actas.data ?? []).map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setActaActiva(a.id)}
                className={cn(
                  'w-full px-3 py-2 text-left transition',
                  a.id === actaId ? 'bg-accent' : 'hover:bg-muted/60',
                )}
              >
                <p className="text-sm font-medium text-foreground">Acta N° {a.numero}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fecha(a.periodo_fin)} ·{' '}
                  {ESTADOS_ACTA.find((e) => e.valor === a.estado)?.etiqueta ?? a.estado}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="space-y-3">
        {!acta ? (
          <EstadoVacio
            titulo="Sin actas"
            descripcion="Las actas registran la cantidad ejecutada de cada actividad en un periodo."
          />
        ) : (
          <>
            <Tarjeta
              titulo={`Acta N° ${acta.numero}`}
              acciones={
                <>
                  <Selector
                    className="h-8 w-36 py-1 text-xs"
                    value={acta.estado}
                    onChange={(e) =>
                      acciones.actualizar.mutate({
                        id: acta.id,
                        cambios: { estado: e.target.value as EstadoActa },
                      })
                    }
                    opciones={ESTADOS_ACTA.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta }))}
                  />
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    aria-label="Eliminar acta"
                    icono={<Trash2 className="h-4 w-4 text-destructive" />}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el acta N° ${acta.numero}?`)) {
                        acciones.eliminar.mutate(acta.id);
                        setActaActiva(null);
                      }
                    }}
                  />
                </>
              }
            >
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="text-xs text-muted-foreground">
                  Desde
                  <input
                    type="date"
                    className="celda-editable mt-0.5"
                    defaultValue={acta.periodo_inicio ?? ''}
                    onBlur={(e) =>
                      acciones.actualizar.mutate({
                        id: acta.id,
                        cambios: { periodo_inicio: e.target.value || null },
                      })
                    }
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Hasta
                  <input
                    type="date"
                    className="celda-editable mt-0.5"
                    defaultValue={acta.periodo_fin ?? ''}
                    onBlur={(e) =>
                      acciones.actualizar.mutate({
                        id: acta.id,
                        cambios: { periodo_fin: e.target.value || null },
                      })
                    }
                  />
                </label>
                <Dato etiqueta="Valor del acta" valor={moneda(totalActa)} destacado />
                <Dato
                  etiqueta="Avance del contrato"
                  valor={porcentaje(totalContrato > 0 ? (totalActa * 100) / totalContrato : 0)}
                  destacado
                />
              </div>
            </Tarjeta>

            <Tabla>
              <Encabezado>
                <tr>
                  <Th>Código</Th>
                  <Th>Actividad</Th>
                  <Th numerico>Contratada</Th>
                  <Th numerico>Ejecutada</Th>
                  <Th numerico>Vr unitario</Th>
                  <Th numerico>Valor</Th>
                </tr>
              </Encabezado>
              <Cuerpo>
                {(items.data ?? []).map((item) => {
                  const registro = ejecutado.get(item.id);
                  return (
                    <Fila key={item.id}>
                      <Td className="font-mono text-xs text-muted-foreground">{item.codigo}</Td>
                      <Td className="max-w-sm truncate" title={item.descripcion}>
                        {item.descripcion}
                      </Td>
                      <Td numerico>
                        {numero(item.cantidad)} {item.unidad}
                      </Td>
                      <Td numerico>
                        <input
                          className="celda-editable w-24 text-right tabular-nums"
                          inputMode="decimal"
                          defaultValue={registro?.cantidad_ejecutada ?? ''}
                          onBlur={(e) => {
                            const cantidad = Number(e.target.value) || 0;
                            if (cantidad === Number(registro?.cantidad_ejecutada ?? 0)) return;
                            acciones.registrar.mutate({
                              actaId: acta.id,
                              presupuestoItemId: item.id,
                              cantidad,
                              valorUnitario: Number(item.valor_unitario),
                            });
                          }}
                          aria-label={`Cantidad ejecutada de ${item.descripcion}`}
                        />
                      </Td>
                      <Td numerico>{moneda(item.valor_unitario)}</Td>
                      <Td numerico className="font-medium">
                        {moneda(registro?.valor ?? 0)}
                      </Td>
                    </Fila>
                  );
                })}
              </Cuerpo>
            </Tabla>
          </>
        )}
      </div>
    </div>
  );
}
