import { supabase } from '@/common/lib/supabase';
import { traducirError } from '@/common/lib/errores';
import { BUCKETS } from '@/common/constants/almacenamiento';
import { nombreSeguro } from '@/common/lib/texto';
import type { PerfilRow } from '@/common/types/database.types';
import type { EntradaPerfil } from '@/common/types/auth';

export const perfilService = {
  async obtener(): Promise<PerfilRow | null> {
    const { data, error } = await supabase.from('perfiles').select('*').maybeSingle();
    if (error) throw traducirError(error);
    return data;
  },

  async actualizar(entrada: Partial<EntradaPerfil>): Promise<PerfilRow> {
    const { data: usuario } = await supabase.auth.getUser();
    const id = usuario.user?.id;
    if (!id) throw traducirError('Sesión no válida.');

    const { data, error } = await supabase
      .from('perfiles')
      .upsert({ id, ...entrada })
      .select()
      .single();
    if (error) throw traducirError(error);
    return data;
  },

  async subirLogo(archivo: File): Promise<string> {
    const { data: usuario } = await supabase.auth.getUser();
    const id = usuario.user?.id;
    if (!id) throw traducirError('Sesión no válida.');

    const ruta = `${id}/${Date.now()}-${nombreSeguro(archivo.name)}`;
    const { error } = await supabase.storage
      .from(BUCKETS.logos)
      .upload(ruta, archivo, { upsert: true, contentType: archivo.type });
    if (error) throw traducirError(error);

    const { data } = supabase.storage.from(BUCKETS.logos).getPublicUrl(ruta);
    await perfilService.actualizar({ logo_url: data.publicUrl });
    return data.publicUrl;
  },
};
