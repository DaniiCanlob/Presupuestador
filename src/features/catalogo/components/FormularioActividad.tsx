import { useForm } from 'react-hook-form';
import { Boton } from '@/common/ui/Boton';
import { Campo, Entrada, EntradaNumero, Selector } from '@/common/ui/campos';
import { UNIDADES } from '@/common/constants/catalogo';
import type { EntradaActividad } from '@/common/types/catalogo';
import type { CapituloRow } from '@/common/types/database.types';

interface FormularioActividadProps {
  capitulos: CapituloRow[];
  valores?: Partial<EntradaActividad>;
  guardando?: boolean;
  onGuardar: (entrada: EntradaActividad) => void;
  onCancelar?: () => void;
}

export function FormularioActividad({
  capitulos,
  valores,
  guardando,
  onGuardar,
  onCancelar,
}: FormularioActividadProps) {
  const { register, handleSubmit, formState } = useForm<EntradaActividad>({
    defaultValues: {
      codigo: valores?.codigo ?? '',
      descripcion: valores?.descripcion ?? '',
      unidad: valores?.unidad ?? 'Un',
      capitulo_id: valores?.capitulo_id ?? null,
      rendimiento_dia: valores?.rendimiento_dia ?? null,
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((datos) =>
        onGuardar({
          ...datos,
          capitulo_id: datos.capitulo_id || null,
          rendimiento_dia: datos.rendimiento_dia ? Number(datos.rendimiento_dia) : null,
        }),
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Código" requerido error={formState.errors.codigo?.message}>
          <Entrada placeholder="P-01" {...register('codigo', { required: 'Escribe un código' })} />
        </Campo>
        <Campo etiqueta="Unidad" requerido>
          <Selector
            opciones={UNIDADES.map((u) => ({ valor: u, etiqueta: u }))}
            {...register('unidad', { required: true })}
          />
        </Campo>
        <Campo etiqueta="Descripción" requerido className="sm:col-span-2">
          <Entrada {...register('descripcion', { required: 'Escribe la descripción' })} />
        </Campo>
        <Campo etiqueta="Capítulo">
          <Selector
            vacio="Sin capítulo"
            opciones={capitulos.map((c) => ({ valor: c.id, etiqueta: `${c.codigo}. ${c.nombre}` }))}
            {...register('capitulo_id')}
          />
        </Campo>
        <Campo etiqueta="Rendimiento (u/día)" ayuda="Opcional. Se usa en la programación.">
          <EntradaNumero step="0.0001" {...register('rendimiento_dia', { valueAsNumber: true })} />
        </Campo>
      </div>

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
