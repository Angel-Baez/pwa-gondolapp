import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db/indexeddb';
import { InventoryService } from '@/lib/services';
import {
  ProductRepository,
  StockRepository,
  SyncRepository,
} from '@/lib/db/repositories';
import type { Product } from '@/types/inventory.types';

/**
 * Hook para buscar productos usando InventoryService
 */
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inventoryService = new InventoryService(
    new ProductRepository(db),
    new StockRepository(db),
    new SyncRepository(db),
    new StockRepository(db)
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const productRepo = new ProductRepository(db);
      const data = await productRepo.findActiveProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(
    async (query: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await inventoryService.searchProducts(query);
        if (result.success) {
          setProducts(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error buscando productos'
        );
      } finally {
        setLoading(false);
      }
    },
    [inventoryService]
  );

  const findByBarcode = useCallback(
    async (barcode: string) => {
      try {
        const result = await inventoryService.findProductByBarcode(barcode);
        if (result.success) {
          return result.data;
        } else {
          setError(result.error.message);
          return null;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error buscando por código'
        );
        return null;
      }
    },
    [inventoryService]
  );

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
