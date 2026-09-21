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
