# Presupuestador PRO

Presupuestos de obra sobre React + Supabase: catálogo de actividades con APU,
memorias de cantidades, programación con Gantt y curva S, resumen de insumos,
especificaciones técnicas, actas de avance y bitácora. Cada usuario ve solo sus
proyectos.

Es la versión web del Excel **PRESUPUESTADOR PRO 2026**, con su catálogo
migrado completo:

| | |
|---|---:|
| Capítulos | 34 |
| Actividades | 2.288 |
| Líneas de APU | 18.603 |
| Insumos | 2.156 (80 auxiliares, con 537 componentes) |
| Especificaciones técnicas | 2.288 |

El valor unitario de cada actividad importada cuadra exactamente con la suma de
su APU.

---

## 1. Puesta en marcha

### Requisitos

- Node 18 o superior
- **pnpm** como gestor de paquetes (fijado en `packageManager`; `corepack enable`
  lo activa con la versión correcta, no hace falta instalarlo aparte)
- Un proyecto de [Supabase](https://supabase.com) (el plan gratuito alcanza)

> pnpm no corre los scripts de instalación de las dependencias salvo los
> aprobados en `pnpm-workspace.yaml`. Si algún día agregas un paquete que
> necesite compilar, pnpm avisa y lo apruebas con `pnpm approve-builds`.

### Pasos

```bash
corepack enable          # habilita pnpm sin instalarlo a mano
pnpm install
cp .env.example .env     # y completa los valores
```

**`.env`:**

```ini
# Llave publicable: viaja al navegador, la protege el RLS.
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Llave secreta: salta el RLS. Solo la usa `pnpm seed`, en tu máquina.
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Las llaves están en el panel de Supabase, en *Settings → API Keys*; la URL, en
*Settings → Data API*. Los nombres viejos (`VITE_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) también funcionan.

**Base de datos.** En el SQL Editor de Supabase, ejecuta en orden los archivos
de `supabase/migrations/`, o pega de una vez `supabase/esquema-completo.sql`
(es la concatenación de todos, para instalaciones nuevas):

| Archivo | Qué crea |
|---|---|
| `0001_extensiones.sql` | extensiones, enums y utilidades (`normalizar`, `tocar_updated_at`) |
| `0002_catalogo.sql` | capítulos, insumos, actividades, APU, especificaciones, precios propios |
| `0003_proyectos.sql` | perfiles, proyectos, presupuesto, memorias, programación, actas, bitácora, documentos |
| `0004_rls.sql` | permisos y políticas de Row Level Security |
| `0005_funciones.sql` | funciones de negocio (RPC) |
| `0006_storage.sql` | buckets de documentos y logos con sus políticas |
| `0007_fechas_y_plazo.sql` | separa el plazo contractual del fin que calcula la programación |

Con el CLI de Supabase es un solo comando:

```bash
supabase link --project-ref <tu-ref>
supabase db push
```

**Catálogo.** Con la llave secreta ya en el `.env`:

```bash
pnpm seed
```

Sube ~24.000 filas desde los CSV de `supabase/seed/` (un par de minutos). Es
resumible: si se corta a mitad, al volver a ejecutarlo te dice qué tabla quedó
incompleta y cómo limpiarla, en vez de dar por buena una carga parcial.

**A correr:**

```bash
pnpm dev
```

En Supabase, *Authentication → Providers → Email*: si dejas activada la
confirmación por correo, el registro pide confirmar antes del primer ingreso.

### Scripts

| Comando | Para qué |
|---|---|
| `pnpm dev` | servidor de desarrollo |
| `pnpm build` | typecheck + build de producción en `dist/` |
| `pnpm preview` | sirve el build para revisarlo |
| `pnpm typecheck` | solo TypeScript, sin generar nada |
| `pnpm seed` | carga el catálogo global |
| `pnpm gen:types` | regenera `database.types.ts` desde el proyecto enlazado (requiere el CLI) |

No hay linter configurado todavía; el `typecheck` es la red de seguridad.

---

## 2. Del Excel a la app

