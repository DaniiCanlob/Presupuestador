import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Boton } from '@/common/ui/Boton';
import { Campo, Entrada } from '@/common/ui/campos';
import { useRegistrar } from '@/features/auth/hooks/useAuth';
import { esquemaRegistro, type FormularioRegistro } from '@/features/auth/schemas';
import { RUTAS } from '@/common/constants/rutas';

export default function RegistroPage() {
  const registrar = useRegistrar();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormularioRegistro>({ resolver: zodResolver(esquemaRegistro) });

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Crear cuenta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tus proyectos son privados: solo tú los ves y los editas.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(({ confirmacion: _confirmacion, ...datos }) => registrar.mutate(datos))}
        noValidate
      >
        <Campo etiqueta="Nombre completo" error={errors.nombre_completo?.message} requerido>
          <Entrada autoComplete="name" {...register('nombre_completo')} />
        </Campo>

        <Campo etiqueta="Empresa" ayuda="Opcional. Aparece en los reportes." error={errors.empresa?.message}>
          <Entrada autoComplete="organization" {...register('empresa')} />
        </Campo>

        <Campo etiqueta="Correo" error={errors.correo?.message} requerido>
          <Entrada type="email" autoComplete="email" {...register('correo')} />
        </Campo>

        <Campo etiqueta="Contraseña" error={errors.clave?.message} requerido>
          <Entrada type="password" autoComplete="new-password" {...register('clave')} />
        </Campo>

        <Campo etiqueta="Repite la contraseña" error={errors.confirmacion?.message} requerido>
          <Entrada type="password" autoComplete="new-password" {...register('confirmacion')} />
        </Campo>

        <Boton type="submit" className="w-full" cargando={registrar.isPending} tamano="lg">
          Crear cuenta
        </Boton>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to={RUTAS.ingresar} className="text-marca hover:underline">
          Ingresar
        </Link>
      </p>
    </>
  );
}
