import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'oscuro' | 'sistema';

const CLAVE = 'tema';

const leerGuardado = (): Tema => {
  try {
    const valor = localStorage.getItem(CLAVE);
    return valor === 'claro' || valor === 'oscuro' ? valor : 'sistema';
  } catch {
    return 'sistema';
  }
};

const aplicar = (tema: Tema): void => {
  const oscuroSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const oscuro = tema === 'oscuro' || (tema === 'sistema' && oscuroSistema);
  document.documentElement.classList.toggle('dark', oscuro);
};

/**
 * Tema con tres estados. El script de index.html ya aplico el correcto antes
 * del primer pintado; aqui solo se mantiene sincronizado.
 */
export function useTema(): { tema: Tema; cambiar: (tema: Tema) => void; siguiente: () => void } {
  const [tema, setTema] = useState<Tema>(leerGuardado);

  useEffect(() => {
    aplicar(tema);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const alCambiarSistema = (): void => {
      if (tema === 'sistema') aplicar('sistema');
    };
    media.addEventListener('change', alCambiarSistema);
    return () => media.removeEventListener('change', alCambiarSistema);
  }, [tema]);

  const cambiar = useCallback((nuevo: Tema) => {
    setTema(nuevo);
    try {
      if (nuevo === 'sistema') localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, nuevo);
    } catch {
      /* sin almacenamiento: el tema dura lo que la pestaña */
    }
  }, []);

  const siguiente = useCallback(() => {
    setTema((actual) => {
      const orden: Tema[] = ['sistema', 'claro', 'oscuro'];
      const proximo = orden[(orden.indexOf(actual) + 1) % orden.length] ?? 'sistema';
      try {
        if (proximo === 'sistema') localStorage.removeItem(CLAVE);
        else localStorage.setItem(CLAVE, proximo);
      } catch {
        /* sin almacenamiento */
      }
      return proximo;
    });
  }, []);

  return { tema, cambiar, siguiente };
}
