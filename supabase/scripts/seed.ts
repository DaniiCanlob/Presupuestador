/**
 * Carga el catalogo global (capitulos, insumos, actividades, APU y especificaciones)
 * a partir de los CSV de supabase/seed.
 *
 *   npm run seed
 *
 * Requiere SUPABASE_URL y SUPABASE_SECRET_KEY en el entorno (.env).
 * Es idempotente: si el catalogo ya esta cargado, no hace nada.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_SEED = resolve(RAIZ, 'seed');
const LOTE = 1000;

// ---------------------------------------------------------------- utilidades
function cargarEnv(): void {
  const archivo = resolve(RAIZ, '..', '.env');
  if (!existsSync(archivo)) return;
  for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const i = limpia.indexOf('=');
    if (i < 0) continue;
    const clave = limpia.slice(0, i).trim();
    if (!process.env[clave]) process.env[clave] = limpia.slice(i + 1).trim();
  }
}

/** Parser CSV minimo con soporte de comillas dobles escapadas. */
export function leerCsv(nombre: string): Record<string, string>[] {
  const texto = readFileSync(resolve(DIR_SEED, nombre), 'utf8');
  const filas: string[][] = [];
  let campo = '';
  let fila: string[] = [];
  let entreComillas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }
    if (c === '"') entreComillas = true;
    else if (c === ',') {
      fila.push(campo);
      campo = '';
    } else if (c === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else if (c !== '\r') {
      campo += c;
    }
  }
  if (campo !== '' || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }

  const encabezado = filas.shift() ?? [];
  return filas
    .filter((f) => f.some((v) => v !== ''))
    .map((f) => Object.fromEntries(encabezado.map((k, i) => [k, f[i] ?? ''])));
}

const numero = (v: string | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const booleano = (v: string | undefined): boolean => v === 'true';
const nulo = (v: string | undefined): string | null => (v && v.trim() !== '' ? v : null);

async function insertarPorLotes<T extends object>(
  db: SupabaseClient,
  tabla: string,
  filas: T[],
): Promise<void> {
  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    const { error } = await db.from(tabla).insert(lote);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    process.stdout.write(`\r  ${tabla}: ${Math.min(i + LOTE, filas.length)}/${filas.length}`);
  }
  process.stdout.write('\n');
}

/** Cuenta las filas de una tabla (solo las del catalogo global si aplica). */
async function contar(db: SupabaseClient, tabla: string, soloGlobal: boolean): Promise<number> {
  let consulta = db.from(tabla).select('*', { count: 'exact', head: true });
  if (soloGlobal) consulta = consulta.is('owner_id', null);
  const { count, error } = await consulta;
  if (error) throw new Error(`${tabla}: ${error.message}`);
  return count ?? 0;
}

/**
 * Carga una tabla solo si hace falta. Si quedo a medias (por ejemplo, se cayo
 * la conexion a mitad del APU) avisa y se detiene, en vez de dar por buena una
 * carga parcial.
 */
async function cargarTabla<T extends object>(
  db: SupabaseClient,
  tabla: string,
  filas: T[],
  soloGlobal = false,
): Promise<void> {
  const existentes = await contar(db, tabla, soloGlobal);

  if (existentes === filas.length) {
    console.log(`  ${tabla.padEnd(20)} ya estaba completa (${existentes} filas)`);
    return;
  }
  if (existentes > 0) {
    throw new Error(
      `${tabla} tiene ${existentes} de ${filas.length} filas: quedo a medias.\n` +
        `   Vacíala en el SQL Editor con:  delete from ${tabla};\n` +
        `   y vuelve a correr npm run seed.`,
    );
  }
  await insertarPorLotes(db, tabla, filas);
}

/** Devuelve un mapa clave -> id leyendo la tabla por paginas. */
async function mapear(
  db: SupabaseClient,
  tabla: string,
  clave: string,
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  for (let desde = 0; ; desde += LOTE) {
    const { data, error } = await db
      .from(tabla)
      .select(`id, ${clave}`)
      .is('owner_id', null)
      .range(desde, desde + LOTE - 1);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    const filas = (data ?? []) as unknown as Record<string, string>[];
    for (const f of filas) mapa.set(f[clave] as string, f.id as string);
    if (filas.length < LOTE) break;
  }
  return mapa;
}

