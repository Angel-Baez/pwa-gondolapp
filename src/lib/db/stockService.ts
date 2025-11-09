import type { SyncOperation, InventoryMovement } from '@/types/inventory.types';
import { db } from './database';

/**
 * Servicio para gestión de stock y sincronización
 */
export class StockService {
  /**
   * Actualizar stock de variante de forma atómica
   * Incluye registro en cola de sincronización
   */
  static async updateVariantStock(
    variantId: string,
    newStock: number,
    movementType: 'restock' | 'discard' | 'adjustment',
    reason?: string,
    userId?: string
  ): Promise<void> {
    try {
      await db.transaction('rw', [db.products, db.pendingSync], async () => {
        // Buscar y actualizar producto
        const products = await db.products.toArray();
        const productToUpdate = products.find(product =>
          product.variants.some(v => v.variantId === variantId)
        );

        if (!productToUpdate) {
          throw new Error(`Variante ${variantId} no encontrada`);
        }

        const variantIndex = productToUpdate.variants.findIndex(
          v => v.variantId === variantId
        );
        const previousStock = productToUpdate.variants[variantIndex].stock;
        const quantityChange = newStock - previousStock;

        productToUpdate.variants[variantIndex].stock = newStock;
        productToUpdate.updatedAt = new Date();

        await db.products.put(productToUpdate);

        // Agregar movimiento a cola de sincronización
        const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.pendingSync.add({
          _id: movementId,
          type: 'movement',
          data: {
            type: movementType,
            variantId,
            quantity: quantityChange,
            resultingStock: newStock,
            reason,
            timestamp: new Date(),
            userId,
          } as InventoryMovement,
          timestamp: new Date(),
          retries: 0,
          priority: movementType === 'discard' ? 0 : 1,
        });
      });
    } catch (error) {
      throw new Error(`Error actualizando stock: ${error}`);
    }
  }

  /**
   * Obtener operaciones pendientes de sincronización
   */
  static async getPendingOperations(): Promise<SyncOperation[]> {
    try {
      return await db.pendingSync
        .orderBy('[priority+timestamp]')
        .filter(op => op.retries < 3)
        .toArray();
    } catch (error) {
      throw new Error(`Error obteniendo operaciones pendientes: ${error}`);
    }
  }

  /**
   * Marcar operación como sincronizada
   */
  static async markAsSynced(operationId: string): Promise<void> {
    try {
      await db.pendingSync.delete(operationId);
    } catch (error) {
      throw new Error(`Error marcando como sincronizada: ${error}`);
    }
  }

  /**
   * Incrementar reintentos de operación fallida
   */
  static async incrementRetries(
    operationId: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const operation = await db.pendingSync.get(operationId);
      if (operation) {
        await db.pendingSync.update(operationId, {
          retries: operation.retries + 1,
          lastError: errorMessage,
        });
      }
    } catch (error) {
      throw new Error(`Error incrementando reintentos: ${error}`);
    }
  }
}
