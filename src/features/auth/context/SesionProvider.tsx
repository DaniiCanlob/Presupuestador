import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '@/features/auth/services/auth.service';
import { perfilService } from '@/features/perfil/services/perfil.service';
import type { PerfilRow } from '@/common/types/database.types';
import type { EstadoSesion } from '@/common/types/auth';

const Contexto = createContext<EstadoSesion & { refrescarPerfil: () => Promise<void> }>({
  usuario: null,
  sesion: null,
  perfil: null,
  cargando: true,
  refrescarPerfil: async () => {},
});

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilRow | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    authService
      .sesionActual()
      .then((s) => {
        if (activo) setSesion(s);
      })
      .catch(() => undefined)
      .finally(() => {
        if (activo) setCargando(false);
      });

    const desuscribir = authService.escucharCambios((s) => {
      setSesion(s);
      setCargando(false);
    });

    return () => {
      activo = false;
      desuscribir();
    };
  }, []);

  const usuario: User | null = sesion?.user ?? null;

  useEffect(() => {
    if (!usuario) {
      setPerfil(null);
      return;
    }
    perfilService
      .obtener()
      .then(setPerfil)
      .catch(() => setPerfil(null));
  }, [usuario]);

  const valor = useMemo(
    () => ({
      usuario,
      sesion,
      perfil,
      cargando,
      refrescarPerfil: async (): Promise<void> => {
        if (usuario) setPerfil(await perfilService.obtener());
      },
    }),
    [usuario, sesion, perfil, cargando],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useSesion = () => useContext(Contexto);
