import { useMatches } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights, computeRoute } from '@vercel/speed-insights/react';

/**
 * Las URLs de la app llevan el id del proyecto y de la actividad:
 * /proyectos/8f3a-…/presupuesto. Si eso se manda tal cual, el panel de Vercel
 * muestra una fila distinta por cada proyecto (inservible) y ademas los
 * identificadores salen de la app sin necesidad.
 *
 * computeRoute cambia cada valor por el nombre del parametro, asi que las dos
 * herramientas reciben siempre el patron: /proyectos/[proyectoId]/presupuesto.
 */
function usarRuta(): string {
  const coincidencias = useMatches();
  // useMatches trae todos los tramos; el ultimo es el que tiene los parametros.
  const ultima = coincidencias.at(-1);
  const params = (ultima?.params ?? {}) as Record<string, string>;

  // La ruta comodin '*' daria '/[*]' para cualquier URL inventada; '/404'
  // se lee mejor en el panel y agrupa igual.
  if (params['*'] !== undefined) return '/404';

  const ruta = computeRoute(ultima?.pathname ?? null, params);
  return ruta ?? ultima?.pathname ?? '/';
}

/** Deja la URL en el patron de ruta: sin ids y sin query. */
function sinIdentificadores(url: string, ruta: string): string {
  try {
    const dir = new URL(url);
    dir.pathname = ruta;
    dir.search = '';
    dir.hash = '';
    return dir.toString();
  } catch {
    return ruta;
  }
}

/**
 * Metricas de Vercel. Hay que habilitarlas en el panel del proyecto
 * (Analytics y Speed Insights); si no, el script responde 404 y no se guarda nada.
 * En local no envian: registran en consola.
 */
export function Telemetria() {
  const ruta = usarRuta();

  return (
    <>
      <Analytics route={ruta} path={ruta} />
      <SpeedInsights
        route={ruta}
        beforeSend={(evento) => ({ ...evento, url: sinIdentificadores(evento.url, ruta) })}
      />
    </>
  );
}
