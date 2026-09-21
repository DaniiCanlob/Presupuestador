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
