import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/common/lib/queryClient';
import { ProveedorNotificaciones } from '@/common/ui/Notificaciones';
import { router } from '@/app/router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProveedorNotificaciones>
        <RouterProvider router={router} />
      </ProveedorNotificaciones>
    </QueryClientProvider>
  );
}
