import type { Session, User } from '@supabase/supabase-js';
import type { PerfilRow } from '@/common/types/database.types';

export interface CredencialesIngreso {
  correo: string;
  clave: string;
}

export interface DatosRegistro extends CredencialesIngreso {
  nombre_completo: string;
  empresa?: string;
}

export interface EstadoSesion {
  usuario: User | null;
  sesion: Session | null;
  perfil: PerfilRow | null;
  cargando: boolean;
}

export interface EntradaPerfil {
  nombre_completo: string | null;
  empresa: string | null;
  nit: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  moneda: string;
  logo_url?: string | null;
}
