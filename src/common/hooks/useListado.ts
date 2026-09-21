import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/common/hooks/useDebounce';
import { TAMANO_PAGINA } from '@/common/constants/catalogo';

interface EstadoListado<F> {
  busqueda: string;
  setBusqueda: (v: string) => void;
  pagina: number;
  setPagina: (p: number) => void;
  filtros: F;
  aplicarFiltros: (parcial: Partial<F>) => void;
  parametros: F & { busqueda: string; pagina: number; tamano: number };
}

/**
 * Estado compartido por todos los listados: busqueda con retardo, pagina y
 * filtros. Al cambiar la busqueda o un filtro vuelve a la pagina 1.
 */
export function useListado<F extends object>(
  filtrosIniciales: F,
  tamano = TAMANO_PAGINA,
): EstadoListado<F> {
  const [busqueda, setBusquedaBruta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState<F>(filtrosIniciales);
  const busquedaDiferida = useDebounce(busqueda);

  const setBusqueda = useCallback((v: string) => {
    setBusquedaBruta(v);
    setPagina(1);
  }, []);

  const aplicarFiltros = useCallback((parcial: Partial<F>) => {
    setFiltros((previos) => ({ ...previos, ...parcial }));
    setPagina(1);
  }, []);

  const parametros = useMemo(
    () => ({ ...filtros, busqueda: busquedaDiferida, pagina, tamano }),
    [filtros, busquedaDiferida, pagina, tamano],
  );

  return { busqueda, setBusqueda, pagina, setPagina, filtros, aplicarFiltros, parametros };
}
