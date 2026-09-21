import { useRef } from 'react';
import { ImagePlus, Trash2, FileText } from 'lucide-react';
import { useAccionesDocumentos, useDocumentos } from '@/features/documentos/hooks/useDocumentos';
import { documentosService } from '@/features/documentos/services/documentos.service';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { Boton } from '@/common/ui/Boton';
import { pesoArchivo } from '@/common/lib/formato';

interface GaleriaItemProps {
  proyectoId: string;
  itemId: string;
}

/** Fotos y documentos de respaldo de una actividad (lo que en el Excel era el recuadro de foto). */
export function GaleriaItem({ proyectoId, itemId }: GaleriaItemProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const documentos = useDocumentos(proyectoId);
  const { subir, eliminar } = useAccionesDocumentos(proyectoId);

  const propios = (documentos.data ?? []).filter((d) => d.presupuesto_item_id === itemId);

  const abrir = async (ruta: string): Promise<void> => {
    const url = await documentosService.urlFirmada(ruta);
    window.open(url, '_blank', 'noopener');
  };

  return (
    <Tarjeta
      titulo="Registro fotográfico"
      descripcion="Fotos o PDF de respaldo de esta actividad."
      acciones={
        <>
          <input
            ref={entrada}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subir.mutate({ archivo, tipo: 'foto', itemId });
              e.target.value = '';
            }}
          />
          <Boton
            tamano="sm"
            variante="secundario"
            cargando={subir.isPending}
            icono={<ImagePlus className="h-4 w-4" />}
            onClick={() => entrada.current?.click()}
          >
            Subir
          </Boton>
        </>
      }
    >
      {propios.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavía no hay archivos para esta actividad.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {propios.map((documento) => (
            <li
              key={documento.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ring-border"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden />
              <button
                type="button"
                onClick={() => void abrir(documento.ruta)}
                className="flex-1 truncate text-left text-xs text-foreground hover:text-marca"
                title={documento.nombre}
              >
                {documento.nombre}
              </button>
              <span className="text-[10px] text-muted-foreground/80">{pesoArchivo(documento.tamano_bytes)}</span>
              <button
                type="button"
                onClick={() => eliminar.mutate(documento)}
                className="rounded p-1 text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar archivo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
