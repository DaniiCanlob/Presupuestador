import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Boton } from '@/common/ui/Boton';
import { Campo, Entrada } from '@/common/ui/campos';
import { useIngresar } from '@/features/auth/hooks/useAuth';
import { esquemaIngreso, type FormularioIngreso } from '@/features/auth/schemas';
import { RUTAS } from '@/common/constants/rutas';

export default function IngresarPage() {
  const ingresar = useIngresar();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormularioIngreso>({ resolver: zodResolver(esquemaIngreso) });

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Ingresar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Entra con tu correo y contraseña.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit((datos) => ingresar.mutate(datos))}
        noValidate
      >
        <Campo etiqueta="Correo" error={errors.correo?.message} requerido>
          <Entrada type="email" autoComplete="email" placeholder="tu@correo.com" {...register('correo')} />
        </Campo>

        <Campo etiqueta="Contraseña" error={errors.clave?.message} requerido>
          <Entrada type="password" autoComplete="current-password" {...register('clave')} />
        </Campo>

        <Boton type="submit" className="w-full" cargando={ingresar.isPending} tamano="lg">
          Ingresar
        </Boton>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to={RUTAS.recuperar} className="text-marca hover:underline">
          Olvidé mi contraseña
        </Link>
        <Link to={RUTAS.registro} className="text-marca hover:underline">
          Crear cuenta
        </Link>
      </div>
    </>
  );
}
