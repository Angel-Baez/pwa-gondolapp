import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db/indexeddb';
import { MaintenanceRepository } from '@/lib/db/repositories';
import type { InventorySummary } from '@/types/inventory.types';

// Re-export hooks for convenience
export { useProducts } from './useProducts';
export { useRestockLists } from './useRestockLists';
export { useStock } from './useStock';
export { useSync } from './useSync';

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
      } catch {
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
 * Hook para limpieza y mantenimiento usando MaintenanceRepository
 */
export const useIndexedDBMaintenance = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const clearAllData = useCallback(async () => {
    setIsClearing(true);
    try {
      const maintenanceRepo = new MaintenanceRepository(db);
      await maintenanceRepo.clearAllTables();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    } finally {
      setIsClearing(false);
    }
  }, []);

  const compactDatabase = useCallback(async () => {
    setIsCompacting(true);
    try {
      const maintenanceRepo = new MaintenanceRepository(db);
      await maintenanceRepo.compactDatabase();
    } catch (error) {
      console.error('Error compacting database:', error);
      throw error;
    } finally {
      setIsCompacting(false);
    }
  }, []);

  const getDatabaseStats = useCallback(async () => {
    try {
      const maintenanceRepo = new MaintenanceRepository(db);
      const dbStats = await maintenanceRepo.getDatabaseStats();
      setStats(dbStats);
      return dbStats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }, []);

  const getInventorySummary =
    useCallback(async (): Promise<InventorySummary> => {
      try {
        const maintenanceRepo = new MaintenanceRepository(db);
        const summary = await maintenanceRepo.getInventorySummary();
        return summary;
      } catch (error) {
        console.error('Error getting inventory summary:', error);
        return {
          totalProducts: 0,
          totalVariants: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalValue: 0,
          lastUpdated: new Date(),
        };
      }
    }, []);

  useEffect(() => {
    getDatabaseStats();
  }, [getDatabaseStats]);

  return {
    isClearing,
    isCompacting,
    stats,
    clearAllData,
    compactDatabase,
    getDatabaseStats,
    getInventorySummary,
  };
};

/**
 * Hook para estadísticas de inventario usando MaintenanceRepository
 */
export const useInventoryStats = () => {
  const [stats, setStats] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const maintenanceRepo = new MaintenanceRepository(db);

      // Obtener resumen completo de inventario
      const inventorySummary = await maintenanceRepo.getInventorySummary();
      const adaptedStats: InventorySummary = inventorySummary;

      setStats(adaptedStats);
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
