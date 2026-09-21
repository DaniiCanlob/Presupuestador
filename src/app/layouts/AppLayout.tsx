import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Boxes, FolderKanban, HardHat, LogOut, Menu, User, X } from 'lucide-react';
import { useSesion } from '@/features/auth/context/SesionProvider';
import { useSalir } from '@/features/auth/hooks/useAuth';
import { SelectorTema } from '@/common/ui/SelectorTema';
import { RUTAS } from '@/common/constants/rutas';
import { iniciales } from '@/common/lib/texto';
import { cn } from '@/common/lib/cn';

const ENLACES = [
  { a: RUTAS.proyectos, etiqueta: 'Proyectos', icono: FolderKanban },
  { a: RUTAS.catalogoActividades, etiqueta: 'Actividades', icono: HardHat },
  { a: RUTAS.catalogoInsumos, etiqueta: 'Insumos', icono: Boxes },
];

export function AppLayout() {
  const { perfil, usuario } = useSesion();
  const salir = useSalir();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const nombre = perfil?.nombre_completo ?? usuario?.email ?? '';

  return (
    <div className="min-h-dvh">
      <header className="vidrio-barra sticky top-0 z-40 border-b no-imprimir">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4">
          <Link to={RUTAS.proyectos} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <HardHat className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden font-heading text-sm font-semibold sm:block">
              Presupuestador <span className="text-marca">PRO</span>
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {ENLACES.map(({ a, etiqueta, icono: Icono }) => (
              <NavLink
                key={a}
                to={a}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/45 hover:text-foreground',
                  )
                }
              >
                <Icono className="h-4 w-4" aria-hidden />
                {etiqueta}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SelectorTema className="hidden sm:flex" />

            <Link
              to={RUTAS.perfil}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm transition-colors hover:bg-accent/45 sm:pr-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-heading text-xs font-semibold text-accent-foreground">
                {iniciales(nombre)}
              </span>
              <span className="hidden max-w-[150px] truncate text-muted-foreground lg:block">
                {nombre}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => salir.mutate()}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent/45 hover:text-foreground"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent/45 md:hidden"
              aria-label="Menú"
              aria-expanded={menuAbierto}
            >
              {menuAbierto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuAbierto && (
          <nav className="border-t px-4 py-2 md:hidden animate-in slide-in-from-top-2 duration-200">
            {[...ENLACES, { a: RUTAS.perfil, etiqueta: 'Mi perfil', icono: User }].map(
              ({ a, etiqueta, icono: Icono }) => (
                <NavLink
                  key={a}
                  to={a}
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-accent/45"
                >
                  <Icono className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {etiqueta}
                </NavLink>
              ),
            )}
            <div className="px-2 py-2">
              <SelectorTema />
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-7">
        <Outlet />
      </main>
    </div>
  );
}
