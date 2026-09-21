import { useParams } from 'react-router-dom';
import { Copy, Trash2 } from 'lucide-react';
import { useProyectoActual } from '@/app/layouts/ProyectoLayout';
import { useAccionesProyecto, useActualizarProyecto } from '@/features/proyectos/hooks/useProyectos';
import { FormularioProyecto } from '@/features/proyectos/components/FormularioProyecto';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { Boton } from '@/common/ui/Boton';

export default function AjustesPage() {
  const { proyectoId = '' } = useParams();
  const { proyecto } = useProyectoActual();
  const actualizar = useActualizarProyecto(proyectoId);
  const { duplicar, eliminar } = useAccionesProyecto();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Tarjeta
        titulo="Datos del proyecto"
        descripcion="Encabezan el presupuesto, las memorias y todos los reportes."
      >
        <FormularioProyecto
          proyecto={proyecto}
          guardando={actualizar.isPending}
          onGuardar={(entrada) => actualizar.mutate(entrada)}
        />
      </Tarjeta>

      <Tarjeta titulo="Otras acciones">
        <div className="flex flex-wrap gap-2">
          <Boton
            variante="secundario"
            icono={<Copy className="h-4 w-4" />}
            cargando={duplicar.isPending}
            onClick={() => {
              const nombre = window.prompt('Nombre del nuevo proyecto:', `${proyecto.nombre} (copia)`);
              if (nombre) duplicar.mutate({ id: proyecto.id, nombre });
            }}
          >
            Duplicar proyecto
          </Boton>
          <Boton
            variante="peligro"
            icono={<Trash2 className="h-4 w-4" />}
            cargando={eliminar.isPending}
            onClick={() => {
              if (window.confirm(`¿Eliminar "${proyecto.nombre}" con su presupuesto y memorias?`)) {
                eliminar.mutate(proyecto.id);
              }
            }}
          >
            Eliminar proyecto
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}
