import { useForm } from 'react-hook-form';
import { Boton } from '@/common/ui/Boton';
import { AreaTexto, Campo, Entrada, EntradaNumero, Selector } from '@/common/ui/campos';
import { TIPOS_INSUMO, UNIDADES } from '@/common/constants/catalogo';
import type { EntradaInsumo } from '@/common/types/catalogo';

interface FormularioInsumoProps {
  valores?: Partial<EntradaInsumo>;
  guardando?: boolean;
  onGuardar: (entrada: EntradaInsumo) => void;
  onCancelar?: () => void;
}

export function FormularioInsumo({
  valores,
  guardando,
  onGuardar,
  onCancelar,
}: FormularioInsumoProps) {
  const { register, handleSubmit, formState } = useForm<EntradaInsumo>({
    defaultValues: {
      descripcion: valores?.descripcion ?? '',
      unidad: valores?.unidad ?? 'Un',
      tipo: valores?.tipo ?? 'material',
      precio_unitario: valores?.precio_unitario ?? 0,
      proveedor: valores?.proveedor ?? null,
      marca: valores?.marca ?? null,
      notas: valores?.notas ?? null,
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onGuardar)}>
      <Campo etiqueta="Descripción" requerido error={formState.errors.descripcion?.message}>
        <Entrada {...register('descripcion', { required: 'Escribe la descripción' })} />
      </Campo>

      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Tipo" requerido>
          <Selector
            opciones={TIPOS_INSUMO.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))}
            {...register('tipo')}
          />
        </Campo>
        <Campo etiqueta="Unidad" requerido>
          <Selector opciones={UNIDADES.map((u) => ({ valor: u, etiqueta: u }))} {...register('unidad')} />
        </Campo>
        <Campo etiqueta="Precio unitario" requerido>
          <EntradaNumero step="0.01" {...register('precio_unitario', { valueAsNumber: true })} />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Proveedor">
          <Entrada {...register('proveedor')} />
        </Campo>
        <Campo etiqueta="Marca">
          <Entrada {...register('marca')} />
        </Campo>
      </div>

      <Campo etiqueta="Notas">
        <AreaTexto rows={2} {...register('notas')} />
      </Campo>

      <div className="flex justify-end gap-2">
        {onCancelar && (
          <Boton type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" cargando={guardando}>
          Guardar
        </Boton>
      </div>
    </form>
  );
}
