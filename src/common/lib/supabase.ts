import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/common/types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
// Llave publicable (sb_publishable_...). Es publica por diseno: quien protege
// los datos es el RLS. Se acepta el nombre viejo por compatibilidad.
const llavePublica =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !llavePublica) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env y completa los valores.',
  );
}

export const supabase = createClient<Database>(url, llavePublica, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: { schema: 'public' },
});
