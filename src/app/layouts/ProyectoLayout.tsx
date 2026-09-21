import { createContext, useContext } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProyecto, useTotales } from '@/features/proyectos/hooks/useProyectos';
import { Pestanas } from '@/common/ui/Pestanas';
import { Cargando, ErrorCarga } from '@/common/ui/Estados';
import { Insignia } from '@/common/ui/Insignia';
import { RUTAS } from '@/common/constants/rutas';
import { ESTADOS_PROYECTO } from '@/common/constants/proyecto';
import { moneda, fecha } from '@/common/lib/formato';
import type { Proyecto } from '@/common/types/proyecto';
import type { TotalesProyecto } from '@/common/types/database.types';

interface ContextoProyecto {
  proyecto: Proyecto;
  totales: TotalesProyecto | undefined;
}

const Contexto = createContext<ContextoProyecto | null>(null);

export function useProyectoActual(): ContextoProyecto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useProyectoActual requiere ProyectoLayout');
  return contexto;
}

export function ProyectoLayout() {
  const { proyectoId } = useParams();
  const proyecto = useProyecto(proyectoId);
  const totales = useTotales(proyectoId);

  if (proyecto.isLoading) return <Cargando texto="Cargando proyecto…" />;
  if (proyecto.error || !proyecto.data) return <ErrorCarga error={proyecto.error} />;

  const p = proyecto.data;
  const estado = ESTADOS_PROYECTO.find((e) => e.valor === p.estado);
  const id = p.id;

  const pestanas = [
    { a: RUTAS.proyecto(id), etiqueta: 'Resumen' },
    { a: RUTAS.presupuesto(id), etiqueta: 'Presupuesto' },
    { a: RUTAS.memorias(id), etiqueta: 'Memorias' },
    { a: RUTAS.programacion(id), etiqueta: 'Programación' },
    { a: RUTAS.insumos(id), etiqueta: 'Insumos' },
    { a: RUTAS.apu(id), etiqueta: 'APU' },
    { a: RUTAS.especificaciones(id), etiqueta: 'Especificaciones' },
    { a: RUTAS.actas(id), etiqueta: 'Actas' },
    { a: RUTAS.bitacora(id), etiqueta: 'Bitácora' },
    { a: RUTAS.ajustes(id), etiqueta: 'Ajustes' },
  ];

  return (
    <Contexto.Provider value={{ proyecto: p, totales: totales.data }}>
      <div className="space-y-5">
        <header className="no-imprimir">
          <Link
            to={RUTAS.proyectos}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Proyectos
          </Link>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl font-semibold">{p.nombre}</h1>
                {estado && <Insignia className={estado.color}>{estado.etiqueta}</Insignia>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.numero_contrato ? `Contrato ${p.numero_contrato} · ` : ''}
                {p.objeto ?? 'Sin objeto definido'}
                {p.fecha_inicio ? ` · Inicio ${fecha(p.fecha_inicio)}` : ''}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                Valor total
              </p>
              <p className="font-heading text-2xl font-semibold tabular-nums text-marca">
                {moneda(totales.data?.total ?? 0)}
              </p>
            </div>
          </div>
        </header>

        <div className="no-imprimir">
          <Pestanas pestanas={pestanas} />
        </div>

        <Outlet />
      </div>
    </Contexto.Provider>
  );
}
