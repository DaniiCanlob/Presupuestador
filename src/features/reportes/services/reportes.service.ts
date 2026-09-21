import { supabase } from '@/common/lib/supabase';
import { desempacar } from '@/common/lib/errores';
import { presupuestoService } from '@/features/presupuesto/services/presupuesto.service';
import { memoriasService } from '@/features/memorias/services/memorias.service';
import { programacionService } from '@/features/programacion/services/programacion.service';
import { insumosProyectoService } from '@/features/insumos-proyecto/services/insumosProyecto.service';
import { proyectosService } from '@/features/proyectos/services/proyectos.service';
import { agruparApu } from '@/common/lib/calculos';
import { ETIQUETA_TIPO } from '@/common/constants/catalogo';
import { fecha, moneda, numero } from '@/common/lib/formato';
import { nombreSeguro } from '@/common/lib/texto';
import type { DocumentoReporte, SeccionReporte, TipoReporte } from '@/common/types/reportes';
import type { Proyecto } from '@/common/types/proyecto';
import type { EspecificacionRow } from '@/common/types/database.types';

const TITULOS: Record<TipoReporte, string> = {
  presupuesto: 'Presupuesto de obra',
  memorias: 'Memorias de cantidades',
  programacion: 'Programación y seguimiento de obra',
  insumos: 'Resumen de insumos requeridos',
  apu: 'Análisis de precios unitarios',
  especificaciones: 'Especificaciones técnicas del proyecto',
};

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: 'Borrador',
  en_curso: 'En curso',
  suspendido: 'Suspendido',
  terminado: 'Terminado',
  liquidado: 'Liquidado',
};

const encabezadoProyecto = (proyecto: Proyecto): [string, string][] => [
  ['N° contrato', proyecto.numero_contrato ?? '—'],
  ['Tipo', proyecto.tipo_contrato.toUpperCase()],
  ['Objeto', proyecto.objeto ?? '—'],
  ['Contratista', proyecto.contratista ?? '—'],
  ['Interventoría', proyecto.interventoria ?? '—'],
  ['Supervisión', proyecto.supervision ?? '—'],
  ['Inicio', fecha(proyecto.fecha_inicio)],
  [
    'Plazo',
    proyecto.plazo_dias ? `${numero(proyecto.plazo_dias, 0)} días calendario` : '—',
  ],
  ['Fin del plazo', fecha(proyecto.fecha_fin)],
  ['Estado', ETIQUETA_ESTADO[proyecto.estado] ?? proyecto.estado],
];

async function seccionesPresupuesto(proyecto: Proyecto): Promise<SeccionReporte[]> {
  const items = await presupuestoService.listar(proyecto.id);
  const totales = await proyectosService.totales(proyecto.id);

  const filas = items.map((i) => [
    i.orden,
    i.codigo ?? '',
    i.descripcion,
    i.unidad,
    numero(i.cantidad),
    moneda(i.valor_unitario),
    moneda(i.valor_parcial),
  ]);

  const resumen: SeccionReporte = {
    titulo: 'Totales',
    columnas: ['Concepto', 'Valor'],
    filas: [
      ['Costo directo', moneda(totales.costo_directo)],
      ...(proyecto.aplica_aiu
        ? ([
            [`Administración (${proyecto.administracion_pct} %)`, moneda(totales.administracion)],
            [`Imprevistos (${proyecto.imprevistos_pct} %)`, moneda(totales.imprevistos)],
            [`Utilidad (${proyecto.utilidad_pct} %)`, moneda(totales.utilidad)],
            [`IVA sobre utilidad (${proyecto.iva_utilidad_pct} %)`, moneda(totales.iva_utilidad)],
          ] as [string, string][])
        : []),
      ['TOTAL', moneda(totales.total)],
    ],
    destacadas: [proyecto.aplica_aiu ? 5 : 1],
  };

  return [
    {
      columnas: ['N°', 'Código', 'Actividad', 'Und', 'Cantidad', 'Vr unitario', 'Vr parcial'],
      filas,
    },
    resumen,
  ];
}

