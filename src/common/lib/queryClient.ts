import { QueryClient } from '@tanstack/react-query';
import { TIEMPOS_CACHE } from '@/common/constants/consultas';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TIEMPOS_CACHE.proyecto,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
