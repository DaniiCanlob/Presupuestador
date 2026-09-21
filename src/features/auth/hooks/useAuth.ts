import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/auth.service';
import { queryClient } from '@/common/lib/queryClient';
import { useNotificar } from '@/common/ui/Notificaciones';
import { MENSAJES } from '@/common/constants/mensajes';
import { RUTAS } from '@/common/constants/rutas';
import type { CredencialesIngreso, DatosRegistro } from '@/common/types/auth';

export function useIngresar() {
  const navegar = useNavigate();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (credenciales: CredencialesIngreso) => authService.ingresar(credenciales),
    onSuccess: () => navegar(RUTAS.proyectos, { replace: true }),
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useRegistrar() {
  const navegar = useNavigate();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (datos: DatosRegistro) => authService.registrar(datos),
    onSuccess: (conSesion) => {
      if (conSesion) {
        navegar(RUTAS.proyectos, { replace: true });
      } else {
        notificar(MENSAJES.revisaCorreo, 'info');
        navegar(RUTAS.ingresar, { replace: true });
      }
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useSalir() {
  const navegar = useNavigate();

  return useMutation({
    mutationFn: () => authService.salir(),
    onSuccess: () => {
      queryClient.clear();
      navegar(RUTAS.ingresar, { replace: true });
    },
  });
}

export function useRecuperarClave() {
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (correo: string) => authService.pedirRecuperacion(correo),
    onSuccess: () => notificar(MENSAJES.correoRecuperacion, 'info'),
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}

export function useCambiarClave() {
  const navegar = useNavigate();
  const notificar = useNotificar();

  return useMutation({
    mutationFn: (clave: string) => authService.cambiarClave(clave),
    onSuccess: () => {
      notificar(MENSAJES.claveActualizada);
      navegar(RUTAS.proyectos, { replace: true });
    },
    onError: (error: Error) => notificar(error.message, 'error'),
  });
}
