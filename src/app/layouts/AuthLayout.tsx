import { Outlet } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { SelectorTema } from '@/common/ui/SelectorTema';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh">
      <main className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[520px]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <HardHat className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-heading text-base font-semibold">
                Presupuestador <span className="text-marca">PRO</span>
              </span>
            </div>
            <SelectorTema />
          </div>

          <div className="vidrio rounded-2xl p-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Panel de apoyo: solo luz y una frase, sin ruido. */}
      <aside className="relative hidden flex-1 overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(40rem 30rem at 30% 20%, var(--aura-1), transparent 65%),' +
              'radial-gradient(35rem 28rem at 80% 80%, var(--aura-2), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-end p-14">
          <blockquote className="max-w-lg">
            <p className="font-heading text-3xl font-semibold leading-[1.2] tracking-tight">
              Presupuesto, APU, memorias y programación.
              <span className="block text-marca">En un solo lugar.</span>
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Catálogo con 2.288 actividades y 2.156 insumos listo para usar, y espacio para los
              tuyos.
            </p>
          </blockquote>
        </div>
      </aside>
    </div>
  );
}
