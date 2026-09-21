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
