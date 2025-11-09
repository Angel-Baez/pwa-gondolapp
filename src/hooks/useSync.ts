import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db/indexeddb';
import { SyncService } from '@/lib/services';
import {
  SyncRepository,
  ProductRepository,
  RestockListRepository,
} from '@/lib/db/repositories';
import type { SyncOperation } from '@/types/inventory.types';

/**
 * Hook para gestionar sincronización usando SyncService
 */
export const useSync = () => {
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const syncService = new SyncService(
    new SyncRepository(db),
    new ProductRepository(db),
    new RestockListRepository(db)
  );

  const fetchPendingOperations = useCallback(async () => {
    try {
      setLoading(true);
      const syncRepo = new SyncRepository(db);
      const operations = await syncRepo.findPending();
      setPendingOperations(operations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error cargando operaciones pendientes'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const result = await syncService.getSyncStatus();
      if (result.success) {
        setSyncStatus(result.data);
      } else {
        setError(result.error?.message || 'Error obteniendo estado de sync');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error obteniendo estado de sync'
      );
    }
  }, [syncService]);

  const syncAll = useCallback(async () => {
    try {
      setLoading(true);
      const result = await syncService.syncAll();
      if (result.success) {
        await fetchPendingOperations();
        await fetchSyncStatus();
        return result.data;
      } else {
        setError(result.error.message);
        throw result.error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en sincronización');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [syncService, fetchPendingOperations, fetchSyncStatus]);

  const retryFailedOperations = useCallback(async () => {
    try {
      const result = await syncService.retryFailedOperations();
      if (result.success) {
        await fetchPendingOperations();
        return result.data;
      } else {
        setError(result.error.message);
        throw result.error;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error reintentando operaciones'
      );
      throw err;
    }
  }, [syncService, fetchPendingOperations]);

  useEffect(() => {
    fetchPendingOperations();
    fetchSyncStatus();
  }, [fetchPendingOperations, fetchSyncStatus]);

  return {
    pendingOperations,
    syncStatus,
    loading,
    error,
    refetch: fetchPendingOperations,
    syncAll,
    retryFailedOperations,
  };
};
