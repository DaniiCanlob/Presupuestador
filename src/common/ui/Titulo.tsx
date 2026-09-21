/**
 * Título de la pestaña por página. React 19 sube `<title>` y `<meta>` al head
 * solo, así que no hace falta una librería para esto.
 */
export function Titulo({ children, descripcion }: { children: string; descripcion?: string }) {
  return (
    <>
      <title>{`${children} · Presupuestador PRO`}</title>
      {descripcion && <meta name="description" content={descripcion} />}
    </>
  );
}
