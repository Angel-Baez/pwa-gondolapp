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
import { useToast } from '@/hooks/use-toast';
import { Database, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CacheInfo {
  cacheNames: string[];
  totalCachedItems: number;
}

/**
 * Componente para gestionar el cache de la PWA
 * Permite ver el estado del cache y limpiarlo si es necesario
 */
export function PWACacheManager() {
  const { getCacheStatus, clearCache } = usePWA();
  const { toast } = useToast();
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const loadCacheInfo = async () => {
    try {
      const info = await getCacheStatus();
      setCacheInfo(info);
    } catch (error) {
      // Error handling - podría mostrar un toast si es necesario
      setCacheInfo({ cacheNames: [], totalCachedItems: 0 });
    }
  };

  useEffect(() => {
    loadCacheInfo();
  }, [loadCacheInfo]);

  const handleClearCache = async () => {
    setIsClearing(true);

    try {
      await clearCache();
      await loadCacheInfo();

      toast({
        title: 'Cache limpiado',
        description: 'Se ha liberado espacio de almacenamiento',
      });

      // Feedback háptico
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo limpiar el cache',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (!cacheInfo) {
    return null;
  }

  return (
    <Card className="mx-4 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" aria-hidden="true" />
          Almacenamiento Local
        </CardTitle>
        <CardDescription className="text-xs">
          Gestiona el cache offline de la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          <p>Elementos en cache: {cacheInfo.totalCachedItems}</p>
          <p>Stores activos: {cacheInfo.cacheNames.length}</p>
        </div>

        {cacheInfo.totalCachedItems > 0 && (
          <Button
            onClick={handleClearCache}
            disabled={isClearing}
            size="sm"
            variant="outline"
            className="touch-target-44 w-full gap-2"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {isClearing ? 'Limpiando...' : 'Limpiar Cache'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
