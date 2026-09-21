import { supabase } from '@/common/lib/supabase';
import { desempacar, traducirError, ErrorApp } from '@/common/lib/errores';
import { nombreSeguro } from '@/common/lib/texto';
import {
  BUCKETS,
  LIMITE_DOCUMENTO_BYTES,
  MIMES_DOCUMENTO,
  SEGUNDOS_URL_FIRMADA,
} from '@/common/constants/almacenamiento';
import type { Documento } from '@/common/types/proyecto';
import type { TipoDocumento } from '@/common/types/database.types';

export const documentosService = {
  async listar(proyectoId: string): Promise<Documento[]> {
    const respuesta = await supabase
      .from('documentos')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false });
    return desempacar(respuesta);
  },

  async subir(
    proyectoId: string,
    archivo: File,
    tipo: TipoDocumento = 'otro',
    presupuestoItemId: string | null = null,
  ): Promise<Documento> {
    if (archivo.size > LIMITE_DOCUMENTO_BYTES) {
      throw new ErrorApp('El archivo supera los 20 MB permitidos.');
    }
    if (!MIMES_DOCUMENTO.includes(archivo.type)) {
      throw new ErrorApp('Solo se permiten imágenes (PNG, JPG, WEBP) y PDF.');
    }

    const { data: usuario } = await supabase.auth.getUser();
    const uid = usuario.user?.id;
    if (!uid) throw new ErrorApp('Sesión no válida.');

    const ruta = `${uid}/${proyectoId}/${Date.now()}-${nombreSeguro(archivo.name)}`;
    const { error } = await supabase.storage
      .from(BUCKETS.documentos)
      .upload(ruta, archivo, { contentType: archivo.type });
    if (error) throw traducirError(error);

    const respuesta = await supabase
      .from('documentos')
      .insert({
        proyecto_id: proyectoId,
        presupuesto_item_id: presupuestoItemId,
        nombre: archivo.name,
        tipo,
        ruta,
        mime: archivo.type,
        tamano_bytes: archivo.size,
      })
      .select()
      .single();
    return desempacar(respuesta);
  },

  async urlFirmada(ruta: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKETS.documentos)
      .createSignedUrl(ruta, SEGUNDOS_URL_FIRMADA);
    if (error) throw traducirError(error);
    return data.signedUrl;
  },

  async eliminar(documento: Documento): Promise<void> {
    await supabase.storage.from(BUCKETS.documentos).remove([documento.ruta]);
    const { error } = await supabase.from('documentos').delete().eq('id', documento.id);
    if (error) throw traducirError(error);
  },
};
