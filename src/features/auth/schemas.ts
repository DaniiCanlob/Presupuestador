import { z } from 'zod';

const correo = z.string().min(1, 'Escribe tu correo').email('Correo no válido');
const clave = z.string().min(8, 'Mínimo 8 caracteres');

export const esquemaIngreso = z.object({
  correo,
  clave: z.string().min(1, 'Escribe tu contraseña'),
});

export const esquemaRegistro = z
  .object({
    nombre_completo: z.string().min(3, 'Escribe tu nombre'),
    empresa: z.string().optional(),
    correo,
    clave,
    confirmacion: z.string(),
  })
  .refine((d) => d.clave === d.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

export const esquemaRecuperacion = z.object({ correo });

export const esquemaNuevaClave = z
  .object({ clave, confirmacion: z.string() })
  .refine((d) => d.clave === d.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

export type FormularioIngreso = z.infer<typeof esquemaIngreso>;
export type FormularioRegistro = z.infer<typeof esquemaRegistro>;
export type FormularioRecuperacion = z.infer<typeof esquemaRecuperacion>;
export type FormularioNuevaClave = z.infer<typeof esquemaNuevaClave>;
