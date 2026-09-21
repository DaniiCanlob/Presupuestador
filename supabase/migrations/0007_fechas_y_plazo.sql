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
