import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ruler, Trash2 } from 'lucide-react';
import { Td, Fila } from '@/common/ui/Tabla';
import { moneda, numero } from '@/common/lib/formato';
import { RUTAS } from '@/common/constants/rutas';
import type { PresupuestoItem } from '@/common/types/proyecto';

interface FilaPresupuestoProps {
  indice: number;
  item: PresupuestoItem;
  proyectoId: string;
  onCambiar: (cambios: Partial<PresupuestoItem>) => void;
  onEliminar: () => void;
}

export function FilaPresupuesto({
  indice,
  item,
  proyectoId,
  onCambiar,
  onEliminar,
}: FilaPresupuestoProps) {
  const [cantidad, setCantidad] = useState(String(item.cantidad));
  const [valorUnitario, setValorUnitario] = useState(String(item.valor_unitario));

  // La cantidad puede cambiar desde la memoria de cantidades.
  useEffect(() => setCantidad(String(item.cantidad)), [item.cantidad]);
  useEffect(() => setValorUnitario(String(item.valor_unitario)), [item.valor_unitario]);

  const guardarCantidad = (): void => {
    const valor = Number(cantidad);
    if (!Number.isFinite(valor) || valor === Number(item.cantidad)) return;
    onCambiar({ cantidad: valor, cantidad_desde_memoria: false });
  };

  const guardarValor = (): void => {
    const valor = Number(valorUnitario);
    if (!Number.isFinite(valor) || valor === Number(item.valor_unitario)) return;
    onCambiar({ valor_unitario: valor });
  };

  return (
    <Fila>
      <Td className="w-10 text-xs text-muted-foreground/80">{indice}</Td>
      <Td className="w-20 font-mono text-xs text-muted-foreground">{item.codigo ?? '—'}</Td>
      <Td>
        <p className="text-sm text-foreground">{item.descripcion}</p>
        {item.capitulo_nombre && (
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">{item.capitulo_nombre}</p>
        )}
      </Td>
      <Td className="w-16 text-xs text-muted-foreground">{item.unidad}</Td>
      <Td className="w-28">
        <input
          className="celda-editable text-right tabular-nums"
          value={cantidad}
          inputMode="decimal"
          onChange={(e) => setCantidad(e.target.value)}
          onBlur={guardarCantidad}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`Cantidad de ${item.descripcion}`}
        />
        {item.cantidad_desde_memoria && (
          <span className="mt-0.5 block text-right text-[10px] text-muted-foreground/80">desde memoria</span>
        )}
      </Td>
      <Td className="w-36">
        <input
          className="celda-editable text-right tabular-nums"
          value={valorUnitario}
          inputMode="decimal"
          onChange={(e) => setValorUnitario(e.target.value)}
          onBlur={guardarValor}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`Valor unitario de ${item.descripcion}`}
        />
        <span className="mt-0.5 block text-right text-[10px] text-muted-foreground/80">
          {moneda(item.valor_unitario)}
        </span>
      </Td>
      <Td numerico className="w-36 font-medium text-foreground">
        {moneda(item.valor_parcial)}
      </Td>
      <Td className="w-20">
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`${RUTAS.memorias(proyectoId)}?item=${item.id}`}
            className="rounded p-1 text-muted-foreground/80 hover:bg-muted hover:text-marca"
            title={`Memoria de cantidades (${numero(item.cantidad)} ${item.unidad})`}
          >
            <Ruler className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onEliminar}
            className="rounded p-1 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Quitar del presupuesto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </Td>
    </Fila>
  );
}
