/**
 * Espejo en JS de la funcion `normalizar` de Postgres: minusculas sin tildes.
 * Las columnas `busqueda` se guardan normalizadas, asi que el termino que
 * mandamos al ilike tiene que pasar por aqui.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Escapa los comodines de LIKE para que el usuario pueda buscar "%" o "_". */
export function terminoBusqueda(texto: string): string {
  return `%${normalizar(texto).replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

export function truncar(texto: string, largo = 80): string {
  return texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto;
}

export function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '?';
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Nombre de archivo seguro para Storage. */
export function nombreSeguro(nombre: string): string {
  return normalizar(nombre).replace(/[^a-z0-9.\-_]+/g, '-').replace(/-+/g, '-');
}
