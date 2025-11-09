'use client';

import { useEffect, useState } from 'react';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
}

/**
 * Hook para gestionar el estado PWA
 * Maneja instalación, conectividad y actualizaciones
 */
// Helper functions
const checkInstallationStatus = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
};

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const handleConnectivityChange = (
  isOnline: boolean,
  setPWAState: React.Dispatch<React.SetStateAction<PWAState>>
) => {
  setPWAState(prev => ({ ...prev, isOnline }));
  vibrate(isOnline ? 50 : [100, 50, 100]);
};

export function usePWA() {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isUpdateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(
    null
  );

  useEffect(() => {
    // Verificar si la PWA está instalada
    const checkInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: checkInstallationStatus(),
      }));
    };

    // Manejar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallPrompt);
      setPWAState(prev => ({ ...prev, isInstallable: true }));
    };

    // Configurar listeners de conectividad
    const setupConnectivityListeners = () => {
      const handleOnline = () => handleConnectivityChange(true, setPWAState);
      const handleOffline = () => handleConnectivityChange(false, setPWAState);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return { handleOnline, handleOffline };
    };

    // Configurar listeners de service worker
    const setupServiceWorkerListeners = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setPWAState(prev => ({ ...prev, isUpdateAvailable: true }));
        });

        navigator.serviceWorker.ready.then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  setPWAState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        });
      }
    };

    checkInstalled();
    setupServiceWorkerListeners();
    const { handleOnline, handleOffline } = setupConnectivityListeners();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    setPWAState(prev => ({ ...prev, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Instalar la PWA
   * @returns Promise<boolean> - true si se instaló exitosamente
   */
  const installPWA = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setPWAState(prev => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
        setDeferredPrompt(null);
        vibrate([50, 50, 50]);
        return true;
      }

      return false;
    } catch (error) {
      throw new Error('Error installing PWA');
    }
  };

  /**
   * Recargar la aplicación para aplicar actualizaciones
   */
  const reloadApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  /**
   * Verificar el estado de la cache
   */
  const getCacheStatus = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const totalSize = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return keys.length;
        })
      );

      return {
        cacheNames,
        totalCachedItems: totalSize.reduce((sum, count) => sum + count, 0),
      };
    }

    return { cacheNames: [], totalCachedItems: 0 };
  };

  /**
   * Limpiar cache (excepto cache crítica)
   */
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const criticalCaches = ['next-static-assets', 'daily-lists'];

      await Promise.all(
        cacheNames
          .filter(
            name => !criticalCaches.some(critical => name.includes(critical))
          )
          .map(name => caches.delete(name))
      );
    }
  };

  return {
    ...pwaState,
    installPWA,
    reloadApp,
    getCacheStatus,
    clearCache,
  };
}
