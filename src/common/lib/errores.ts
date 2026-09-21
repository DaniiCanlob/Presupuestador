import type { PostgrestError } from '@supabase/supabase-js';
import { ERRORES_SUPABASE, MENSAJES } from '@/common/constants/mensajes';

export class ErrorApp extends Error {
  readonly codigo?: string;

  constructor(mensaje: string, codigo?: string) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.codigo = codigo;
  }
}

/** Traduce los errores de Supabase a algo que el usuario entienda. */
export function traducirError(error: unknown): ErrorApp {
  if (error instanceof ErrorApp) return error;

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const e = error as PostgrestError & { status?: number };
    const porCodigo = e.code ? ERRORES_SUPABASE[e.code] : undefined;
    const porMensaje = ERRORES_SUPABASE[e.message];
    return new ErrorApp(porCodigo ?? porMensaje ?? e.message ?? MENSAJES.errorGenerico, e.code);
  }

  if (typeof error === 'string') return new ErrorApp(error);
  return new ErrorApp(MENSAJES.errorGenerico);
}

/** Desempaqueta una respuesta de Supabase o lanza el error traducido. */
export function desempacar<T>(respuesta: { data: T | null; error: unknown }): T {
  if (respuesta.error) throw traducirError(respuesta.error);
  if (respuesta.data === null) throw new ErrorApp(MENSAJES.errorGenerico);
  return respuesta.data;
}
