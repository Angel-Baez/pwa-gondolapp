import { useState, useEffect, useCallback } from 'react';
import {
  db,
  ProductSearchService,
  RestockService,
  StockService,
  DatabaseUtilsService,
} from '@/lib/db/indexeddb';
import type {
  Product,
  RestockList,
  InventorySummary,
  SyncOperation,
} from '@/types/inventory.types';

/**
 * Hook para gestionar el estado de IndexedDB de forma reactiva
 */
export const useIndexedDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Inicializar base de datos
  useEffect(() => {
    const initDB = async () => {
      try {
        await db.open();
        setIsInitialized(true);
      } catch (error) {
        // Error handling - mostrar en UI si es necesario
        setIsInitialized(false);
      }
    };

    initDB();
  }, []);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isInitialized,
    isOnline,
    syncInProgress,
    lastSyncTime,
    setSyncInProgress,
    setLastSyncTime,
  };
};

/**
 * Hook para buscar productos
 */
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.products.where('isActive').equals(1).toArray();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductSearchService.searchByText(query);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error buscando productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const findByBarcode = useCallback(async (barcode: string) => {
    try {
      return await ProductSearchService.findByBarcode(barcode);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error buscando por código'
      );
      return null;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    searchProducts,
    findByBarcode,
  };
};

/**
 * Hook para gestionar listas de reposición
 */
export const useRestockLists = () => {
  const [lists, setLists] = useState<RestockList[]>([]);
  const [activeLists, setActiveLists] = useState<RestockList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [allLists, activeListsData] = await Promise.all([
        db.restockLists.orderBy('createdAt').reverse().toArray(),
        RestockService.getActiveLists(),
      ]);

      setLists(allLists);
      setActiveLists(activeListsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando listas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createList = useCallback(
    async (name: string, items: any[]) => {
      try {
        const listId = await RestockService.createList(name, items);
        await fetchLists();
        return listId;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creando lista');
        throw err;
      }
    },
    [fetchLists]
  );

  const completeItem = useCallback(
    async (listId: string, itemIndex: number, actualQuantity?: number) => {
      try {
        await RestockService.completeItem(listId, itemIndex, actualQuantity);
        await fetchLists();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error completando item');
        throw err;
      }
    },
    [fetchLists]
  );

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return {
    lists,
    activeLists,
    loading,
    error,
    refetch: fetchLists,
    createList,
    completeItem,
  };
};

/**
 * Hook para gestionar stock
 */
export const useStock = () => {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [lowStock, expiring] = await Promise.all([
        ProductSearchService.getBelowMinStock(),
        ProductSearchService.getExpiring(),
      ]);

      setLowStockItems(lowStock);
      setExpiringItems(expiring);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error cargando datos de stock'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStock = useCallback(
    async (
      variantId: string,
      newStock: number,
      movementType: 'restock' | 'discard' | 'adjustment',
      reason?: string,
      userId?: string
    ) => {
      try {
        await StockService.updateVariantStock(
          variantId,
          newStock,
          movementType,
          reason,
          userId
        );
        await fetchStockData();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error actualizando stock'
        );
        throw err;
      }
    },
    [fetchStockData]
  );

  const generateSuggestions = useCallback(async () => {
    try {
      return await DatabaseUtilsService.generateRestockSuggestions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error generando sugerencias'
      );
      return [];
    }
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  return {
    lowStockItems,
    expiringItems,
    loading,
    error,
    refetch: fetchStockData,
    updateStock,
    generateSuggestions,
  };
};

/**
 * Hook para estadísticas de inventario
 */
export const useInventoryStats = () => {
  const [stats, setStats] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DatabaseUtilsService.getStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error cargando estadísticas'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Actualizar estadísticas cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

/**
 * Hook para gestionar sincronización
 */
export const useSync = () => {
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(
    []
  );
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOperations = useCallback(async () => {
    try {
      const operations = await StockService.getPendingOperations();
      setPendingOperations(operations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error cargando operaciones pendientes'
      );
    }
  }, []);

  const markAsSynced = useCallback(
    async (operationId: string) => {
      try {
        await StockService.markAsSynced(operationId);
        await fetchPendingOperations();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error marcando como sincronizado'
        );
      }
    },
    [fetchPendingOperations]
  );

  const incrementRetries = useCallback(
    async (operationId: string, errorMessage?: string) => {
      try {
        await StockService.incrementRetries(operationId, errorMessage);
        await fetchPendingOperations();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error incrementando reintentos'
        );
      }
    },
    [fetchPendingOperations]
  );

  useEffect(() => {
    fetchPendingOperations();
  }, [fetchPendingOperations]);

  return {
    pendingOperations,
    loading,
    error,
    refetch: fetchPendingOperations,
    markAsSynced,
    incrementRetries,
  };
};

/**
 * Hook para limpieza y mantenimiento
 */
export const useMaintenance = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  const runCleanup = useCallback(async () => {
    try {
      setIsRunning(true);
      await DatabaseUtilsService.cleanupOldData();
      setLastCleanup(new Date());
    } catch (error) {
      // Error handling - podría mostrar en toast
      setIsRunning(false);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      const data = await DatabaseUtilsService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gondolapp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Error handling - podría mostrar en toast
      throw new Error('Error exportando datos');
    }
  }, []);

  // Ejecutar limpieza automática cada 24 horas
  useEffect(() => {
    const interval = setInterval(runCleanup, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runCleanup]);

  return {
    isRunning,
    lastCleanup,
    runCleanup,
    exportData,
  };
};
