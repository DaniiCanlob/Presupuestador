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
