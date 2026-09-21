import type { Especificacion } from '@/common/types/catalogo';

const SECCIONES: { clave: keyof Especificacion; titulo: string }[] = [
  { clave: 'descripcion', titulo: 'Descripción de la actividad' },
  { clave: 'ejecucion', titulo: 'Ejecución' },
  { clave: 'materiales', titulo: 'Materiales' },
  { clave: 'herramientas_equipo', titulo: 'Herramientas y equipo' },
  { clave: 'personal', titulo: 'Personal' },
  { clave: 'ensayos', titulo: 'Ensayos a realizar' },
  { clave: 'tolerancia', titulo: 'Tolerancia para aceptación' },
  { clave: 'unidad_medida', titulo: 'Unidad de medida' },
  { clave: 'unidad_pago', titulo: 'Unidad de pago' },
];

export function DetalleEspecificacion({ especificacion }: { especificacion: Especificacion | null }) {
  if (!especificacion) {
    return <p className="text-xs text-muted-foreground">Esta actividad no tiene especificación técnica.</p>;
  }

  return (
    <div className="space-y-3">
      {SECCIONES.map(({ clave, titulo }) => {
        const contenido = especificacion[clave];
        if (!contenido || typeof contenido !== 'string') return null;
        return (
          <section key={clave}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {titulo}
            </h3>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">{contenido}</p>
          </section>
        );
      })}
    </div>
  );
}
