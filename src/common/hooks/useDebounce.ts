import { useEffect, useState } from 'react';
import { RETARDO_BUSQUEDA_MS } from '@/common/constants/catalogo';

export function useDebounce<T>(valor: T, retardo = RETARDO_BUSQUEDA_MS): T {
  const [diferido, setDiferido] = useState(valor);

  useEffect(() => {
    const t = setTimeout(() => setDiferido(valor), retardo);
    return () => clearTimeout(t);
  }, [valor, retardo]);

  return diferido;
}
