import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boton } from '@/common/ui/Boton';
import { Campo, Entrada } from '@/common/ui/campos';
import { Titulo } from '@/common/ui/Titulo';
import { useCambiarClave } from '@/features/auth/hooks/useAuth';
import { esquemaNuevaClave, type FormularioNuevaClave } from '@/features/auth/schemas';

export default function NuevaClavePage() {
  const cambiar = useCambiarClave();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormularioNuevaClave>({ resolver: zodResolver(esquemaNuevaClave) });

  return (
    <>
      <Titulo>Nueva contraseña</Titulo>

      <h1 className="text-xl font-semibold text-foreground">Nueva contraseña</h1>
      <p className="mt-1 text-sm text-muted-foreground">Escribe la contraseña con la que vas a entrar.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(({ clave }) => cambiar.mutate(clave))}
        noValidate
      >
        <Campo etiqueta="Contraseña" error={errors.clave?.message} requerido>
          <Entrada type="password" autoComplete="new-password" {...register('clave')} />
        </Campo>

        <Campo etiqueta="Repite la contraseña" error={errors.confirmacion?.message} requerido>
          <Entrada type="password" autoComplete="new-password" {...register('confirmacion')} />
        </Campo>

        <Boton type="submit" className="w-full" cargando={cambiar.isPending} tamano="lg">
          Guardar contraseña
        </Boton>
      </form>
    </>
  );
}
