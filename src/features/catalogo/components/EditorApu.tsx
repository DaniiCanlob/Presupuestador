import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { SelectorInsumos } from '@/features/catalogo/components/SelectorInsumos';
import { Boton } from '@/common/ui/Boton';
import { Cuerpo, Encabezado, Fila, Tabla, Td, Th } from '@/common/ui/Tabla';
import { Selector } from '@/common/ui/campos';
import { moneda } from '@/common/lib/formato';
import { valorParcialApu, redondear } from '@/common/lib/calculos';
import { ETIQUETA_TIPO, TIPOS_INSUMO } from '@/common/constants/catalogo';
import type { EntradaApuItem } from '@/common/types/catalogo';
import type { ApuItemRow, TipoInsumo } from '@/common/types/database.types';

interface EditorApuProps {
  items: ApuItemRow[];
  guardando?: boolean;
  onGuardar: (items: EntradaApuItem[]) => void;
}

const filaVacia = (): EntradaApuItem => ({
  grupo: 'MATERIALES',
  tipo: 'material',
  insumo_id: null,
  descripcion: '',
  unidad: 'Un',
  cantidad: 0,
  precio_unitario: 0,
  es_porcentaje: false,
});

export function EditorApu({ items, guardando, onGuardar }: EditorApuProps) {
  const [filas, setFilas] = useState<EntradaApuItem[]>([]);
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  useEffect(() => {
    setFilas(
      items.map((i) => ({
        id: i.id,
        grupo: i.grupo,
        tipo: i.tipo,
        insumo_id: i.insumo_id,
        descripcion: i.descripcion,
        unidad: i.unidad,
        cantidad: Number(i.cantidad),
        precio_unitario: Number(i.precio_unitario),
        es_porcentaje: i.es_porcentaje,
      })),
    );
  }, [items]);

  const cambiar = (indice: number, cambios: Partial<EntradaApuItem>): void => {
    setFilas((previas) => previas.map((f, i) => (i === indice ? { ...f, ...cambios } : f)));
  };

  const total = filas.reduce((suma, f) => suma + valorParcialApu(f), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Boton
          tamano="sm"
          variante="secundario"
          icono={<Plus className="h-4 w-4" />}
          onClick={() => setSelectorAbierto(true)}
        >
          Insumo del catálogo
        </Boton>
        <Boton
          tamano="sm"
          variante="secundario"
          icono={<Plus className="h-4 w-4" />}
          onClick={() => setFilas((previas) => [...previas, filaVacia()])}
        >
          Fila en blanco
        </Boton>
        <Boton
          tamano="sm"
          className="ml-auto"
          icono={<Save className="h-4 w-4" />}
          cargando={guardando}
          onClick={() => onGuardar(filas.filter((f) => f.descripcion.trim() !== ''))}
        >
          Guardar APU
        </Boton>
      </div>

      <Tabla>
        <Encabezado>
          <tr>
            <Th className="w-40">Grupo</Th>
            <Th>Descripción</Th>
            <Th className="w-16">Und</Th>
            <Th numerico className="w-28">
              Cant / Rend
            </Th>
            <Th numerico className="w-32">
              Precio unitario
            </Th>
            <Th numerico className="w-32">
              Vr parcial
            </Th>
            <Th className="w-10" aria-label="Acciones" />
          </tr>
        </Encabezado>
        <Cuerpo>
          {filas.map((fila, indice) => (
            <Fila key={fila.id ?? `nueva-${indice}`}>
              <Td>
                <Selector
                  className="h-8 py-1 text-xs"
                  value={fila.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoInsumo;
                    cambiar(indice, { tipo, grupo: ETIQUETA_TIPO[tipo].toUpperCase() });
                  }}
                  opciones={TIPOS_INSUMO.map((t) => ({ valor: t.valor, etiqueta: t.plural }))}
                />
              </Td>
              <Td>
                <input
                  className="celda-editable"
                  value={fila.descripcion}
                  onChange={(e) => cambiar(indice, { descripcion: e.target.value })}
                />
              </Td>
              <Td>
                <input
                  className="celda-editable w-14"
                  value={fila.unidad ?? ''}
                  onChange={(e) => cambiar(indice, { unidad: e.target.value })}
                />
              </Td>
              <Td>
                <input
                  className="celda-editable text-right tabular-nums"
                  inputMode="decimal"
                  value={fila.cantidad}
                  onChange={(e) => cambiar(indice, { cantidad: Number(e.target.value) || 0 })}
                />
              </Td>
              <Td>
                <input
                  className="celda-editable text-right tabular-nums"
                  inputMode="decimal"
                  value={fila.precio_unitario}
                  onChange={(e) => cambiar(indice, { precio_unitario: Number(e.target.value) || 0 })}
                />
              </Td>
              <Td numerico>{moneda(valorParcialApu(fila))}</Td>
              <Td>
                <button
                  type="button"
                  onClick={() => setFilas((previas) => previas.filter((_, i) => i !== indice))}
                  className="rounded p-1 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Quitar insumo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Td>
            </Fila>
          ))}
          <tr className="bg-muted">
            <td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-foreground">
              Valor costo directo
            </td>
            <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground">
              {moneda(redondear(total))}
            </td>
            <td />
          </tr>
        </Cuerpo>
      </Tabla>

      <SelectorInsumos
        abierto={selectorAbierto}
        onCerrar={() => setSelectorAbierto(false)}
        onElegir={(insumos) => {
          setFilas((previas) => [
            ...previas,
            ...insumos.map((insumo) => ({
              grupo: ETIQUETA_TIPO[insumo.tipo].toUpperCase(),
              tipo: insumo.tipo,
              insumo_id: insumo.id,
              descripcion: insumo.descripcion,
              unidad: insumo.unidad,
              cantidad: 1,
              precio_unitario: Number(insumo.precio_unitario),
              es_porcentaje: false,
            })),
          ]);
          setSelectorAbierto(false);
        }}
      />
    </div>
  );
}
