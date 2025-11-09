'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

/**
 * Indicador de estado PWA (offline/online y actualizaciones)
 * Posicionado de forma fija para visibilidad constante
 */
export function PWAStatusIndicator() {
  const { isOnline, isUpdateAvailable, reloadApp } = usePWA();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {/* Indicador de conectividad */}
      <Badge
        variant={isOnline ? 'default' : 'destructive'}
        className="touch-target-44 gap-1 text-xs"
        aria-label={
          isOnline ? 'Conectado a internet' : 'Sin conexión a internet'
        }
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" aria-hidden="true" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" aria-hidden="true" />
            Offline
          </>
        )}
      </Badge>

      {/* Notificación de actualización disponible */}
      {isUpdateAvailable && (
        <Button
          onClick={reloadApp}
          size="sm"
          className="touch-target-44 gap-2 text-xs"
          aria-label="Actualizar aplicación"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Actualizar App
        </Button>
      )}
    </div>
  );
}
