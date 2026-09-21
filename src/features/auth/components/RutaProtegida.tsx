import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '@/features/auth/context/SesionProvider';
import { Cargando } from '@/common/ui/Estados';
import { RUTAS } from '@/common/constants/rutas';

export function RutaProtegida() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) return <Cargando texto="Verificando sesión…" className="h-screen" />;
  if (!usuario) return <Navigate to={RUTAS.ingresar} replace state={{ desde: ubicacion.pathname }} />;
  return <Outlet />;
}

export function RutaPublica() {
  const { usuario, cargando } = useSesion();

  if (cargando) return <Cargando className="h-screen" />;
  if (usuario) return <Navigate to={RUTAS.proyectos} replace />;
  return <Outlet />;
}
