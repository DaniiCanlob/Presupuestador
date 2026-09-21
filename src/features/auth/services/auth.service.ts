import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/common/lib/supabase';
import { traducirError } from '@/common/lib/errores';
import type { CredencialesIngreso, DatosRegistro } from '@/common/types/auth';
import { RUTAS } from '@/common/constants/rutas';

export const authService = {
  async sesionActual(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw traducirError(error);
    return data.session;
  },

  async ingresar({ correo, clave }: CredencialesIngreso): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error) throw traducirError(error);
    if (!data.session) throw traducirError('No se pudo iniciar sesión.');
    return data.session;
  },

  async registrar({ correo, clave, nombre_completo, empresa }: DatosRegistro): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: clave,
      options: {
        data: { nombre_completo, empresa: empresa ?? null },
        emailRedirectTo: `${window.location.origin}${RUTAS.proyectos}`,
      },
    });
    if (error) throw traducirError(error);
    // Sin sesion => el proyecto exige confirmar el correo.
    return Boolean(data.session);
  },

  async salir(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw traducirError(error);
  },

  async pedirRecuperacion(correo: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: `${window.location.origin}${RUTAS.nuevaClave}`,
    });
    if (error) throw traducirError(error);
  },

  async cambiarClave(clave: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) throw traducirError(error);
  },

  escucharCambios(callback: (sesion: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => callback(sesion));
    return () => data.subscription.unsubscribe();
  },
};
