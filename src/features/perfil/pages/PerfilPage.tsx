import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ImagePlus } from 'lucide-react';
import { useGuardarPerfil, usePerfil, useSubirLogo } from '@/features/perfil/hooks/usePerfil';
import { useSesion } from '@/features/auth/context/SesionProvider';
import { Tarjeta } from '@/common/ui/Tarjeta';
import { Boton } from '@/common/ui/Boton';
import { Campo, Entrada, Selector } from '@/common/ui/campos';
import { Cargando } from '@/common/ui/Estados';
import { iniciales } from '@/common/lib/texto';
import { Titulo } from '@/common/ui/Titulo';
import type { EntradaPerfil } from '@/common/types/auth';

const MONEDAS = ['COP', 'USD', 'MXN', 'PEN', 'CLP', 'EUR'];

export default function PerfilPage() {
  const { usuario } = useSesion();
  const perfil = usePerfil();
  const guardar = useGuardarPerfil();
  const subirLogo = useSubirLogo();
  const entradaArchivo = useRef<HTMLInputElement>(null);

  const { register, handleSubmit } = useForm<EntradaPerfil>({
    values: {
      nombre_completo: perfil.data?.nombre_completo ?? '',
      empresa: perfil.data?.empresa ?? '',
      nit: perfil.data?.nit ?? '',
      telefono: perfil.data?.telefono ?? '',
      ciudad: perfil.data?.ciudad ?? '',
      direccion: perfil.data?.direccion ?? '',
      moneda: perfil.data?.moneda ?? 'COP',
    },
  });

  if (perfil.isLoading) return <Cargando />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Titulo>Mi perfil</Titulo>

      <h1 className="text-lg font-semibold text-foreground">Mi perfil</h1>

      <Tarjeta titulo="Empresa" descripcion="Estos datos encabezan los reportes que exportas.">
        <div className="mb-4 flex items-center gap-3">
          {perfil.data?.logo_url ? (
            <img
              src={perfil.data.logo_url}
              alt="Logo"
              className="h-14 w-14 rounded-lg object-contain ring-1 ring-border"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
              {iniciales(perfil.data?.empresa ?? perfil.data?.nombre_completo)}
            </span>
          )}
          <input
            ref={entradaArchivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirLogo.mutate(archivo);
              e.target.value = '';
            }}
          />
          <Boton
            variante="secundario"
            tamano="sm"
            cargando={subirLogo.isPending}
            icono={<ImagePlus className="h-4 w-4" />}
            onClick={() => entradaArchivo.current?.click()}
          >
            Cambiar logo
          </Boton>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit((datos) => guardar.mutate(datos))}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Nombre completo">
              <Entrada {...register('nombre_completo')} />
            </Campo>
            <Campo etiqueta="Correo">
              <Entrada value={usuario?.email ?? ''} disabled readOnly />
            </Campo>
            <Campo etiqueta="Empresa">
              <Entrada {...register('empresa')} />
            </Campo>
            <Campo etiqueta="NIT / documento">
              <Entrada {...register('nit')} />
            </Campo>
            <Campo etiqueta="Teléfono">
              <Entrada {...register('telefono')} />
            </Campo>
            <Campo etiqueta="Ciudad">
              <Entrada {...register('ciudad')} />
            </Campo>
            <Campo etiqueta="Dirección" className="sm:col-span-2">
              <Entrada {...register('direccion')} />
            </Campo>
            <Campo etiqueta="Moneda">
              <Selector
                opciones={MONEDAS.map((m) => ({ valor: m, etiqueta: m }))}
                {...register('moneda')}
              />
            </Campo>
          </div>

          <div className="flex justify-end">
            <Boton type="submit" cargando={guardar.isPending}>
              Guardar cambios
            </Boton>
          </div>
        </form>
      </Tarjeta>
    </div>
  );
}
