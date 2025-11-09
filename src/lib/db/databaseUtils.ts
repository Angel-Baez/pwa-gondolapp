import type {
  Product,
  RestockList,
  InventorySummary,
  RestockItem,
} from '@/types/inventory.types';
import { db } from './database';
import { ProductSearchService } from './productSearchService';

/**
 * Servicio para estadísticas y utilidades de la base de datos
 */
export class DatabaseUtilsService {
  /**
   * Obtener estadísticas de la base de datos
   */
  static async getStats(): Promise<InventorySummary> {
    try {
      const [products, pendingOps] = await Promise.all([
        db.products.where('isActive').equals(1).toArray(),
        db.pendingSync.toArray(),
      ]);

      const totalVariants = products.reduce(
        (sum, p) => sum + p.variants.length,
        0
      );
      const lowStockItems = products.reduce((sum, p) => {
        return sum + p.variants.filter(v => v.stock <= v.stockMinimo).length;
      }, 0);

      const expiringItems = products.reduce((sum, p) => {
        const now = new Date();
        return (
          sum +
          p.variants.filter(v => {
            if (!v.expirationDate) return false;
            const daysUntilExpiry = Math.ceil(
              (v.expirationDate.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
          }).length
        );
      }, 0);

      const totalValue = products.reduce((sum, p) => {
        return (
          sum +
          p.variants.reduce((variantSum, v) => {
            return variantSum + v.stock * v.cost;
          }, 0)
        );
      }, 0);

      const healthScore = this.calculateHealthScore(
        totalVariants,
        lowStockItems,
        expiringItems,
        pendingOps.length
      );

      const lastSyncOp = await db.pendingSync
        .orderBy('timestamp')
        .reverse()
        .first();

      return {
        totalProducts: products.length,
        totalVariants,
        totalValue,
        lowStockCount: lowStockItems,
        expiringCount: expiringItems,
        lastSyncDate: lastSyncOp?.timestamp,
        healthScore,
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error}`);
    }
  }

  /**
   * Calcular score de salud del inventario
   */
  private static calculateHealthScore(
    totalVariants: number,
    lowStockItems: number,
    expiringItems: number,
    pendingOps: number
  ): number {
    if (totalVariants === 0) return 100;

    let score = 100;

    // Penalizar por stock bajo (máximo -40 puntos)
    const lowStockPenalty = Math.min(40, (lowStockItems / totalVariants) * 100);
    score -= lowStockPenalty;

    // Penalizar por productos próximos a vencer (máximo -30 puntos)
    const expiringPenalty = Math.min(30, (expiringItems / totalVariants) * 100);
    score -= expiringPenalty;

    // Penalizar por operaciones pendientes (máximo -20 puntos)
    const syncPenalty = Math.min(20, (pendingOps / 100) * 20);
    score -= syncPenalty;

    return Math.max(0, Math.round(score));
  }

  /**
   * Generar sugerencias de reposición automática
   */
  static async generateRestockSuggestions(): Promise<RestockItem[]> {
    try {
      const lowStockProducts = await ProductSearchService.getBelowMinStock();
      const suggestions: RestockItem[] = [];

      for (const { product, variant, priority } of lowStockProducts) {
        const suggestedQuantity = Math.max(
          variant.stockMinimo - variant.stock,
          Math.round(variant.stockMinimo * 1.2) // Factor de reposición
        );

        suggestions.push({
          variantId: variant.variantId,
          barcode: variant.barcode,
          productName: `${product.brand} ${product.name} ${variant.size}`,
          size: variant.size,
          quantity: suggestedQuantity,
          zona: variant.zona,
          priority,
          completed: false,
        });
      }

      return suggestions;
    } catch (error) {
      throw new Error(`Error generando sugerencias: ${error}`);
    }
  }

  /**
   * Limpiar datos antiguos para mantener performance
   */
  static async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await db.transaction(
        'rw',
        [db.restockLists, db.pendingSync],
        async () => {
          // Eliminar listas completadas de más de 30 días
          await db.restockLists
            .where('completedAt')
            .below(thirtyDaysAgo)
            .delete();

          // Eliminar operaciones fallidas con más de 3 reintentos
          await db.pendingSync.where('retries').aboveOrEqual(3).delete();
        }
      );
    } catch (error) {
      throw new Error(`Error en limpieza de datos: ${error}`);
    }
  }

  /**
   * Exportar datos (backup)
   */
  static async exportData(): Promise<{
    products: Product[];
    restockLists: RestockList[];
    timestamp: Date;
  }> {
    try {
      const [products, restockLists] = await Promise.all([
        db.products.toArray(),
        db.restockLists.toArray(),
      ]);

      return {
        products,
        restockLists,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Error exportando datos: ${error}`);
    }
  }

  /**
   * Importar datos (restore) - solo desarrollo
   */
  static async importData(data: {
    products: Product[];
    restockLists: RestockList[];
  }): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('importData solo disponible en desarrollo');
    }

    try {
      await db.transaction('rw', [db.products, db.restockLists], async () => {
        await db.products.clear();
        await db.restockLists.clear();

        await db.products.bulkAdd(data.products);
        await db.restockLists.bulkAdd(data.restockLists);
      });
    } catch (error) {
      throw new Error(`Error importando datos: ${error}`);
    }
  }

  /**
   * Resetear la base de datos - solo desarrollo
   */
  static async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('resetDB solo disponible en desarrollo');
    }

    try {
      await db.delete();
      await db.open();
    } catch (error) {
      throw new Error(`Error reseteando base de datos: ${error}`);
    }
  }
}
