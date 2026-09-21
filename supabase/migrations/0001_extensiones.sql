-- ============================================================================
-- 0001 · Extensiones, enums y utilidades compartidas
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Las columnas generadas `busqueda` llaman a unaccent, asi que los roles de la
-- API necesitan poder usar el esquema extensions al insertar.
-- En Supabase ese permiso ya viene dado; si no somos duenos del esquema el
-- grant falla y no pasa nada, por eso se ignora el error.
do $$
declare
  v_rol text;
begin
  foreach v_rol in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = v_rol) then
      begin
        execute format('grant usage on schema extensions to %I', v_rol);
      exception when insufficient_privilege or invalid_schema_name then
        raise notice 'Sin permiso para otorgar usage sobre extensions a %, se omite', v_rol;
      end;
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------- enums
do $$ begin
  create type public.tipo_insumo as enum ('material', 'equipo', 'transporte', 'mano_obra', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_contrato as enum
    ('obra', 'consultoria', 'interventoria', 'suministro', 'mantenimiento', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_proyecto as enum
    ('borrador', 'en_curso', 'suspendido', 'terminado', 'liquidado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_acta as enum ('borrador', 'presentada', 'aprobada', 'pagada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_documento as enum
    ('foto', 'plano', 'contrato', 'acta', 'cotizacion', 'otro');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------- helpers
-- Texto normalizado (minusculas, sin tildes) para busquedas con trigramas.
create or replace function public.normalizar(txt text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, public
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(txt, '')));
$$;

comment on function public.normalizar is
  'Minusculas sin tildes. Inmutable para poder usarse en columnas generadas e indices.';

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
