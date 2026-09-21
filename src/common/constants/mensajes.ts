export const MENSAJES = {
  errorGenerico: 'Algo salió mal. Intenta de nuevo.',
  sinConexion: 'No hay conexión con el servidor.',
  guardado: 'Cambios guardados.',
  eliminado: 'Registro eliminado.',
  sesionCerrada: 'Sesión cerrada.',
  credencialesInvalidas: 'Correo o contraseña incorrectos.',
  correoEnUso: 'Ya existe una cuenta con ese correo.',
  revisaCorreo: 'Te enviamos un correo para confirmar la cuenta.',
  correoRecuperacion: 'Si el correo existe, te enviamos el enlace para cambiar la contraseña.',
  claveActualizada: 'Contraseña actualizada.',
  sinResultados: 'No encontramos resultados.',
  sinProyectos: 'Aún no tienes proyectos.',
  sinActividades: 'El presupuesto está vacío.',
  confirmarBorrado: '¿Seguro que quieres eliminar este registro?',
} as const;

export const ERRORES_SUPABASE: Record<string, string> = {
  'Invalid login credentials': MENSAJES.credencialesInvalidas,
  'User already registered': MENSAJES.correoEnUso,
  'Email not confirmed': 'Debes confirmar tu correo antes de ingresar.',
  '23505': 'Ya existe un registro con esos datos.',
  '23503': 'No se puede eliminar: hay información asociada.',
  '42501': 'No tienes permisos sobre este registro.',
};
