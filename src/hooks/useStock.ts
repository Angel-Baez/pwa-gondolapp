import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db/indexeddb';
import { InventoryService } from '@/lib/services';
import {
  ProductRepository,
  StockRepository,
  SyncRepository,
} from '@/lib/db/repositories';

/**
 * Hook para gestionar stock usando InventoryService
 */
export const useStock = () => {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inventoryService = new InventoryService(
    new ProductRepository(db),
    new StockRepository(db),
    new SyncRepository(db),
    new StockRepository(db)
  );

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [lowStockResult, expiringResult] = await Promise.all([
        inventoryService.getProductsNeedingRestock(),
        inventoryService.getExpiringProducts(),
      ]);

      if (lowStockResult.success) {
        setLowStockItems(lowStockResult.data || []);
      } else {
        setError(
          lowStockResult.error?.message || 'Error fetching low stock items'
        );
      }

      if (expiringResult.success) {
        setExpiringItems(expiringResult.data || []);
      } else {
        setError(
          expiringResult.error?.message || 'Error fetching expiring items'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error cargando datos de stock'
      );
    } finally {
      setLoading(false);
    }
  }, [inventoryService]);

  const updateStock = useCallback(
    async (
      variantId: string,
      newStock: number,
      reason = 'Actualización manual'
    ) => {
      try {
        const result = await inventoryService.adjustStock(
          variantId,
          newStock,
          reason
        );
        if (result.success) {
          await fetchStockData();
        } else {
          const errorMsg = 'Error adjusting stock';
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error actualizando stock'
        );
        throw err;
      }
    },
    [inventoryService, fetchStockData]
  );

  const adjustStock = useCallback(
    async (
      variantId: string,
      quantity: number,
      reason = 'Ajuste de inventario'
    ) => {
      try {
        const result = await inventoryService.adjustStock(
          variantId,
          quantity,
          reason
        );
        if (result.success) {
          await fetchStockData();
        } else {
          setError(result.error?.message || 'Error ajustando stock');
          throw result.error || new Error('Error ajustando stock');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error ajustando stock');
        throw err;
      }
    },
    [inventoryService, fetchStockData]
  );

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
    adjustStock,
  };
};
