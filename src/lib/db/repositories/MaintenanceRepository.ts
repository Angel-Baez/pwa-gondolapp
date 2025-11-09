import type { Database } from '../database';
import type { InventorySummary } from '@/types/inventory.types';

export class MaintenanceRepository {
  constructor(private db: Database) {}

  /**
   * Limpiar todas las tablas
   */
  async clearAllTables(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.products,
        this.db.restockLists,
        this.db.inventoryMovements,
        this.db.syncOperations,
      ],
      async () => {
        await this.db.products.clear();
        await this.db.restockLists.clear();
        await this.db.inventoryMovements.clear();
        await this.db.syncOperations.clear();
      }
    );
  }

  /**
   * Limpieza de datos antiguos
   */
  async clearOldData(daysThreshold = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const deletedCount = 0;

    await this.db.transaction(
      'rw',
      [
        this.db.restockLists,
        this.db.inventoryMovements,
        this.db.syncOperations,
      ],
      async () => {
        // Clear old completed lists
        await this.db.restockLists
          .where('completedAt')
          .below(cutoffDate)
          .and((list: any) => list.completedAt && list.completedAt < cutoffDate)
          .delete();

        // Clear old movements
        await this.db.inventoryMovements
          .where('timestamp')
          .below(cutoffDate)
          .delete();

        // Clear old synced operations
        await this.db.syncOperations
          .where('timestamp')
          .below(cutoffDate)
          .and((op: any) => op.syncedAt && op.syncedAt < cutoffDate)
          .delete();
      }
    );

    return deletedCount;
  }

  /**
   * Compactar la base de datos
   */
  async compactDatabase(): Promise<void> {
    // Clear old data first
    await this.clearOldData();

    // Force IndexedDB to compact by opening/closing
    await this.db.close();
    await this.db.open();
  }

  async getDatabaseStats() {
    const [
      productsCount,
      restockListsCount,
      movementsCount,
      syncOperationsCount,
    ] = await Promise.all([
      this.db.products.count(),
      this.db.restockLists.count(),
      this.db.inventoryMovements.count(),
      this.db.syncOperations.count(),
    ]);

    return {
      products: productsCount,
      restockLists: restockListsCount,
      movements: movementsCount,
      syncOperations: syncOperationsCount,
      lastUpdated: new Date(),
    };
  }

  async getInventorySummary(): Promise<InventorySummary> {
    const products = await this.db.products.toArray();

    const totalProducts = products.length;
    const totalVariants = products.reduce(
      (sum: number, product: any) => sum + product.variants.length,
      0
    );

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    products.forEach(product => {
      product.variants.forEach((variant: any) => {
        if (variant.currentStock === 0) {
          outOfStockCount++;
        } else if (variant.currentStock <= variant.minStock) {
          lowStockCount++;
        }
        totalValue += variant.currentStock * variant.costPrice;
      });
    });

    return {
      totalProducts,
      totalVariants,
      lowStockCount,
      outOfStockCount,
      totalValue,
      lastUpdated: new Date(),
    };
  }
}