async function seccionesMemorias(proyecto: Proyecto): Promise<SeccionReporte[]> {
  const items = await presupuestoService.listar(proyecto.id);
  const memorias = await memoriasService.listarDelProyecto(proyecto.id);

  return items.map((item) => {
    const filas = (memorias[item.id] ?? []).map((m) => [
      m.descripcion ?? '',
      m.largo ?? '',
      m.ancho ?? '',
      m.alto ?? '',
      m.veces,
      numero(m.subtotal, 4),
    ]);
    filas.push(['CANTIDAD TOTAL', '', '', '', '', numero(item.cantidad, 4)]);

    return {
      titulo: `${item.codigo ?? item.orden} · ${item.descripcion}`,
      subtitulo: `Unidad ${item.unidad}`,
      columnas: ['Descripción parcial', 'Largo (m)', 'Ancho (m)', 'Alto / Cant.', 'Veces', 'Subtotal'],
      filas,
      destacadas: [filas.length - 1],
    };
  });
}

async function seccionesProgramacion(proyecto: Proyecto): Promise<SeccionReporte[]> {
  const filas = await programacionService.listar(proyecto.id);
  const fechas = await programacionService.fechas(proyecto.id);

  const resumen: SeccionReporte[] = fechas?.fin_programacion
    ? [
        {
          titulo: 'Plazo contra programación',
          columnas: ['Concepto', 'Valor'],
          filas: [
            ['Inicio', fecha(fechas.fecha_inicio)],
            ['Fin del plazo contractual', fecha(fechas.fin_plazo)],
            ['Fin según la programación', fecha(fechas.fin_programacion)],
            [
              'Diferencia',
              fechas.desfase_dias === null
                ? '—'
                : fechas.desfase_dias > 0
                  ? `${numero(fechas.desfase_dias, 0)} días por encima del plazo`
                  : `${numero(Math.abs(fechas.desfase_dias), 0)} días de holgura`,
            ],
          ],
          destacadas: [3],
        },
      ]
    : [];

  return [
    ...resumen,
    {
      columnas: [
        'Código',
        'Actividad',
        'Und',
        'Cantidad',
        'Rend. (u/día)',
        'Duración (d)',
        'Inicio',
        'Fin',
        'Avance %',
      ],
      filas: filas.map((f) => [
        f.codigo ?? '',
        f.descripcion,
        f.unidad,
        numero(f.cantidad),
        f.rendimiento_dia ? numero(f.rendimiento_dia, 3) : '',
        numero(f.duracion_dias ?? 0, 1),
        fecha(f.fecha_inicio),
        fecha(f.fecha_fin),
        numero(f.avance_pct, 1),
      ]),
    },
  ];
}

async function seccionesInsumos(proyecto: Proyecto): Promise<SeccionReporte[]> {
  const resumen = await insumosProyectoService.resumen(proyecto.id);
  const tipos = [...new Set(resumen.map((r) => r.tipo))];

  const secciones = tipos.map((tipo) => {
    const filas = resumen
      .filter((r) => r.tipo === tipo)
      .map((r) => [
        r.descripcion,
        r.unidad,
        numero(r.cantidad_total, 4),
        moneda(r.precio_unitario),
        moneda(r.valor_total),
      ]);
    const subtotal = resumen
      .filter((r) => r.tipo === tipo)
      .reduce((s, r) => s + Number(r.valor_total), 0);
    filas.push(['SUBTOTAL', '', '', '', moneda(subtotal)]);

    return {
      titulo: ETIQUETA_TIPO[tipo],
      columnas: ['Descripción', 'Unidad', 'Cantidad total', 'Precio unitario', 'Valor total'],
      filas,
      destacadas: [filas.length - 1],
    };
  });

  const total = resumen.reduce((s, r) => s + Number(r.valor_total), 0);
  secciones.push({
    titulo: 'Total',
    columnas: ['Concepto', 'Valor'],
    filas: [['VALOR TOTAL DE INSUMOS', moneda(total)]],
    destacadas: [0],
  });

  return secciones;
}

