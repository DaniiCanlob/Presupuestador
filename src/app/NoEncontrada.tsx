import { useSesion } from '@/features/auth/context/SesionProvider';
import { AppLayout } from '@/app/layouts/AppLayout';
import { Cargando } from '@/common/ui/Estados';
import NoEncontradaPage from '@/features/auth/pages/NoEncontradaPage';

/**
 * Ruta desconocida. No exige sesión (un enlace roto no es un problema de
 * permisos), pero si la hay muestra el 404 dentro del marco de la app para que
 * el usuario tenga a mano la navegación.
 */
export default function NoEncontrada() {
  const { usuario, cargando } = useSesion();

  if (cargando) return <Cargando className="h-dvh" />;

  return usuario ? (
    <AppLayout>
      <NoEncontradaPage />
    </AppLayout>
  ) : (
    <NoEncontradaPage />
  );
}
