import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Boton } from '@/common/ui/Boton';
import { Campo, Entrada } from '@/common/ui/campos';
import { useRecuperarClave } from '@/features/auth/hooks/useAuth';
import { esquemaRecuperacion, type FormularioRecuperacion } from '@/features/auth/schemas';
import { RUTAS } from '@/common/constants/rutas';

export default function RecuperarPage() {
  const recuperar = useRecuperarClave();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormularioRecuperacion>({ resolver: zodResolver(esquemaRecuperacion) });

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-muted-foreground">Te enviamos un enlace para crear una nueva.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(({ correo }) => recuperar.mutate(correo))}
        noValidate
      >
        <Campo etiqueta="Correo" error={errors.correo?.message} requerido>
          <Entrada type="email" autoComplete="email" {...register('correo')} />
        </Campo>

        <Boton type="submit" className="w-full" cargando={recuperar.isPending} tamano="lg">
          Enviar enlace
        </Boton>
      </form>

      <p className="mt-4 text-sm">
        <Link to={RUTAS.ingresar} className="text-marca hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </>
  );
}
