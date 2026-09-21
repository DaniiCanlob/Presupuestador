import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/common/lib/cn';

type Tono = 'exito' | 'error' | 'info';

interface Aviso {
  id: number;
  tono: Tono;
  texto: string;
}

interface ContextoNotificaciones {
  notificar: (texto: string, tono?: Tono) => void;
}

const Contexto = createContext<ContextoNotificaciones | null>(null);

const COLOR_ICONO: Record<Tono, string> = {
  exito: 'text-exito',
  error: 'text-destructive',
  info: 'text-marca',
};

const ICONOS: Record<Tono, typeof Info> = {
  exito: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ProveedorNotificaciones({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const notificar = useCallback((texto: string, tono: Tono = 'exito') => {
    const id = Date.now() + Math.random();
    setAvisos((previos) => [...previos, { id, tono, texto }]);
    setTimeout(() => setAvisos((previos) => previos.filter((a) => a.id !== id)), 4000);
  }, []);

  const valor = useMemo(() => ({ notificar }), [notificar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {avisos.map((aviso) => {
          const Icono = ICONOS[aviso.tono];
          return (
            <div
              key={aviso.id}
              role="status"
              className="vidrio pointer-events-auto flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
            >
              <Icono className={cn('mt-0.5 h-4 w-4 shrink-0', COLOR_ICONO[aviso.tono])} aria-hidden />
              <span className="flex-1 text-foreground">{aviso.texto}</span>
              <button
                type="button"
                onClick={() => setAvisos((p) => p.filter((a) => a.id !== aviso.id))}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Cerrar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}

export function useNotificar(): ContextoNotificaciones['notificar'] {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useNotificar debe usarse dentro de ProveedorNotificaciones');
  return contexto.notificar;
}
