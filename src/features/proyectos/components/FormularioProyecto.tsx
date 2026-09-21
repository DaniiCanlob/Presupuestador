import { useForm } from 'react-hook-form';
import { Boton } from '@/common/ui/Boton';
import { AreaTexto, Campo, Entrada, EntradaNumero, Selector } from '@/common/ui/campos';
import { AIU_SUGERIDO, DIAS_HABILES_OPCIONES, ESTADOS_PROYECTO, TIPOS_CONTRATO } from '@/common/constants/proyecto';
import type { EntradaProyecto, Proyecto } from '@/common/types/proyecto';

interface FormularioProyectoProps {
  proyecto?: Proyecto;
  guardando?: boolean;
  onGuardar: (entrada: Partial<EntradaProyecto>) => void;
  onCancelar?: () => void;
}

const valoresPorDefecto = (proyecto?: Proyecto): Partial<EntradaProyecto> => ({
  nombre: proyecto?.nombre ?? '',
  numero_contrato: proyecto?.numero_contrato ?? '',
  tipo_contrato: proyecto?.tipo_contrato ?? 'obra',
  objeto: proyecto?.objeto ?? '',
  contratista: proyecto?.contratista ?? '',
  interventoria: proyecto?.interventoria ?? '',
  supervision: proyecto?.supervision ?? '',
  entidad_contratante: proyecto?.entidad_contratante ?? '',
  municipio: proyecto?.municipio ?? '',
  departamento: proyecto?.departamento ?? '',
  ubicacion: proyecto?.ubicacion ?? '',
  fecha_inicio: proyecto?.fecha_inicio ?? '',
  plazo_dias: proyecto?.plazo_dias ?? null,
  estado: proyecto?.estado ?? 'borrador',
  aplica_aiu: proyecto?.aplica_aiu ?? false,
  administracion_pct: proyecto?.administracion_pct ?? AIU_SUGERIDO.administracion,
  imprevistos_pct: proyecto?.imprevistos_pct ?? AIU_SUGERIDO.imprevistos,
  utilidad_pct: proyecto?.utilidad_pct ?? AIU_SUGERIDO.utilidad,
  iva_utilidad_pct: proyecto?.iva_utilidad_pct ?? AIU_SUGERIDO.ivaUtilidad,
  anticipo_pct: proyecto?.anticipo_pct ?? 0,
  jornada_horas: proyecto?.jornada_horas ?? 8,
  dias_habiles_semana: proyecto?.dias_habiles_semana ?? 6,
  observaciones: proyecto?.observaciones ?? '',
});

/** Convierte los campos vacios a null para no ensuciar la base con cadenas "". */
const limpiar = (valores: Partial<EntradaProyecto>): Partial<EntradaProyecto> => {
  const salida: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(valores)) {
    salida[clave] = valor === '' ? null : valor;
  }
  return salida as Partial<EntradaProyecto>;
};

export function FormularioProyecto({
  proyecto,
  guardando,
  onGuardar,
  onCancelar,
}: FormularioProyectoProps) {
  const { register, handleSubmit, watch, formState } = useForm<Partial<EntradaProyecto>>({
    defaultValues: valoresPorDefecto(proyecto),
  });
  const aplicaAiu = watch('aplica_aiu');

  return (
    <form className="space-y-5" onSubmit={handleSubmit((valores) => onGuardar(limpiar(valores)))}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombre del proyecto" requerido className="sm:col-span-2">
          <Entrada
            placeholder="Construcción de vivienda unifamiliar"
            {...register('nombre', { required: true })}
          />
        </Campo>

        <Campo etiqueta="N° de contrato">
          <Entrada {...register('numero_contrato')} />
        </Campo>

        <Campo etiqueta="Tipo de contrato">
          <Selector
            opciones={TIPOS_CONTRATO.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))}
            {...register('tipo_contrato')}
          />
        </Campo>

        <Campo etiqueta="Objeto del contrato" className="sm:col-span-2">
          <AreaTexto rows={2} {...register('objeto')} />
        </Campo>

        <Campo etiqueta="Contratista">
          <Entrada {...register('contratista')} />
        </Campo>
        <Campo etiqueta="Entidad contratante">
          <Entrada {...register('entidad_contratante')} />
        </Campo>
        <Campo etiqueta="Interventoría">
          <Entrada {...register('interventoria')} />
        </Campo>
        <Campo etiqueta="Supervisión">
          <Entrada {...register('supervision')} />
        </Campo>

        <Campo etiqueta="Municipio">
          <Entrada {...register('municipio')} />
        </Campo>
        <Campo etiqueta="Departamento">
          <Entrada {...register('departamento')} />
        </Campo>
        <Campo etiqueta="Dirección / sitio de obra" className="sm:col-span-2">
          <Entrada {...register('ubicacion')} />
        </Campo>

        <Campo etiqueta="Fecha de inicio">
          <Entrada type="date" {...register('fecha_inicio')} />
        </Campo>
        <Campo
          etiqueta="Plazo (días calendario)"
          ayuda="El fin del contrato se calcula solo: inicio + plazo."
        >
          <EntradaNumero min={0} {...register('plazo_dias', { valueAsNumber: true })} />
        </Campo>

        <Campo etiqueta="Estado">
          <Selector
            opciones={ESTADOS_PROYECTO.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta }))}
            {...register('estado')}
          />
        </Campo>
        <Campo etiqueta="Días laborables por semana" ayuda="Se usa para calcular la programación.">
          <Selector
            opciones={DIAS_HABILES_OPCIONES.map((d) => ({ valor: d.valor, etiqueta: d.etiqueta }))}
            {...register('dias_habiles_semana', { valueAsNumber: true })}
          />
        </Campo>
      </div>

      <fieldset className="rounded-lg bg-muted/60 p-3 ring-1 ring-border">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('aplica_aiu')} />
          Aplicar AIU (Administración, Imprevistos y Utilidad)
        </label>

        {aplicaAiu && (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <Campo etiqueta="Administración %">
              <EntradaNumero step="0.01" {...register('administracion_pct', { valueAsNumber: true })} />
            </Campo>
            <Campo etiqueta="Imprevistos %">
              <EntradaNumero step="0.01" {...register('imprevistos_pct', { valueAsNumber: true })} />
            </Campo>
            <Campo etiqueta="Utilidad %">
              <EntradaNumero step="0.01" {...register('utilidad_pct', { valueAsNumber: true })} />
            </Campo>
            <Campo etiqueta="IVA sobre utilidad %">
              <EntradaNumero step="0.01" {...register('iva_utilidad_pct', { valueAsNumber: true })} />
            </Campo>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Anticipo %" ayuda="Sobre el valor total del contrato.">
            <EntradaNumero step="0.01" {...register('anticipo_pct', { valueAsNumber: true })} />
          </Campo>
          <Campo etiqueta="Jornada (horas/día)">
            <EntradaNumero step="0.5" {...register('jornada_horas', { valueAsNumber: true })} />
          </Campo>
        </div>
      </fieldset>

      <Campo etiqueta="Observaciones">
        <AreaTexto {...register('observaciones')} />
      </Campo>

      <div className="flex justify-end gap-2">
        {onCancelar && (
          <Boton type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" cargando={guardando} disabled={!formState.isDirty && Boolean(proyecto)}>
          {proyecto ? 'Guardar cambios' : 'Crear proyecto'}
        </Boton>
      </div>
    </form>
  );
}
