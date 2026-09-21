import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAccionesBitacora, useBitacora } from '@/features/bitacora/hooks/useBitacora';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { Boton } from '@/common/ui/Boton';
import { AreaTexto, Campo, Entrada, EntradaNumero, Selector } from '@/common/ui/campos';
import { Cargando, EstadoVacio } from '@/common/ui/Estados';
import { CLIMA_OPCIONES } from '@/common/constants/proyecto';
import { fecha } from '@/common/lib/formato';
import type { EntradaBitacora } from '@/features/bitacora/services/bitacora.service';

export default function BitacoraPage() {
  const { proyectoId = '' } = useParams();
  const apuntes = useBitacora(proyectoId);
  const { crear, eliminar } = useAccionesBitacora(proyectoId);

  const { register, handleSubmit, reset } = useForm<EntradaBitacora>({
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      clima: CLIMA_OPCIONES[0] ?? null,
      personal_obra: null,
      actividades: '',
      observaciones: '',
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Tarjeta titulo="Nuevo apunte" descripcion="Lo que pasó hoy en obra." className="no-imprimir">
        <form
          className="space-y-3"
          onSubmit={handleSubmit((datos) =>
            crear.mutate(
              {
                ...datos,
                personal_obra: datos.personal_obra ? Number(datos.personal_obra) : null,
              },
              { onSuccess: () => reset({ ...datos, actividades: '', observaciones: '' }) },
            ),
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Fecha" requerido>
              <Entrada type="date" {...register('fecha', { required: true })} />
            </Campo>
            <Campo etiqueta="Personal en obra">
              <EntradaNumero min={0} {...register('personal_obra', { valueAsNumber: true })} />
            </Campo>
          </div>

          <Campo etiqueta="Clima">
            <Selector
              opciones={CLIMA_OPCIONES.map((c) => ({ valor: c, etiqueta: c }))}
              {...register('clima')}
            />
          </Campo>

          <Campo etiqueta="Actividades ejecutadas">
            <AreaTexto rows={3} {...register('actividades')} />
          </Campo>

          <Campo etiqueta="Observaciones">
            <AreaTexto rows={2} {...register('observaciones')} />
          </Campo>

          <Boton type="submit" className="w-full" cargando={crear.isPending}>
            Guardar apunte
          </Boton>
        </form>
      </Tarjeta>

      <div className="space-y-3">
        {apuntes.isLoading && <Cargando />}
        {apuntes.data?.length === 0 && (
          <EstadoVacio
            titulo="Bitácora vacía"
            descripcion="Registra el día a día de la obra: personal, clima y avances."
          />
        )}

        {(apuntes.data ?? []).map((apunte) => (
          <article key={apunte.id} className="rounded-xl bg-card p-4 shadow-panel ring-1 ring-border">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{fecha(apunte.fecha)}</h2>
                <p className="text-xs text-muted-foreground">
                  {[apunte.clima, apunte.personal_obra ? `${apunte.personal_obra} personas` : null]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => eliminar.mutate(apunte.id)}
                className="rounded p-1 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar apunte"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </header>

            {apunte.actividades && (
              <p className="mt-2 whitespace-pre-line text-sm text-foreground">{apunte.actividades}</p>
            )}
            {apunte.observaciones && (
              <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{apunte.observaciones}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
