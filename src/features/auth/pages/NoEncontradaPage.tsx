import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useSesion } from '@/features/auth/context/SesionProvider';
import { Titulo } from '@/common/ui/Titulo';
import { Boton } from '@/common/ui/Boton';
import { RUTAS } from '@/common/constants/rutas';

/**
 * 404 propio. Antes cualquier ruta desconocida rebotaba en silencio a
 * /proyectos, así que un enlace mal copiado parecía un error de sesión.
 */
export default function NoEncontradaPage() {
  const { usuario } = useSesion();
  const { pathname } = useLocation();

  return (
    <>
      <Titulo>Página no encontrada</Titulo>

      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <Compass className="h-6 w-6 text-accent-foreground" aria-hidden />
        </span>

        <h1 className="mt-5 font-heading text-2xl font-semibold">Esta página no existe</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No encontramos nada en <code className="font-mono text-xs text-foreground">{pathname}</code>.
          Puede que el enlace esté mal copiado o que la página haya cambiado de sitio.
        </p>

        <div className="mt-6 flex gap-2">
          {usuario ? (
            <>
              <Link to={RUTAS.proyectos}>
                <Boton>Ir a mis proyectos</Boton>
              </Link>
              <Link to={RUTAS.catalogoActividades}>
                <Boton variante="secundario">Ver el catálogo</Boton>
              </Link>
            </>
          ) : (
            <Link to={RUTAS.ingresar}>
              <Boton>Ingresar</Boton>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
