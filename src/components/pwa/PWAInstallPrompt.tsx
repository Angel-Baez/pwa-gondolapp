'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';
import { Download, Smartphone, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Componente para mostrar el prompt de instalación PWA
 * Se muestra solo cuando la app es instalable y no está instalada
 */
export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // No mostrar si no es instalable, ya está instalada o fue descartada
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installPWA();
    if (!success) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);

    // Feedback háptico para descarte
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  return (
    <Card
      className="touch-target-44 mx-4 mt-4 border-primary/20 bg-primary/5"
      role="banner"
      aria-labelledby="pwa-install-title"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle id="pwa-install-title" className="text-sm">
              Instalar GondolApp
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="touch-target-44 h-6 w-6 p-0"
            aria-label="Cerrar prompt de instalación"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Instala la app para acceso rápido y mejor experiencia offline
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={handleInstall}
          size="sm"
          className="touch-target-44 w-full gap-2"
          aria-describedby="pwa-install-title"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Instalar App
        </Button>
      </CardContent>
    </Card>
  );
}