| Hoja del Excel | Dónde quedó |
|---|---|
| PRESUPUESTO | `proyectos` + `presupuesto_items` → pestaña **Presupuesto** |
| ACTIVIDADES | `actividades` (catálogo global) → **Catálogo › Actividades** |
| APU / APU AUXILIARES | `apu_items` / `insumo_componentes` → detalle de cada actividad |
| MATERIALES | `insumos` → **Catálogo › Insumos** |
| ESPECIFICACIONES TECNICAS | `especificaciones` → pestaña **Especificaciones** |
| MEMORIAS DE CANTIDADES | `memoria_items` → pestaña **Memorias** |
| PROGRAMACION | `programacion_items` → pestaña **Programación** (tabla, Gantt y curva S) |
| RESUMEN DE INSUMOS | RPC `resumen_insumos` → pestaña **Insumos** |
| APU PROYECTO / ESPECIFICACIONES PROYECTO | vistas derivadas del presupuesto |
| LISTAS, MENU, macros VBA | reemplazados por los buscadores y los botones de cada pestaña |

### Lo que no estaba en el Excel

- **AIU e IVA sobre la utilidad**, anticipo y totales calculados en la base.
- **Precios propios por usuario** (`precios_insumo`): ajustas el precio de un
  insumo del catálogo sin duplicar sus 2.156 filas, y los APU se recalculan.
- **Catálogo propio**: actividades e insumos tuyos conviven con el global;
  puedes copiar una actividad del catálogo y editarle el APU.
- **Actas de avance** con cantidades ejecutadas por periodo, que alimentan la
  curva S y el avance del contrato.
- **Bitácora de obra** (fecha, clima, personal, actividades, observaciones).
- **Archivos**: fotos y PDF por actividad, y logo de la empresa, en Storage.
- **Duplicar proyecto** (presupuesto y memorias incluidos) como plantilla.
- Exportación a **PDF y Excel** de los seis reportes, más impresión directa.
- **Tema claro y oscuro**.

---

## 3. Cómo está organizado el código

```
src/
├── app/                    App, router y layouts (público, privado, proyecto)
├── common/
│   ├── constants/          rutas, claves de caché, catálogos, mensajes, formatos
│   ├── types/              tipos de base de datos, API, catálogo, proyecto, reportes
│   ├── lib/                supabase, cálculos, formato, texto, errores, paginación
│   ├── hooks/              useDebounce, useListado, useTema
│   └── ui/                 botones, campos, tabla, modal, notificaciones…
└── features/               auth · perfil · catalogo · proyectos · presupuesto ·
                            memorias · programacion · insumos-proyecto · actas ·
                            bitacora · documentos · reportes

supabase/
├── migrations/             el esquema, en orden
├── scripts/seed.ts         carga del catálogo
└── seed/*.csv              el catálogo extraído del Excel

pnpm-workspace.yaml         ajustes de pnpm (aprobación de scripts de instalación)
.gitattributes              finales de línea LF, binarios y archivos generados
```

Cada *feature* mantiene la misma separación: `services/` (acceso a Supabase),
`hooks/` (TanStack Query), `components/` y `pages/`. Los tipos viven en
`common/types/` y las constantes en `common/constants/`: ningún servicio define
valores fijos en línea.

### Diseño

El tema vive en `src/index.css`: tokens en OKLCH (`--background`, `--primary`,
`--marca`, `--serie-a`…) expuestos como utilidades de Tailwind v4 con
`@theme inline`. Cambiar la marca es cambiar esos valores; ningún componente
tiene un color escrito a mano.

- **Claro y oscuro** comparten origen cálido. El selector (sistema / claro /
  oscuro) está en la barra superior y el tema se aplica antes del primer
  pintado, así que no hay destello al recargar.
- **El vidrio se reserva** para lo que flota: barra superior, pestañas, modales,
  avisos y paneles de resumen (`.vidrio`). Las tablas van sobre superficie
  sólida (`.panel`), porque tras un número traslúcido se lee peor.
- **Los colores de la curva S** salen de `--serie-a` / `--serie-b`, validados
  para daltonismo contra el fondo de cada modo (ΔE 24–29, el mínimo es 8).
- Tipografías: Hanken Grotesk para títulos, Inter para texto, JetBrains Mono
  para cifras (las columnas de dinero quedan alineadas).
- Se respeta `prefers-reduced-motion` y hay hoja de impresión sin vidrios.

### Rendimiento

- Todas las páginas se cargan con `React.lazy`; jsPDF y ExcelJS solo se
  descargan cuando exportas.
- Los listados van paginados en servidor con `count: 'exact'` y búsqueda por
  trigramas sobre columnas `busqueda` generadas (minúsculas y sin tildes), con
  índice GIN.
