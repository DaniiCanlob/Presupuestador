export const BUCKETS = {
  documentos: 'documentos',
  logos: 'logos',
} as const;

export const LIMITE_DOCUMENTO_BYTES = 20 * 1024 * 1024;
export const LIMITE_LOGO_BYTES = 2 * 1024 * 1024;

export const MIMES_DOCUMENTO = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
export const MIMES_LOGO = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const SEGUNDOS_URL_FIRMADA = 60 * 10;
