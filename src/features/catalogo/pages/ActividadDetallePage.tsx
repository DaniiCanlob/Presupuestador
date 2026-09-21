import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import {
  useActividad,
  useApu,
  useClonarActividad,
  useEspecificacion,
  useGuardarApu,
} from '@/features/catalogo/hooks/useCatalogo';
import { DetalleApu } from '@/features/catalogo/components/DetalleApu';
import { DetalleEspecificacion } from '@/features/catalogo/components/DetalleEspecificacion';
import { EditorApu } from '@/features/catalogo/components/EditorApu';
import { Boton } from '@/common/ui/Boton';
import { Tarjeta, Dato } from '@/common/ui/Tarjeta';
import { Insignia } from '@/common/ui/Insignia';
import { Cargando, ErrorCarga } from '@/common/ui/Estados';
import { moneda, numero } from '@/common/lib/formato';
import { rendimientoSugerido } from '@/common/lib/calculos';
import { RUTAS } from '@/common/constants/rutas';

export default function ActividadDetallePage() {
  const { actividadId = '' } = useParams();
  const [editando, setEditando] = useState(false);

  const actividad = useActividad(actividadId);
  const apu = useApu(actividadId);
  const especificacion = useEspecificacion(actividadId);
  const guardarApu = useGuardarApu(actividadId);
  const clonar = useClonarActividad();

  if (actividad.isLoading) return <Cargando />;
  if (actividad.error || !actividad.data) return <ErrorCarga error={actividad.error} />;

  const a = actividad.data;
  const esPropia = Boolean(a.owner_id);
  const rendimiento = a.rendimiento_dia ?? rendimientoSugerido(apu.data ?? []);

  return (
    <div className="space-y-4">
      <div>
        <Link
          to={RUTAS.catalogoActividades}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Catálogo
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              <span className="mr-2 font-mono text-sm text-muted-foreground/80">{a.codigo}</span>
              {a.descripcion}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {a.capitulo_nombre ?? 'Sin capítulo'}
              {esPropia && <Insignia className="ml-2">Mi catálogo</Insignia>}
            </p>
          </div>
          <div className="flex gap-2">
            {esPropia ? (
              <Boton variante="secundario" onClick={() => setEditando((v) => !v)}>
                {editando ? 'Ver APU' : 'Editar APU'}
              </Boton>
            ) : (
              <Boton
                variante="secundario"
                icono={<Copy className="h-4 w-4" />}
                cargando={clonar.isPending}
                onClick={() => {
                  const codigo = window.prompt('Código para tu copia:', `${a.codigo}-COPIA`);
                  if (codigo) clonar.mutate({ id: a.id, codigo });
                }}
              >
                Copiar a mi catálogo
              </Boton>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tarjeta>
          <Dato etiqueta="Valor unitario" valor={moneda(a.valor_unitario)} destacado />
        </Tarjeta>
        <Tarjeta>
          <Dato etiqueta="Unidad" valor={a.unidad} />
        </Tarjeta>
        <Tarjeta>
          <Dato
            etiqueta="Rendimiento sugerido"
            valor={rendimiento ? `${numero(rendimiento, 3)} ${a.unidad}/día` : '—'}
          />
        </Tarjeta>
        <Tarjeta>
          <Dato etiqueta="Insumos en el APU" valor={numero(apu.data?.length ?? 0, 0)} />
        </Tarjeta>
      </div>

      <Tarjeta titulo="Análisis de precios unitarios">
        {apu.isLoading ? (
          <Cargando />
        ) : editando && esPropia ? (
          <EditorApu
            items={apu.data ?? []}
            guardando={guardarApu.isPending}
            onGuardar={(items) => guardarApu.mutate(items, { onSuccess: () => setEditando(false) })}
          />
        ) : (
          <DetalleApu items={apu.data ?? []} unidad={a.unidad} />
        )}
      </Tarjeta>

      <Tarjeta titulo="Especificación técnica">
        <DetalleEspecificacion especificacion={especificacion.data ?? null} />
      </Tarjeta>
    </div>
  );
}
