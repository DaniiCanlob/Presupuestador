-- ============================================================
-- Presupuestador PRO - esquema completo
-- Pegar tal cual en el SQL Editor de Supabase y darle Run.
-- ============================================================


-- >>>>>>>>>>>>>>>>>>>> 0001_extensiones.sql <<<<<<<<<<<<<<<<<<<<

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

-- >>>>>>>>>>>>>>>>>>>> 0002_catalogo.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- 0002 · Catalogo: capitulos, insumos, actividades, APU y especificaciones
--
-- Regla de propiedad: owner_id IS NULL  -> fila del catalogo global (solo lectura)
--                     owner_id = uid    -> fila propia del usuario (editable)
-- ============================================================================

-- ----------------------------------------------------------------- capitulos
create table public.capitulos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users on delete cascade,
  codigo      text not null,
  nombre      text not null,
  orden       integer not null default 0,
  created_at  timestamptz not null default now()
);

create unique index capitulos_codigo_global_uk
  on public.capitulos (codigo) where owner_id is null;
create unique index capitulos_codigo_owner_uk
  on public.capitulos (owner_id, codigo) where owner_id is not null;
create index capitulos_owner_idx on public.capitulos (owner_id);

-- ----------------------------------------------------------------- insumos
create table public.insumos (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users on delete cascade,
  descripcion     text not null,
  unidad          text not null default 'Un',
  tipo            public.tipo_insumo not null default 'material',
  precio_unitario numeric(14, 2) not null default 0,
  es_auxiliar     boolean not null default false,
  marca           text,
  proveedor       text,
  notas           text,
  activo          boolean not null default true,
  busqueda        text generated always as (public.normalizar(descripcion)) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index insumos_descripcion_global_uk
  on public.insumos (descripcion) where owner_id is null;
create unique index insumos_descripcion_owner_uk
  on public.insumos (owner_id, descripcion) where owner_id is not null;
create index insumos_busqueda_idx on public.insumos using gin (busqueda extensions.gin_trgm_ops);
create index insumos_tipo_idx on public.insumos (tipo);
create index insumos_owner_idx on public.insumos (owner_id);

create trigger insumos_updated_at before update on public.insumos
  for each row execute function public.tocar_updated_at();

-- Composicion de los insumos auxiliares (cuadrillas, juegos de herramienta...)
create table public.insumo_componentes (
  id              uuid primary key default gen_random_uuid(),
  auxiliar_id     uuid not null references public.insumos on delete cascade,
  orden           integer not null default 0,
  grupo           text not null default 'MATERIALES',
  tipo            public.tipo_insumo not null default 'material',
  insumo_id       uuid references public.insumos on delete set null,
  descripcion     text not null,
  unidad          text,
  cantidad        numeric(16, 6) not null default 0,
  precio_unitario numeric(14, 2) not null default 0,
  es_porcentaje   boolean not null default false,
  valor_parcial   numeric(18, 2) generated always as (
    round(case when es_porcentaje then precio_unitario * cantidad / 100 else precio_unitario * cantidad end, 2)
  ) stored
);

create index insumo_componentes_auxiliar_idx on public.insumo_componentes (auxiliar_id, orden);

-- ----------------------------------------------------------------- actividades
create table public.actividades (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users on delete cascade,
  capitulo_id     uuid references public.capitulos on delete set null,
  codigo          text not null,
  descripcion     text not null,
  unidad          text not null default 'Un',
  valor_unitario  numeric(14, 2) not null default 0,
  rendimiento_dia numeric(14, 4),
  orden           integer not null default 0,
  activo          boolean not null default true,
  busqueda        text generated always as (public.normalizar(codigo || ' ' || descripcion)) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index actividades_codigo_global_uk
  on public.actividades (codigo) where owner_id is null;
create unique index actividades_codigo_owner_uk
  on public.actividades (owner_id, codigo) where owner_id is not null;
create index actividades_busqueda_idx
  on public.actividades using gin (busqueda extensions.gin_trgm_ops);
create index actividades_capitulo_idx on public.actividades (capitulo_id, orden);
create index actividades_owner_idx on public.actividades (owner_id);

create trigger actividades_updated_at before update on public.actividades
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------- APU
create table public.apu_items (
  id              uuid primary key default gen_random_uuid(),
  actividad_id    uuid not null references public.actividades on delete cascade,
  orden           integer not null default 0,
  grupo           text not null default 'MATERIALES',
  tipo            public.tipo_insumo not null default 'material',
  insumo_id       uuid references public.insumos on delete set null,
  descripcion     text not null,
  unidad          text,
  cantidad        numeric(16, 6) not null default 0,
  precio_unitario numeric(14, 2) not null default 0,
  es_porcentaje   boolean not null default false,
  valor_parcial   numeric(18, 2) generated always as (
    round(case when es_porcentaje then precio_unitario * cantidad / 100 else precio_unitario * cantidad end, 2)
  ) stored
);

create index apu_items_actividad_idx on public.apu_items (actividad_id, orden);
create index apu_items_insumo_idx on public.apu_items (insumo_id);

-- Mantiene actividades.valor_unitario = suma del APU.
create or replace function public.recalcular_valor_actividad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actividad uuid := coalesce(new.actividad_id, old.actividad_id);
begin
  update public.actividades a
     set valor_unitario = coalesce(
           (select round(sum(i.valor_parcial), 2) from public.apu_items i where i.actividad_id = v_actividad),
           0)
   where a.id = v_actividad
     and a.owner_id is not null;   -- el catalogo global conserva el valor original
  return null;
end;
$$;

create trigger apu_items_recalcular
  after insert or update or delete on public.apu_items
  for each row execute function public.recalcular_valor_actividad();

-- ----------------------------------------------------------------- especificaciones
create table public.especificaciones (
  actividad_id        uuid primary key references public.actividades on delete cascade,
  titulo              text,
  descripcion         text,
  ejecucion           text,
  materiales          text,
  herramientas_equipo text,
  personal            text,
  ensayos             text,
  tolerancia          text,
  unidad_medida       text,
  unidad_pago         text,
  updated_at          timestamptz not null default now()
);

create trigger especificaciones_updated_at before update on public.especificaciones
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------- precios propios
-- Permite al usuario ajustar el precio de un insumo del catalogo global
-- sin duplicar la fila.
create table public.precios_insumo (
  owner_id        uuid not null default auth.uid() references auth.users on delete cascade,
  insumo_id       uuid not null references public.insumos on delete cascade,
  precio_unitario numeric(14, 2) not null,
  vigente_desde   date not null default current_date,
  nota            text,
  updated_at      timestamptz not null default now(),
  primary key (owner_id, insumo_id)
);

create trigger precios_insumo_updated_at before update on public.precios_insumo
  for each row execute function public.tocar_updated_at();

-- >>>>>>>>>>>>>>>>>>>> 0003_proyectos.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- 0003 · Perfiles y datos de proyecto
-- ============================================================================

-- ----------------------------------------------------------------- perfiles
create table public.perfiles (
  id              uuid primary key references auth.users on delete cascade,
  nombre_completo text,
  empresa         text,
  nit             text,
  telefono        text,
  ciudad          text,
  direccion       text,
  logo_url        text,
  moneda          text not null default 'COP',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger perfiles_updated_at before update on public.perfiles
  for each row execute function public.tocar_updated_at();

-- Crea el perfil apenas se registra el usuario.
create or replace function public.manejar_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre_completo, empresa)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nombre_completo', ''),
    nullif(new.raw_user_meta_data ->> 'empresa', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_usuario_nuevo();

-- ----------------------------------------------------------------- proyectos
create table public.proyectos (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null default auth.uid() references auth.users on delete cascade,
  nombre               text not null,
  numero_contrato      text,
  tipo_contrato        public.tipo_contrato not null default 'obra',
  objeto               text,
  contratista          text,
  interventoria        text,
  supervision          text,
  entidad_contratante  text,
  ubicacion            text,
  municipio            text,
  departamento         text,
  fecha_inicio         date,
  fecha_fin            date,
  plazo_dias           integer,
  estado               public.estado_proyecto not null default 'borrador',
  -- AIU (no existia en el Excel)
  aplica_aiu           boolean not null default false,
  administracion_pct   numeric(6, 3) not null default 0,
  imprevistos_pct      numeric(6, 3) not null default 0,
  utilidad_pct         numeric(6, 3) not null default 0,
  iva_utilidad_pct     numeric(6, 3) not null default 19,
  anticipo_pct         numeric(6, 3) not null default 0,
  -- parametros de programacion
  jornada_horas        numeric(4, 1) not null default 8,
  dias_habiles_semana  smallint not null default 6,
  observaciones        text,
  archivado            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index proyectos_owner_idx on public.proyectos (owner_id, archivado, created_at desc);
create index proyectos_busqueda_idx
  on public.proyectos using gin (public.normalizar(nombre || ' ' || coalesce(numero_contrato, '') || ' ' || coalesce(objeto, '')) extensions.gin_trgm_ops);

create trigger proyectos_updated_at before update on public.proyectos
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------- presupuesto
create table public.presupuesto_items (
  id                     uuid primary key default gen_random_uuid(),
  proyecto_id            uuid not null references public.proyectos on delete cascade,
  orden                  integer not null default 0,
  capitulo_id            uuid references public.capitulos on delete set null,
  capitulo_nombre        text,
  actividad_id           uuid references public.actividades on delete set null,
  codigo                 text,
  descripcion            text not null,
  unidad                 text not null default 'Un',
  cantidad               numeric(16, 4) not null default 0,
  valor_unitario         numeric(14, 2) not null default 0,
  cantidad_desde_memoria boolean not null default true,
  nota                   text,
  valor_parcial          numeric(18, 2) generated always as (round(cantidad * valor_unitario, 2)) stored,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index presupuesto_items_proyecto_idx on public.presupuesto_items (proyecto_id, orden);
create index presupuesto_items_actividad_idx on public.presupuesto_items (actividad_id);

create trigger presupuesto_items_updated_at before update on public.presupuesto_items
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------- memorias de cantidades
create table public.memoria_items (
  id                   uuid primary key default gen_random_uuid(),
  presupuesto_item_id  uuid not null references public.presupuesto_items on delete cascade,
  orden                integer not null default 0,
  descripcion          text,
  largo                numeric(14, 4),
  ancho                numeric(14, 4),
  alto                 numeric(14, 4),
  veces                numeric(14, 4) not null default 1,
  -- Igual que el Excel: los campos vacios (o en cero) cuentan como 1.
  subtotal numeric(18, 4) generated always as (
    round(
      coalesce(nullif(largo, 0), 1) *
      coalesce(nullif(ancho, 0), 1) *
      coalesce(nullif(alto, 0), 1) *
      coalesce(nullif(veces, 0), 1), 4)
  ) stored,
  created_at timestamptz not null default now()
);

create index memoria_items_item_idx on public.memoria_items (presupuesto_item_id, orden);

-- La cantidad del presupuesto se alimenta de la memoria.
create or replace function public.sincronizar_cantidad_memoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item uuid := coalesce(new.presupuesto_item_id, old.presupuesto_item_id);
begin
  update public.presupuesto_items p
     set cantidad = coalesce(
           (select round(sum(m.subtotal), 4) from public.memoria_items m where m.presupuesto_item_id = v_item),
           0)
   where p.id = v_item
     and p.cantidad_desde_memoria;
  return null;
end;
$$;

create trigger memoria_items_sincronizar
  after insert or update or delete on public.memoria_items
  for each row execute function public.sincronizar_cantidad_memoria();

-- ----------------------------------------------------------------- programacion
create table public.programacion_items (
  id                   uuid primary key default gen_random_uuid(),
  proyecto_id          uuid not null references public.proyectos on delete cascade,
  presupuesto_item_id  uuid not null unique references public.presupuesto_items on delete cascade,
  rendimiento_dia      numeric(14, 4),
  cuadrillas           numeric(6, 2) not null default 1,
  duracion_dias        numeric(8, 2),
  fecha_inicio         date,
  fecha_fin            date,
  predecesor_item_id   uuid references public.presupuesto_items on delete set null,
  avance_pct           numeric(5, 2) not null default 0 check (avance_pct between 0 and 100),
  responsable          text,
  notas                text,
  updated_at           timestamptz not null default now()
);

create index programacion_proyecto_idx on public.programacion_items (proyecto_id, fecha_inicio);

create trigger programacion_items_updated_at before update on public.programacion_items
  for each row execute function public.tocar_updated_at();

-- ----------------------------------------------------------------- actas de avance
create table public.actas (
  id             uuid primary key default gen_random_uuid(),
  proyecto_id    uuid not null references public.proyectos on delete cascade,
  numero         integer not null default 1,
  tipo           text not null default 'parcial',
  periodo_inicio date,
  periodo_fin    date,
  estado         public.estado_acta not null default 'borrador',
  observaciones  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index actas_numero_uk on public.actas (proyecto_id, numero);

create trigger actas_updated_at before update on public.actas
  for each row execute function public.tocar_updated_at();

create table public.acta_items (
  id                  uuid primary key default gen_random_uuid(),
  acta_id             uuid not null references public.actas on delete cascade,
  presupuesto_item_id uuid not null references public.presupuesto_items on delete cascade,
  cantidad_ejecutada  numeric(16, 4) not null default 0,
  valor_unitario      numeric(14, 2) not null default 0,
  valor               numeric(18, 2) generated always as (round(cantidad_ejecutada * valor_unitario, 2)) stored,
  unique (acta_id, presupuesto_item_id)
);

create index acta_items_acta_idx on public.acta_items (acta_id);

-- ----------------------------------------------------------------- bitacora
create table public.bitacora (
  id            uuid primary key default gen_random_uuid(),
  proyecto_id   uuid not null references public.proyectos on delete cascade,
  fecha         date not null default current_date,
  clima         text,
  personal_obra integer,
  actividades   text,
  observaciones text,
  created_at    timestamptz not null default now()
);

create index bitacora_proyecto_idx on public.bitacora (proyecto_id, fecha desc);

-- ----------------------------------------------------------------- documentos
create table public.documentos (
  id                  uuid primary key default gen_random_uuid(),
  proyecto_id         uuid not null references public.proyectos on delete cascade,
  presupuesto_item_id uuid references public.presupuesto_items on delete cascade,
  nombre              text not null,
  tipo                public.tipo_documento not null default 'otro',
  ruta                text not null,
  mime                text,
  tamano_bytes        bigint,
  created_at          timestamptz not null default now()
);

create index documentos_proyecto_idx on public.documentos (proyecto_id, created_at desc);
create index documentos_item_idx on public.documentos (presupuesto_item_id);

-- >>>>>>>>>>>>>>>>>>>> 0004_rls.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- 0004 · Row Level Security
--
-- Catalogo  : lectura del global (owner_id is null) + lectura/escritura propia.
-- Proyectos : todo se resuelve contra proyectos.owner_id = auth.uid().
-- ============================================================================

-- ----------------------------------------------------------------- helpers
create or replace function public.es_actividad_visible(p_actividad uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.actividades a
     where a.id = p_actividad and (a.owner_id is null or a.owner_id = auth.uid())
  );
$$;

create or replace function public.es_actividad_propia(p_actividad uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.actividades a where a.id = p_actividad and a.owner_id = auth.uid());
$$;

create or replace function public.es_insumo_visible(p_insumo uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.insumos i
     where i.id = p_insumo and (i.owner_id is null or i.owner_id = auth.uid())
  );
$$;

create or replace function public.es_insumo_propio(p_insumo uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.insumos i where i.id = p_insumo and i.owner_id = auth.uid());
$$;

create or replace function public.es_proyecto_propio(p_proyecto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.proyectos p where p.id = p_proyecto and p.owner_id = auth.uid());
$$;

create or replace function public.es_item_presupuesto_propio(p_item uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.presupuesto_items i
      join public.proyectos p on p.id = i.proyecto_id
     where i.id = p_item and p.owner_id = auth.uid()
  );
$$;

create or replace function public.es_acta_propia(p_acta uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.actas a
      join public.proyectos p on p.id = a.proyecto_id
     where a.id = p_acta and p.owner_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------- permisos de tabla
-- Supabase concede esto por privilegios por defecto, pero se deja explicito
-- para que el esquema funcione igual en cualquier instancia.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ----------------------------------------------------------------- activar RLS
alter table public.capitulos          enable row level security;
alter table public.insumos            enable row level security;
alter table public.insumo_componentes enable row level security;
alter table public.actividades        enable row level security;
alter table public.apu_items          enable row level security;
alter table public.especificaciones   enable row level security;
alter table public.precios_insumo     enable row level security;
alter table public.perfiles           enable row level security;
alter table public.proyectos          enable row level security;
alter table public.presupuesto_items  enable row level security;
alter table public.memoria_items      enable row level security;
alter table public.programacion_items enable row level security;
alter table public.actas              enable row level security;
alter table public.acta_items         enable row level security;
alter table public.bitacora           enable row level security;
alter table public.documentos         enable row level security;

-- ----------------------------------------------------------------- catalogo
create policy capitulos_leer on public.capitulos for select to authenticated
  using (owner_id is null or owner_id = auth.uid());
create policy capitulos_crear on public.capitulos for insert to authenticated
  with check (owner_id = auth.uid());
create policy capitulos_editar on public.capitulos for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy capitulos_borrar on public.capitulos for delete to authenticated
  using (owner_id = auth.uid());

create policy insumos_leer on public.insumos for select to authenticated
  using (owner_id is null or owner_id = auth.uid());
create policy insumos_crear on public.insumos for insert to authenticated
  with check (owner_id = auth.uid());
create policy insumos_editar on public.insumos for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy insumos_borrar on public.insumos for delete to authenticated
  using (owner_id = auth.uid());

create policy componentes_leer on public.insumo_componentes for select to authenticated
  using (public.es_insumo_visible(auxiliar_id));
create policy componentes_escribir on public.insumo_componentes for all to authenticated
  using (public.es_insumo_propio(auxiliar_id))
  with check (public.es_insumo_propio(auxiliar_id));

create policy actividades_leer on public.actividades for select to authenticated
  using (owner_id is null or owner_id = auth.uid());
create policy actividades_crear on public.actividades for insert to authenticated
  with check (owner_id = auth.uid());
create policy actividades_editar on public.actividades for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy actividades_borrar on public.actividades for delete to authenticated
  using (owner_id = auth.uid());

create policy apu_leer on public.apu_items for select to authenticated
  using (public.es_actividad_visible(actividad_id));
create policy apu_escribir on public.apu_items for all to authenticated
  using (public.es_actividad_propia(actividad_id))
  with check (public.es_actividad_propia(actividad_id));

create policy especificaciones_leer on public.especificaciones for select to authenticated
  using (public.es_actividad_visible(actividad_id));
create policy especificaciones_escribir on public.especificaciones for all to authenticated
  using (public.es_actividad_propia(actividad_id))
  with check (public.es_actividad_propia(actividad_id));

create policy precios_propios on public.precios_insumo for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ----------------------------------------------------------------- perfil
create policy perfil_leer on public.perfiles for select to authenticated
  using (id = auth.uid());
create policy perfil_editar on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy perfil_crear on public.perfiles for insert to authenticated
  with check (id = auth.uid());

-- ----------------------------------------------------------------- proyectos
create policy proyectos_propios on public.proyectos for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy presupuesto_propio on public.presupuesto_items for all to authenticated
  using (public.es_proyecto_propio(proyecto_id))
  with check (public.es_proyecto_propio(proyecto_id));

create policy memoria_propia on public.memoria_items for all to authenticated
  using (public.es_item_presupuesto_propio(presupuesto_item_id))
  with check (public.es_item_presupuesto_propio(presupuesto_item_id));

create policy programacion_propia on public.programacion_items for all to authenticated
  using (public.es_proyecto_propio(proyecto_id))
  with check (public.es_proyecto_propio(proyecto_id));

create policy actas_propias on public.actas for all to authenticated
  using (public.es_proyecto_propio(proyecto_id))
  with check (public.es_proyecto_propio(proyecto_id));

create policy acta_items_propios on public.acta_items for all to authenticated
  using (public.es_acta_propia(acta_id))
  with check (public.es_acta_propia(acta_id));

create policy bitacora_propia on public.bitacora for all to authenticated
  using (public.es_proyecto_propio(proyecto_id))
  with check (public.es_proyecto_propio(proyecto_id));

create policy documentos_propios on public.documentos for all to authenticated
  using (public.es_proyecto_propio(proyecto_id))
  with check (public.es_proyecto_propio(proyecto_id));

-- >>>>>>>>>>>>>>>>>>>> 0005_funciones.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- 0005 · Funciones de negocio (RPC)
--
-- Todas corren como invoker: el RLS de 0004 decide que ve cada usuario.
-- ============================================================================

-- ----------------------------------------------------------------- precios
-- Valor unitario de una actividad aplicando los precios propios del usuario.
create or replace function public.valor_unitario_actividad(p_actividad uuid)
returns numeric
language sql stable
as $$
  select coalesce(round(sum(
    case when a.es_porcentaje
         then coalesce(pr.precio_unitario, a.precio_unitario) * a.cantidad / 100
         else coalesce(pr.precio_unitario, a.precio_unitario) * a.cantidad
    end), 2), 0)
    from public.apu_items a
    left join public.precios_insumo pr
      on pr.insumo_id = a.insumo_id and pr.owner_id = auth.uid()
   where a.actividad_id = p_actividad;
$$;

-- Rendimiento sugerido (unidades/dia) leido de la mano de obra del APU:
-- en el APU la cuadrilla se expresa como dias por unidad.
create or replace function public.rendimiento_sugerido(p_actividad uuid)
returns numeric
language sql stable
as $$
  select case when d.dias > 0 then round(1 / d.dias, 4) else null end
    from (
      select max(cantidad) as dias
        from public.apu_items
       where actividad_id = p_actividad
         and tipo = 'mano_obra'
         and not es_porcentaje
         and public.normalizar(coalesce(unidad, '')) in ('dia', 'dias', 'jornal')
    ) d;
$$;

-- ----------------------------------------------------------------- presupuesto
-- Agrega actividades del catalogo al presupuesto tomando una foto del precio.
create or replace function public.agregar_actividades_presupuesto(
  p_proyecto uuid,
  p_actividades uuid[],
  p_cantidad numeric default 0
)
returns setof public.presupuesto_items
language plpgsql
as $$
declare
  v_orden integer;
begin
  select coalesce(max(orden), 0) into v_orden
    from public.presupuesto_items where proyecto_id = p_proyecto;

  return query
  with nuevas as (
    select a.id,
           a.codigo,
           a.descripcion,
           a.unidad,
           a.capitulo_id,
           c.nombre as capitulo_nombre,
           public.valor_unitario_actividad(a.id) as valor_unitario,
           v_orden + row_number() over (order by a.orden, a.codigo) as orden
      from public.actividades a
      left join public.capitulos c on c.id = a.capitulo_id
     where a.id = any (p_actividades)
  )
  insert into public.presupuesto_items
    (proyecto_id, orden, capitulo_id, capitulo_nombre, actividad_id,
     codigo, descripcion, unidad, cantidad, valor_unitario, cantidad_desde_memoria)
  select p_proyecto, n.orden, n.capitulo_id, n.capitulo_nombre, n.id,
         n.codigo, n.descripcion, n.unidad, p_cantidad,
         case when n.valor_unitario > 0 then n.valor_unitario
              else (select valor_unitario from public.actividades where id = n.id) end,
         p_cantidad = 0
    from nuevas n
  returning *;
end;
$$;

-- Vuelve a tomar el precio actual del catalogo (con precios propios aplicados).
create or replace function public.actualizar_precios_presupuesto(p_proyecto uuid)
returns integer
language plpgsql
as $$
declare
  v_filas integer;
begin
  update public.presupuesto_items p
     set valor_unitario = v.nuevo
    from (
      select id, public.valor_unitario_actividad(actividad_id) as nuevo
        from public.presupuesto_items
       where proyecto_id = p_proyecto and actividad_id is not null
    ) v
   where p.id = v.id
     and v.nuevo > 0
     and v.nuevo is distinct from p.valor_unitario;
  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

-- ----------------------------------------------------------------- totales
create or replace function public.totales_proyecto(p_proyecto uuid)
returns table (
  actividades     integer,
  costo_directo   numeric,
  administracion  numeric,
  imprevistos     numeric,
  utilidad        numeric,
  iva_utilidad    numeric,
  aiu             numeric,
  total           numeric,
  anticipo        numeric
)
language sql stable
as $$
  with pr as (select * from public.proyectos where id = p_proyecto),
       cd as (
         select count(*)::integer as n, coalesce(sum(valor_parcial), 0) as directo
           from public.presupuesto_items where proyecto_id = p_proyecto
       ),
       calc as (
         select cd.n,
                cd.directo,
                case when pr.aplica_aiu then round(cd.directo * pr.administracion_pct / 100, 2) else 0 end as adm,
                case when pr.aplica_aiu then round(cd.directo * pr.imprevistos_pct / 100, 2) else 0 end as imp,
                case when pr.aplica_aiu then round(cd.directo * pr.utilidad_pct / 100, 2) else 0 end as uti,
                pr.iva_utilidad_pct,
                pr.anticipo_pct
           from cd cross join pr
       )
  select n,
         directo,
         adm,
         imp,
         uti,
         round(uti * iva_utilidad_pct / 100, 2) as iva_utilidad,
         adm + imp + uti as aiu,
         directo + adm + imp + uti + round(uti * iva_utilidad_pct / 100, 2) as total,
         round((directo + adm + imp + uti + round(uti * iva_utilidad_pct / 100, 2)) * anticipo_pct / 100, 2) as anticipo
    from calc;
$$;

-- ----------------------------------------------------------------- insumos del proyecto
create or replace function public.resumen_insumos(p_proyecto uuid)
returns table (
  tipo            public.tipo_insumo,
  insumo_id       uuid,
  descripcion     text,
  unidad          text,
  cantidad_total  numeric,
  precio_unitario numeric,
  valor_total     numeric
)
language sql stable
as $$
  select a.tipo,
         a.insumo_id,
         a.descripcion,
         coalesce(a.unidad, '') as unidad,
         round(sum(p.cantidad * a.cantidad), 4) as cantidad_total,
         max(coalesce(pr.precio_unitario, a.precio_unitario)) as precio_unitario,
         round(sum(p.cantidad * a.cantidad * coalesce(pr.precio_unitario, a.precio_unitario)), 2) as valor_total
    from public.presupuesto_items p
    join public.apu_items a on a.actividad_id = p.actividad_id
    left join public.precios_insumo pr
      on pr.insumo_id = a.insumo_id and pr.owner_id = auth.uid()
   where p.proyecto_id = p_proyecto
     and not a.es_porcentaje
     and p.cantidad > 0
   group by a.tipo, a.insumo_id, a.descripcion, coalesce(a.unidad, '')
   order by a.tipo, a.descripcion;
$$;

-- ----------------------------------------------------------------- programacion
-- Suma dias habiles respetando los dias laborables por semana del proyecto.
create or replace function public.sumar_dias_habiles(p_fecha date, p_dias integer, p_habiles smallint)
returns date
language plpgsql immutable
as $$
declare
  v_fecha date := p_fecha;
  v_resto integer := greatest(p_dias, 0);
begin
  if p_habiles >= 7 then
    return p_fecha + v_resto;
  end if;
  while v_resto > 0 loop
    v_fecha := v_fecha + 1;
    if p_habiles = 6 and extract(dow from v_fecha) <> 0 then
      v_resto := v_resto - 1;
    elsif p_habiles <= 5 and extract(dow from v_fecha) between 1 and 5 then
      v_resto := v_resto - 1;
    end if;
  end loop;
  return v_fecha;
end;
$$;

-- Calcula duracion y fechas en cascada para todo el proyecto.
create or replace function public.programar_proyecto(p_proyecto uuid)
returns integer
language plpgsql
as $$
declare
  v_proy       public.proyectos%rowtype;
  v_item       record;
  v_inicio     date;
  v_fin        date;
  v_duracion   numeric;
  v_rend       numeric;
  v_cursor     date;
  v_filas      integer := 0;
begin
  select * into v_proy from public.proyectos where id = p_proyecto;
  if not found then
    raise exception 'Proyecto no encontrado';
  end if;

  v_cursor := coalesce(v_proy.fecha_inicio, current_date);

  for v_item in
    select p.id, p.cantidad, p.actividad_id, g.rendimiento_dia, g.cuadrillas, g.duracion_dias
      from public.presupuesto_items p
      left join public.programacion_items g on g.presupuesto_item_id = p.id
     where p.proyecto_id = p_proyecto
     order by p.orden
  loop
    v_rend := coalesce(v_item.rendimiento_dia, public.rendimiento_sugerido(v_item.actividad_id));

    if v_item.duracion_dias is not null and v_item.duracion_dias > 0 then
      v_duracion := v_item.duracion_dias;
    elsif v_rend is not null and v_rend > 0 and v_item.cantidad > 0 then
      v_duracion := ceil(v_item.cantidad / (v_rend * coalesce(nullif(v_item.cuadrillas, 0), 1)));
    else
      v_duracion := 1;
    end if;

    v_inicio := v_cursor;
    v_fin := public.sumar_dias_habiles(v_inicio, greatest(v_duracion::integer - 1, 0), v_proy.dias_habiles_semana);

    insert into public.programacion_items
      (proyecto_id, presupuesto_item_id, rendimiento_dia, cuadrillas, duracion_dias, fecha_inicio, fecha_fin)
    values
      (p_proyecto, v_item.id, v_rend, coalesce(nullif(v_item.cuadrillas, 0), 1), v_duracion, v_inicio, v_fin)
    on conflict (presupuesto_item_id) do update
      set rendimiento_dia = excluded.rendimiento_dia,
          duracion_dias   = excluded.duracion_dias,
          fecha_inicio    = excluded.fecha_inicio,
          fecha_fin       = excluded.fecha_fin;

    v_cursor := public.sumar_dias_habiles(v_fin, 1, v_proy.dias_habiles_semana);
    v_filas := v_filas + 1;
  end loop;

  update public.proyectos
     set fecha_fin = (select max(fecha_fin) from public.programacion_items where proyecto_id = p_proyecto)
   where id = p_proyecto;

  return v_filas;
end;
$$;

-- ----------------------------------------------------------------- avance
create or replace function public.avance_proyecto(p_proyecto uuid)
returns table (
  valor_total      numeric,
  valor_ejecutado  numeric,
  avance_pct       numeric,
  actividades      integer,
  terminadas       integer
)
language sql stable
as $$
  with base as (
    select coalesce(sum(p.valor_parcial), 0) as total,
           coalesce(sum(p.valor_parcial * coalesce(g.avance_pct, 0) / 100), 0) as ejecutado,
           count(*)::integer as n,
           count(*) filter (where coalesce(g.avance_pct, 0) >= 100)::integer as fin
      from public.presupuesto_items p
      left join public.programacion_items g on g.presupuesto_item_id = p.id
     where p.proyecto_id = p_proyecto
  )
  select round(total, 2),
         round(ejecutado, 2),
         case when total > 0 then round(ejecutado * 100 / total, 2) else 0 end,
         n,
         fin
    from base;
$$;

-- ----------------------------------------------------------------- duplicar
create or replace function public.duplicar_proyecto(p_proyecto uuid, p_nombre text)
returns uuid
language plpgsql
as $$
declare
  v_nuevo uuid;
begin
  insert into public.proyectos (
    owner_id, nombre, numero_contrato, tipo_contrato, objeto, contratista, interventoria,
    supervision, entidad_contratante, ubicacion, municipio, departamento, fecha_inicio,
    plazo_dias, aplica_aiu, administracion_pct, imprevistos_pct, utilidad_pct,
    iva_utilidad_pct, anticipo_pct, jornada_horas, dias_habiles_semana, observaciones
  )
  select owner_id, p_nombre, numero_contrato, tipo_contrato, objeto, contratista, interventoria,
         supervision, entidad_contratante, ubicacion, municipio, departamento, fecha_inicio,
         plazo_dias, aplica_aiu, administracion_pct, imprevistos_pct, utilidad_pct,
         iva_utilidad_pct, anticipo_pct, jornada_horas, dias_habiles_semana, observaciones
    from public.proyectos where id = p_proyecto
  returning id into v_nuevo;

  insert into public.presupuesto_items
    (proyecto_id, orden, capitulo_id, capitulo_nombre, actividad_id, codigo, descripcion,
     unidad, cantidad, valor_unitario, cantidad_desde_memoria, nota)
  select v_nuevo, orden, capitulo_id, capitulo_nombre, actividad_id, codigo, descripcion,
         unidad, cantidad, valor_unitario, cantidad_desde_memoria, nota
    from public.presupuesto_items
   where proyecto_id = p_proyecto;

  -- Las memorias se enlazan por (orden, codigo), que identifica la fila dentro del proyecto.
  insert into public.memoria_items
    (presupuesto_item_id, orden, descripcion, largo, ancho, alto, veces)
  select nuevo.id, m.orden, m.descripcion, m.largo, m.ancho, m.alto, m.veces
    from public.memoria_items m
    join public.presupuesto_items viejo on viejo.id = m.presupuesto_item_id
    join public.presupuesto_items nuevo
      on nuevo.proyecto_id = v_nuevo
     and nuevo.orden = viejo.orden
     and coalesce(nuevo.codigo, '') = coalesce(viejo.codigo, '')
   where viejo.proyecto_id = p_proyecto;

  return v_nuevo;
end;
$$;

-- ----------------------------------------------------------------- permisos
grant execute on function
  public.valor_unitario_actividad(uuid),
  public.rendimiento_sugerido(uuid),
  public.agregar_actividades_presupuesto(uuid, uuid[], numeric),
  public.actualizar_precios_presupuesto(uuid),
  public.totales_proyecto(uuid),
  public.resumen_insumos(uuid),
  public.sumar_dias_habiles(date, integer, smallint),
  public.programar_proyecto(uuid),
  public.avance_proyecto(uuid),
  public.duplicar_proyecto(uuid, text)
to authenticated;

-- >>>>>>>>>>>>>>>>>>>> 0006_storage.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- 0006 · Almacenamiento (fotos de memorias, planos, logos)
--
-- Convencion de rutas: <uid>/<proyecto_id>/<archivo>  y  <uid>/logo.<ext>
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documentos', 'documentos', false, 20971520,
   array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('logos', 'logos', true, 2097152,
   array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Cada usuario solo toca su primera carpeta (su uid).
create policy documentos_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy documentos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy documentos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_leer on storage.objects for select to public
  using (bucket_id = 'logos');

create policy logos_escribir on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- >>>>>>>>>>>>>>>>>>>> 0007_fechas_y_plazo.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- 0007 · Separa el plazo del contrato de la fecha que calcula la programación
--
-- Antes `programar_proyecto` pisaba proyectos.fecha_fin con el fin del
-- cronograma, así que un proyecto con "inicio 22/09 y plazo 12 días" terminaba
-- mostrando 23/09. Ahora:
--   · proyectos.fecha_fin  = fin contractual, derivado de fecha_inicio + plazo
--   · max(programacion_items.fecha_fin) = fin según la programación
-- ============================================================================

-- ----------------------------------------------------------------- plazo <-> fechas
-- Mantiene sincronizados plazo_dias y fecha_fin sin pisar lo que el usuario
-- escribe a mano: si toca el plazo se recalcula el fin, y si toca el fin se
-- recalcula el plazo. Se cuenta en dias calendario, con el primer dia incluido.
create or replace function public.sincronizar_plazo_proyecto()
returns trigger
language plpgsql
as $$
declare
  v_cambio_inicio boolean := tg_op = 'INSERT' or new.fecha_inicio is distinct from old.fecha_inicio;
  v_cambio_plazo  boolean := tg_op = 'INSERT' or new.plazo_dias is distinct from old.plazo_dias;
  v_cambio_fin    boolean := tg_op = 'INSERT' or new.fecha_fin is distinct from old.fecha_fin;
begin
  -- El fin puesto a mano manda en esta misma operacion.
  if v_cambio_fin and not v_cambio_plazo then
    if new.fecha_inicio is not null and new.fecha_fin is not null then
      new.plazo_dias := (new.fecha_fin - new.fecha_inicio) + 1;
    end if;
    return new;
  end if;

  if (v_cambio_plazo or v_cambio_inicio)
     and new.fecha_inicio is not null
     and new.plazo_dias is not null
     and new.plazo_dias > 0 then
    new.fecha_fin := new.fecha_inicio + (new.plazo_dias - 1);
  end if;

  return new;
end;
$$;

comment on function public.sincronizar_plazo_proyecto is
  'proyectos.fecha_fin es el fin del plazo contractual, no el del cronograma.';

drop trigger if exists proyectos_sincronizar_plazo on public.proyectos;
create trigger proyectos_sincronizar_plazo
  before insert or update of fecha_inicio, plazo_dias, fecha_fin on public.proyectos
  for each row execute function public.sincronizar_plazo_proyecto();

-- Rellena los proyectos que ya existen y tienen plazo.
update public.proyectos
   set fecha_fin = fecha_inicio + (plazo_dias - 1)
 where fecha_inicio is not null
   and plazo_dias is not null
   and plazo_dias > 0
   and (fecha_fin is null or fecha_fin <> fecha_inicio + (plazo_dias - 1));

-- ----------------------------------------------------------------- programación
-- Igual que antes, pero sin tocar proyectos.fecha_fin.
create or replace function public.programar_proyecto(p_proyecto uuid)
returns integer
language plpgsql
as $$
declare
  v_proy       public.proyectos%rowtype;
  v_item       record;
  v_inicio     date;
  v_fin        date;
  v_duracion   numeric;
  v_rend       numeric;
  v_cursor     date;
  v_filas      integer := 0;
begin
  select * into v_proy from public.proyectos where id = p_proyecto;
  if not found then
    raise exception 'Proyecto no encontrado';
  end if;

  v_cursor := coalesce(v_proy.fecha_inicio, current_date);

  for v_item in
    select p.id, p.cantidad, p.actividad_id, g.rendimiento_dia, g.cuadrillas, g.duracion_dias
      from public.presupuesto_items p
      left join public.programacion_items g on g.presupuesto_item_id = p.id
     where p.proyecto_id = p_proyecto
     order by p.orden
  loop
    v_rend := coalesce(v_item.rendimiento_dia, public.rendimiento_sugerido(v_item.actividad_id));

    if v_item.duracion_dias is not null and v_item.duracion_dias > 0 then
      v_duracion := v_item.duracion_dias;
    elsif v_rend is not null and v_rend > 0 and v_item.cantidad > 0 then
      v_duracion := ceil(v_item.cantidad / (v_rend * coalesce(nullif(v_item.cuadrillas, 0), 1)));
    else
      v_duracion := 1;
    end if;

    v_inicio := v_cursor;
    v_fin := public.sumar_dias_habiles(v_inicio, greatest(v_duracion::integer - 1, 0), v_proy.dias_habiles_semana);

    insert into public.programacion_items
      (proyecto_id, presupuesto_item_id, rendimiento_dia, cuadrillas, duracion_dias, fecha_inicio, fecha_fin)
    values
      (p_proyecto, v_item.id, v_rend, coalesce(nullif(v_item.cuadrillas, 0), 1), v_duracion, v_inicio, v_fin)
    on conflict (presupuesto_item_id) do update
      set rendimiento_dia = excluded.rendimiento_dia,
          duracion_dias   = excluded.duracion_dias,
          fecha_inicio    = excluded.fecha_inicio,
          fecha_fin       = excluded.fecha_fin;

    v_cursor := public.sumar_dias_habiles(v_fin, 1, v_proy.dias_habiles_semana);
    v_filas := v_filas + 1;
  end loop;

  return v_filas;
end;
$$;

-- ----------------------------------------------------------------- resumen de fechas
-- Un solo lugar para saber cómo va el cronograma frente al plazo firmado.
create or replace function public.fechas_proyecto(p_proyecto uuid)
returns table (
  fecha_inicio        date,
  plazo_dias          integer,
  fin_plazo           date,
  fin_programacion    date,
  dias_programados    integer,
  desfase_dias        integer
)
language sql stable
as $$
  select p.fecha_inicio,
         p.plazo_dias,
         p.fecha_fin as fin_plazo,
         g.fin as fin_programacion,
         case when g.fin is not null and p.fecha_inicio is not null
              then (g.fin - p.fecha_inicio) + 1 end as dias_programados,
         case when g.fin is not null and p.fecha_fin is not null
              then g.fin - p.fecha_fin end as desfase_dias
    from public.proyectos p
    left join lateral (
      select max(fecha_fin) as fin
        from public.programacion_items
       where proyecto_id = p.id
    ) g on true
   where p.id = p_proyecto;
$$;

grant execute on function public.fechas_proyecto(uuid) to authenticated;