// ---------------------------------------------------------------- proceso
async function principal(): Promise<void> {
  cargarEnv();
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  // sb_secret_... (o la vieja service_role, que sigue funcionando).
  const llave = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el entorno (.env)');
  }

  const db = createClient(url, llave, { auth: { persistSession: false } });

  console.log('Cargando catalogo global...');

  // 1. capitulos
  const capitulos = leerCsv('capitulos.csv');
  await cargarTabla(
    db,
    'capitulos',
    capitulos.map((c) => ({ codigo: c.codigo, nombre: c.nombre, orden: numero(c.orden) })),
    true,
  );
  const mapaCapitulos = await mapear(db, 'capitulos', 'codigo');

  // 2. insumos
  const insumos = leerCsv('insumos.csv');
  await cargarTabla(
    db,
    'insumos',
    insumos.map((i) => ({
      descripcion: i.descripcion,
      unidad: i.unidad || 'Un',
      tipo: i.tipo,
      precio_unitario: numero(i.precio_unitario),
      es_auxiliar: booleano(i.es_auxiliar),
    })),
    true,
  );
  const mapaInsumos = await mapear(db, 'insumos', 'descripcion');

  // 3. componentes de los insumos auxiliares
  const componentes = leerCsv('insumo_auxiliar_items.csv');
  await cargarTabla(
    db,
    'insumo_componentes',
    componentes
      .filter((c) => mapaInsumos.has(c.auxiliar_descripcion!))
      .map((c) => ({
        auxiliar_id: mapaInsumos.get(c.auxiliar_descripcion!)!,
        orden: numero(c.orden),
        grupo: c.grupo,
        tipo: c.tipo,
        insumo_id: mapaInsumos.get(c.insumo_descripcion!) ?? null,
        descripcion: c.insumo_descripcion,
        unidad: nulo(c.unidad),
        cantidad: numero(c.cantidad),
        precio_unitario: numero(c.precio_unitario),
        es_porcentaje: booleano(c.es_porcentaje),
      })),
  );

  // 4. actividades
  const actividades = leerCsv('actividades.csv');
  await cargarTabla(
    db,
    'actividades',
    actividades.map((a) => ({
      codigo: a.codigo,
      capitulo_id: mapaCapitulos.get(a.capitulo_codigo!) ?? null,
      descripcion: a.descripcion,
      unidad: a.unidad || 'Un',
      valor_unitario: numero(a.valor_unitario),
      orden: numero(a.orden),
    })),
    true,
  );
  const mapaActividades = await mapear(db, 'actividades', 'codigo');

  // 5. APU
  const apu = leerCsv('apu_items.csv');
  await cargarTabla(
    db,
    'apu_items',
    apu
      .filter((r) => mapaActividades.has(r.actividad_codigo!))
      .map((r) => ({
        actividad_id: mapaActividades.get(r.actividad_codigo!)!,
        orden: numero(r.orden),
        grupo: r.grupo,
        tipo: r.tipo,
        insumo_id: mapaInsumos.get(r.insumo_descripcion!) ?? null,
        descripcion: r.insumo_descripcion,
        unidad: nulo(r.unidad),
        cantidad: numero(r.cantidad),
        precio_unitario: numero(r.precio_unitario),
        es_porcentaje: booleano(r.es_porcentaje),
      })),
  );

  // 6. especificaciones tecnicas
  const especificaciones = leerCsv('especificaciones.csv');
  await cargarTabla(
    db,
    'especificaciones',
    especificaciones
      .filter((e) => mapaActividades.has(e.actividad_codigo!))
      .map((e) => ({
        actividad_id: mapaActividades.get(e.actividad_codigo!)!,
        titulo: nulo(e.titulo),
        descripcion: nulo(e.descripcion),
        ejecucion: nulo(e.ejecucion),
        materiales: nulo(e.materiales),
        herramientas_equipo: nulo(e.herramientas_equipo),
        personal: nulo(e.personal),
        ensayos: nulo(e.ensayos),
        tolerancia: nulo(e.tolerancia),
        unidad_medida: nulo(e.unidad_medida),
        unidad_pago: nulo(e.unidad_pago),
      })),
  );

  console.log('\nCatalogo cargado.');
}

// Solo se ejecuta cuando se invoca el archivo directamente (npm run seed).
// Se normalizan las barras: en Windows process.argv[1] llega con "\".
const invocado = process.argv[1]?.replace(/\\/g, '/').split('/').pop();
if (invocado && import.meta.url.replace(/\\/g, '/').endsWith(invocado)) {
  principal().catch((e: unknown) => {
    console.error('\nError cargando el catalogo:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