async function seccionesApu(proyecto: Proyecto): Promise<SeccionReporte[]> {
  const items = await presupuestoService.listar(proyecto.id);
  const apu = await presupuestoService.apuDelProyecto(proyecto.id);

  return items.map((item) => {
    const grupos = agruparApu(item.actividad_id ? (apu[item.actividad_id] ?? []) : []);
    const filas: (string | number)[][] = [];
    for (const grupo of grupos) {
      filas.push([grupo.grupo, '', '', '', '']);
      for (const linea of grupo.items) {
        filas.push([
          linea.descripcion,
          linea.unidad ?? '',
          numero(linea.cantidad, 4),
          moneda(linea.precio_unitario),
          moneda(linea.valor_parcial),
        ]);
      }
      filas.push(['Subtotal', '', '', '', moneda(grupo.subtotal)]);
    }
    filas.push(['VALOR COSTO DIRECTO', '', '', '', moneda(item.valor_unitario)]);

    return {
      titulo: `${item.codigo ?? item.orden} · ${item.descripcion}`,
      subtitulo: `Unidad ${item.unidad}`,
      columnas: ['Descripción', 'Unidad', 'Cant / Rend', 'Precio unitario', 'Vr parcial'],
      filas,
      destacadas: [filas.length - 1],
    };
  });
}

async function seccionesEspecificaciones(proyecto: Proyecto): Promise<SeccionReporte[]> {
  const items = await presupuestoService.listar(proyecto.id);
  const ids = items.map((i) => i.actividad_id).filter((v): v is string => Boolean(v));
  if (ids.length === 0) return [];

  const respuesta = await supabase.from('especificaciones').select('*').in('actividad_id', ids);
  const filas = desempacar(respuesta);
  const porActividad = new Map<string, EspecificacionRow>(filas.map((f) => [f.actividad_id, f]));

  const CAMPOS: [keyof EspecificacionRow, string][] = [
    ['descripcion', 'Descripción de la actividad'],
    ['ejecucion', 'Ejecución'],
    ['materiales', 'Materiales'],
    ['herramientas_equipo', 'Herramientas y equipo'],
    ['personal', 'Personal'],
    ['ensayos', 'Ensayos a realizar'],
    ['tolerancia', 'Tolerancia para aceptación'],
    ['unidad_medida', 'Unidad de medida'],
    ['unidad_pago', 'Unidad de pago'],
  ];

  return items.map((item) => {
    const especificacion = item.actividad_id ? porActividad.get(item.actividad_id) : undefined;
    return {
      titulo: `${item.codigo ?? item.orden} · ${item.descripcion}`,
      subtitulo: `Unidad ${item.unidad}`,
      columnas: [],
      filas: [],
      textos: CAMPOS.map(([clave, titulo]) => ({
        titulo,
        cuerpo: (especificacion?.[clave] as string | null) ?? '—',
      })),
    };
  });
}

const CONSTRUCTORES: Record<TipoReporte, (proyecto: Proyecto) => Promise<SeccionReporte[]>> = {
  presupuesto: seccionesPresupuesto,
  memorias: seccionesMemorias,
  programacion: seccionesProgramacion,
  insumos: seccionesInsumos,
  apu: seccionesApu,
  especificaciones: seccionesEspecificaciones,
};

export const reportesService = {
  async construir(proyecto: Proyecto, tipo: TipoReporte): Promise<DocumentoReporte> {
    const secciones = await CONSTRUCTORES[tipo](proyecto);
    return {
      titulo: TITULOS[tipo],
      archivo: `${nombreSeguro(proyecto.nombre)}-${tipo}`,
      encabezado: encabezadoProyecto(proyecto),
      secciones,
      pie: `Generado el ${fecha(new Date())}`,
    };
  },
};
