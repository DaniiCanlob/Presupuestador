import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { SesionProvider } from '@/features/auth/context/SesionProvider';
import { RutaProtegida, RutaPublica } from '@/features/auth/components/RutaProtegida';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { AppLayout } from '@/app/layouts/AppLayout';
import { ProyectoLayout } from '@/app/layouts/ProyectoLayout';
import { Cargando } from '@/common/ui/Estados';
import { Telemetria } from '@/app/Telemetria';
import { RUTAS } from '@/common/constants/rutas';

/** Cada pagina se carga bajo demanda: el bundle inicial queda pequeño. */
const perezosa = (carga: () => Promise<{ default: ComponentType }>) => {
  const Componente = lazy(carga);
  return (
    <Suspense fallback={<Cargando />}>
      <Componente />
    </Suspense>
  );
};

function Raiz() {
  return (
    <SesionProvider>
      <Outlet />
      <Telemetria />
    </SesionProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      {
        element: <RutaPublica />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: RUTAS.ingresar, element: perezosa(() => import('@/features/auth/pages/IngresarPage')) },
              { path: RUTAS.registro, element: perezosa(() => import('@/features/auth/pages/RegistroPage')) },
              { path: RUTAS.recuperar, element: perezosa(() => import('@/features/auth/pages/RecuperarPage')) },
            ],
          },
        ],
      },
      {
        element: <RutaProtegida />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: RUTAS.raiz, element: <Navigate to={RUTAS.proyectos} replace /> },
              {
                path: RUTAS.nuevaClave,
                element: perezosa(() => import('@/features/auth/pages/NuevaClavePage')),
              },
              {
                path: RUTAS.proyectos,
                element: perezosa(() => import('@/features/proyectos/pages/ProyectosPage')),
              },
              { path: RUTAS.perfil, element: perezosa(() => import('@/features/perfil/pages/PerfilPage')) },
              {
                path: RUTAS.catalogoActividades,
                element: perezosa(() => import('@/features/catalogo/pages/ActividadesPage')),
              },
              {
                path: RUTAS.actividad(),
                element: perezosa(() => import('@/features/catalogo/pages/ActividadDetallePage')),
              },
              {
                path: RUTAS.catalogoInsumos,
                element: perezosa(() => import('@/features/catalogo/pages/InsumosPage')),
              },
              {
                path: RUTAS.proyecto(),
                element: <ProyectoLayout />,
                children: [
                  { index: true, element: perezosa(() => import('@/features/proyectos/pages/ResumenPage')) },
                  {
                    path: 'presupuesto',
                    element: perezosa(() => import('@/features/presupuesto/pages/PresupuestoPage')),
                  },
                  {
                    path: 'memorias',
                    element: perezosa(() => import('@/features/memorias/pages/MemoriasPage')),
                  },
                  {
                    path: 'programacion',
                    element: perezosa(() => import('@/features/programacion/pages/ProgramacionPage')),
                  },
                  {
                    path: 'insumos',
                    element: perezosa(() => import('@/features/insumos-proyecto/pages/ResumenInsumosPage')),
                  },
                  {
                    path: 'apu',
                    element: perezosa(() => import('@/features/presupuesto/pages/ApuProyectoPage')),
                  },
                  {
                    path: 'especificaciones',
                    element: perezosa(
                      () => import('@/features/catalogo/pages/EspecificacionesProyectoPage'),
                    ),
                  },
                  { path: 'actas', element: perezosa(() => import('@/features/actas/pages/ActasPage')) },
                  {
                    path: 'bitacora',
                    element: perezosa(() => import('@/features/bitacora/pages/BitacoraPage')),
                  },
                  {
                    path: 'ajustes',
                    element: perezosa(() => import('@/features/proyectos/pages/AjustesPage')),
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: perezosa(() => import('@/app/NoEncontrada')) },
    ],
  },
]);
