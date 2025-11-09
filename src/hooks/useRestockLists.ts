import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db/indexeddb';
import { RestockService } from '@/lib/services';
import {
  RestockListRepository,
  ProductRepository,
} from '@/lib/db/repositories';
import type { RestockList } from '@/types/inventory.types';

/**
 * Hook para gestionar listas de reposición usando RestockService
 */
export const useRestockLists = (userId = 'default-user') => {
  const [lists, setLists] = useState<RestockList[]>([]);
  const [activeLists, setActiveLists] = useState<RestockList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restockService = new RestockService(
    new RestockListRepository(db),
    new ProductRepository(db)
  );

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const restockRepo = new RestockListRepository(db);
      const [allLists, activeListsData] = await Promise.all([
        restockRepo.findAll(),
        restockRepo.findActive(),
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
    async (name: string) => {
      try {
        const result = await restockService.createList(name, userId);
        if (result.success) {
          await fetchLists();
          return result.data;
        } else {
          setError(result.error?.message || 'Error creando lista');
          throw result.error || new Error('Error creando lista');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error creando lista');
        throw err;
      }
    },
    [restockService, userId, fetchLists]
  );

  const completeItem = useCallback(
    async (listId: string, itemIndex: number) => {
      try {
        const result = await restockService.markItemCompleted(
          listId,
          itemIndex
        );
        if (result.success) {
          await fetchLists();
        } else {
          setError(result.error.message);
          throw result.error;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error completando item');
        throw err;
      }
    },
    [restockService, fetchLists]
  );

  const generateAutomaticList = useCallback(async () => {
    try {
      const result = await restockService.generateAutomaticList(userId);
      if (result.success) {
        await fetchLists();
        return result.data;
      } else {
        setError(result.error.message);
        throw result.error;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error generando lista automática'
      );
      throw err;
    }
  }, [restockService, userId, fetchLists]);

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
    generateAutomaticList,
  };
};
