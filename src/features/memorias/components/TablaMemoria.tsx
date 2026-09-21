import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Boton } from '@/common/ui/Boton';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { Cargando } from '@/common/ui/Estados';
import { useAccionesMemoria, useMemoria } from '@/features/memorias/hooks/useMemorias';
import { numero } from '@/common/lib/formato';
import type { EntradaMemoria } from '@/features/memorias/services/memorias.service';
import type { MemoriaItem, PresupuestoItem } from '@/common/types/proyecto';

interface TablaMemoriaProps {
  proyectoId: string;
  item: PresupuestoItem;
}

const CAMPOS: { clave: keyof EntradaMemoria; etiqueta: string }[] = [
  { clave: 'largo', etiqueta: 'Largo (m)' },
  { clave: 'ancho', etiqueta: 'Ancho (m)' },
  { clave: 'alto', etiqueta: 'Alto / Cant.' },
  { clave: 'veces', etiqueta: 'Veces' },
];

export function TablaMemoria({ proyectoId, item }: TablaMemoriaProps) {
  const memoria = useMemoria(item.id);
  const acciones = useAccionesMemoria(proyectoId, item.id);

  const total = (memoria.data ?? []).reduce((suma, fila) => suma + Number(fila.subtotal), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{item.descripcion}</h2>
          <p className="text-xs text-muted-foreground">
            {item.codigo ? `${item.codigo} · ` : ''}
            Unidad {item.unidad}
          </p>
        </div>
        <Boton
          tamano="sm"
          icono={<Plus className="h-4 w-4" />}
          cargando={acciones.agregar.isPending}
          onClick={() => acciones.agregar.mutate({ descripcion: null, veces: 1 })}
        >
          Agregar fila
        </Boton>
      </div>

      {memoria.isLoading ? (
        <Cargando />
      ) : (
        <Tabla>
          <Encabezado>
            <tr>
              <Th>Descripción parcial</Th>
              {CAMPOS.map((c) => (
                <Th key={c.clave} numerico className="w-28">
                  {c.etiqueta}
                </Th>
              ))}
              <Th numerico className="w-28">
                Subtotal
              </Th>
              <Th aria-label="Acciones" className="w-10" />
            </tr>
          </Encabezado>
          <Cuerpo>
            {(memoria.data ?? []).map((fila) => (
              <FilaMemoria
                key={fila.id}
                fila={fila}
                onCambiar={(cambios) => acciones.actualizar.mutate({ id: fila.id, cambios })}
                onEliminar={() => acciones.eliminar.mutate(fila.id)}
              />
            ))}
            <tr className="bg-muted/60">
              <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cantidad total para el presupuesto
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground">
                {numero(total, 4)}
              </td>
              <td />
            </tr>
          </Cuerpo>
        </Tabla>
      )}

      {!item.cantidad_desde_memoria && (
        <p className="text-xs text-alerta">
          Esta actividad tiene la cantidad escrita a mano en el presupuesto, así que la memoria no la
          sobrescribe. Vuelve a activarlo desde el presupuesto si quieres que la calcule.
        </p>
      )}
    </div>
  );
}

interface FilaMemoriaProps {
  fila: MemoriaItem;
  onCambiar: (cambios: Partial<EntradaMemoria>) => void;
  onEliminar: () => void;
}

function FilaMemoria({ fila, onCambiar, onEliminar }: FilaMemoriaProps) {
  const [valores, setValores] = useState({
    descripcion: fila.descripcion ?? '',
    largo: fila.largo?.toString() ?? '',
    ancho: fila.ancho?.toString() ?? '',
    alto: fila.alto?.toString() ?? '',
    veces: fila.veces?.toString() ?? '1',
  });

  useEffect(() => {
    setValores({
      descripcion: fila.descripcion ?? '',
      largo: fila.largo?.toString() ?? '',
      ancho: fila.ancho?.toString() ?? '',
      alto: fila.alto?.toString() ?? '',
      veces: fila.veces?.toString() ?? '1',
    });
  }, [fila]);

  const guardar = (clave: keyof typeof valores): void => {
    if (clave === 'descripcion') {
      if (valores.descripcion === (fila.descripcion ?? '')) return;
      onCambiar({ descripcion: valores.descripcion || null });
      return;
    }
    const texto = valores[clave];
    const valor = texto === '' ? null : Number(texto);
    if (valor !== null && !Number.isFinite(valor)) return;
    onCambiar({ [clave]: clave === 'veces' ? (valor ?? 1) : valor } as Partial<EntradaMemoria>);
  };

  return (
    <Fila>
      <Td>
        <input
          className="celda-editable"
          placeholder="Ej: muro eje A entre 1 y 3"
          value={valores.descripcion}
          onChange={(e) => setValores((v) => ({ ...v, descripcion: e.target.value }))}
          onBlur={() => guardar('descripcion')}
        />
      </Td>
      {CAMPOS.map((campo) => (
        <Td key={campo.clave}>
          <input
            className="celda-editable text-right tabular-nums"
            inputMode="decimal"
            value={valores[campo.clave as keyof typeof valores]}
            onChange={(e) => setValores((v) => ({ ...v, [campo.clave]: e.target.value }))}
            onBlur={() => guardar(campo.clave as keyof typeof valores)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-label={campo.etiqueta}
          />
        </Td>
      ))}
      <Td numerico className="font-medium">
        {numero(fila.subtotal, 4)}
      </Td>
      <Td>
        <button
          type="button"
          onClick={onEliminar}
          className="rounded p-1 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Eliminar fila"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </Td>
    </Fila>
  );
}