- El catálogo se cachea 30 minutos; los datos de proyecto, 30 segundos.
- Los cálculos pesados (resumen de insumos, totales, programación) corren en
  Postgres, no en el navegador.

---

## 4. Reglas de negocio que conviene conocer

- **La memoria manda sobre la cantidad.** Al escribir filas en la memoria, un
  trigger actualiza `presupuesto_items.cantidad`. Si escribes la cantidad a mano
  en el presupuesto, esa actividad deja de sincronizarse
  (`cantidad_desde_memoria`). Como en el Excel, los campos vacíos de
  largo/ancho/alto/veces cuentan como 1.
- **El precio del presupuesto es una foto.** Al agregar una actividad se copian
  código, descripción, unidad y valor unitario, así que un cambio posterior de
  precios no reescribe presupuestos viejos. El botón *Actualizar precios* los
  vuelve a traer cuando tú quieras.
- **El rendimiento sale del APU.** En el APU la cuadrilla se expresa en días por
  unidad, así que el rendimiento sugerido es `1 / días`. `programar_proyecto`
  encadena las actividades respetando los días laborables por semana.
- **El plazo y la programación son dos cosas distintas.**
  `proyectos.fecha_fin` es el **fin del plazo contractual**: se deriva de
  `fecha_inicio + plazo_dias − 1` (días calendario, primer día incluido), y un
  trigger mantiene los tres campos coherentes en ambos sentidos. El fin del
  cronograma vive en `programacion_items` y se compara con el plazo en la
  pestaña Programación y en el reporte. `programar_proyecto` no toca el plazo.
- **El APU del catálogo global no se recalcula.** El trigger que suma el APU
  solo toca actividades con dueño, para que la base importada conserve el valor
  original.

### Funciones disponibles (RPC)

| Función | Para qué |
|---|---|
| `valor_unitario_actividad(actividad)` | valor del APU aplicando tus precios propios |
| `rendimiento_sugerido(actividad)` | unidades/día a partir de la mano de obra |
| `agregar_actividades_presupuesto(proyecto, actividades[], cantidad)` | agrega con foto de precio |
| `actualizar_precios_presupuesto(proyecto)` | refresca los valores unitarios |
| `totales_proyecto(proyecto)` | costo directo, AIU, IVA, total y anticipo |
| `resumen_insumos(proyecto)` | explota el APU por las cantidades de obra |
| `programar_proyecto(proyecto)` | duraciones y fechas en cascada |
| `fechas_proyecto(proyecto)` | plazo contractual contra fin de la programación |
| `avance_proyecto(proyecto)` | avance ejecutado sobre el valor del contrato |
| `duplicar_proyecto(proyecto, nombre)` | copia proyecto, presupuesto y memorias |

---

## 5. Seguridad

Cada usuario ve y edita **solo sus proyectos**; el catálogo global es de lectura
para todos y cada quien escribe únicamente sus propias filas (`owner_id`). Todo
está en políticas de RLS (`0004_rls.sql`), verificadas con dos usuarios: el
segundo no ve los proyectos del primero, no modifica el catálogo global y no ve
las actividades propias del otro. En Storage, cada quien solo alcanza los
archivos bajo su carpeta `<uid>/`.

La llave secreta (`sb_secret_…`) solo se usa en `pnpm seed`, desde tu
máquina, y está en `.gitignore`. La app solo lleva la publicable
(`sb_publishable_…`), que está pensada para ser pública y depende del RLS.

---

## 6. Si algo falla

**«Could not embed because more than one relationship was found»**
Una tabla con dos claves foráneas al mismo destino: PostgREST no adivina cuál
quieres. Pasa con `programacion_items` (`presupuesto_item_id` y
`predecesor_item_id`). Se resuelve nombrando la columna en el select:
`presupuesto_items!presupuesto_item_id(...)`.

**El seed dice que una tabla quedó a medias**
Vacíala en el SQL Editor (`delete from apu_items;`, por ejemplo) y vuelve a
correr `pnpm seed`. El script no continúa sobre una carga parcial a propósito.

**El fin del contrato no coincide con lo que esperabas**
Revisa `plazo_dias`: el fin se calcula como inicio + plazo − 1 en días
calendario. Si tus contratos cuentan desde el día siguiente al acta de inicio,
hay que ajustar `sincronizar_plazo_proyecto` en `0007`.

**Las fuentes no cargan**
Vienen de Google Fonts por `<link>` en `index.html`. Sin red se cae a las del
sistema y la app sigue funcionando.
