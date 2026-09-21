import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Archive, Copy, Trash2, CalendarDays } from 'lucide-react';
import { useAccionesProyecto, useCrearProyecto, useProyectos } from '@/features/proyectos/hooks/useProyectos';
import { FormularioProyecto } from '@/features/proyectos/components/FormularioProyecto';
import { useListado } from '@/common/hooks/useListado';
import { Boton } from '@/common/ui/Boton';
import { Buscador } from '@/common/ui/Buscador';
import { Modal } from '@/common/ui/Modal';
import { Insignia } from '@/common/ui/Insignia';
import { Paginacion } from '@/common/ui/Paginacion';
import { Cargando, ErrorCarga, EstadoVacio } from '@/common/ui/Estados';
import { Selector } from '@/common/ui/campos';
import { ESTADOS_PROYECTO } from '@/common/constants/proyecto';
import { MENSAJES } from '@/common/constants/mensajes';
import { RUTAS } from '@/common/constants/rutas';
import { Titulo } from '@/common/ui/Titulo';
import { fecha } from '@/common/lib/formato';
import type { EstadoProyecto } from '@/common/types/database.types';
import type { FiltrosProyectos } from '@/common/types/proyecto';

export default function ProyectosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { busqueda, setBusqueda, pagina, setPagina, filtros, aplicarFiltros, parametros } =
    useListado<FiltrosProyectos>({ estado: null, archivado: false }, 12);

  const proyectos = useProyectos(parametros);
  const crear = useCrearProyecto();
  const { archivar, duplicar, eliminar } = useAccionesProyecto();

  return (
    <div className="space-y-4">
      <Titulo descripcion="Presupuestos de obra creados con tu cuenta.">Proyectos</Titulo>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Proyectos</h1>
          <p className="text-xs text-muted-foreground">Presupuestos de obra creados con tu cuenta.</p>
        </div>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModalAbierto(true)}>
          Nuevo proyecto
        </Boton>
      </header>

      <div className="flex flex-wrap gap-2">
        <Buscador
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar por nombre, contrato u objeto…"
          className="w-full sm:w-96"
        />
        <Selector
          className="w-48"
          vacio="Todos los estados"
          value={filtros.estado ?? ''}
          onChange={(e) =>
            aplicarFiltros({ estado: (e.target.value || null) as EstadoProyecto | null })
          }
          opciones={ESTADOS_PROYECTO.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta }))}
        />
        <Selector
          className="w-40"
          value={String(filtros.archivado ?? false)}
          onChange={(e) => aplicarFiltros({ archivado: e.target.value === 'true' })}
          opciones={[
            { valor: 'false', etiqueta: 'Activos' },
            { valor: 'true', etiqueta: 'Archivados' },
          ]}
        />
      </div>

      {proyectos.isLoading && <Cargando />}
      {proyectos.error && <ErrorCarga error={proyectos.error} />}

      {proyectos.data && proyectos.data.filas.length === 0 && (
        <EstadoVacio
          titulo={MENSAJES.sinProyectos}
          descripcion="Crea tu primer proyecto para empezar a armar el presupuesto."
          accion={<Boton onClick={() => setModalAbierto(true)}>Nuevo proyecto</Boton>}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {proyectos.data?.filas.map((p) => {
          const estado = ESTADOS_PROYECTO.find((e) => e.valor === p.estado);
          return (
            <article
              key={p.id}
              className="flex flex-col justify-between rounded-xl bg-card p-4 shadow-panel ring-1 ring-border transition hover:ring-primary/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={RUTAS.proyecto(p.id)}
                    className="text-sm font-semibold text-foreground hover:text-marca"
                  >
                    {p.nombre}
                  </Link>
                  {estado && <Insignia className={estado.color}>{estado.etiqueta}</Insignia>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {p.objeto ?? 'Sin objeto definido'}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/80">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {p.fecha_inicio ? fecha(p.fecha_inicio) : 'Sin fecha de inicio'}
                  {p.numero_contrato && ` · Contrato ${p.numero_contrato}`}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
                <Link
                  to={RUTAS.presupuesto(p.id)}
                  className="mr-auto text-xs font-medium text-marca hover:underline"
                >
                  Abrir presupuesto
                </Link>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  aria-label="Duplicar"
                  icono={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => duplicar.mutate({ id: p.id, nombre: `${p.nombre} (copia)` })}
                />
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  aria-label={p.archivado ? 'Desarchivar' : 'Archivar'}
                  icono={<Archive className="h-3.5 w-3.5" />}
                  onClick={() => archivar.mutate({ id: p.id, archivado: !p.archivado })}
                />
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  aria-label="Eliminar"
                  icono={<Trash2 className="h-3.5 w-3.5 text-destructive" />}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${p.nombre}" y todo su contenido?`)) {
                      eliminar.mutate(p.id);
                    }
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>

      {proyectos.data && (
        <Paginacion
          pagina={pagina}
          paginas={proyectos.data.paginas}
          total={proyectos.data.total}
          onCambiar={setPagina}
        />
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Nuevo proyecto"
        descripcion="Los datos del contrato encabezan todos los reportes."
        ancho="lg"
      >
        <FormularioProyecto
          guardando={crear.isPending}
          onCancelar={() => setModalAbierto(false)}
          onGuardar={(entrada) =>
            crear.mutate(entrada, { onSuccess: () => setModalAbierto(false) })
          }
        />
      </Modal>
    </div>
  );
}
