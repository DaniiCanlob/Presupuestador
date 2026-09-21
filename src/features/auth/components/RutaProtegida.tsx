import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '@/features/auth/context/SesionProvider';
import { Cargando } from '@/common/ui/Estados';
import { RUTAS } from '@/common/constants/rutas';

/**
 * Deja pasar solo con sesión. Guarda la ruta pedida para volver a ella después
 * de ingresar: si alguien comparte el enlace de un presupuesto, el usuario
 * termina ahí y no en la lista de proyectos.
 */
export function RutaProtegida() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) return <Cargando texto="Verificando sesión…" className="h-dvh" />;

  if (!usuario) {
    const destino = `${ubicacion.pathname}${ubicacion.search}`;
    return <Navigate to={RUTAS.ingresar} replace state={{ desde: destino }} />;
  }

  return <Outlet />;
}

/** Login, registro y recuperación: con sesión abierta no tienen sentido. */
export function RutaPublica() {
  const { usuario, cargando } = useSesion();

  if (cargando) return <Cargando className="h-dvh" />;
  if (usuario) return <Navigate to={RUTAS.proyectos} replace />;
  return <Outlet />;
}
