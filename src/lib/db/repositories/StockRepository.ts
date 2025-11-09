import type { Database } from '../database';
import type { InventoryMovement } from '@/types/inventory.types';

export class StockRepository {
  constructor(private db: Database) {}

  /**
   * Movimientos de stock
   */
  async create(movement: InventoryMovement): Promise<InventoryMovement> {
    await this.db.inventoryMovements.add(movement);
    return movement;
  }

  async findByVariant(variantId: string): Promise<InventoryMovement[]> {
    return await this.db.inventoryMovements
      .where('variantId')
      .equals(variantId)
      .reverse()
      .sortBy('timestamp');
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<InventoryMovement[]> {
    return await this.db.inventoryMovements
      .where('timestamp')
      .between(startDate, endDate, true, true)
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Actualización de stock
   */
  async updateStock(variantId: string, newStock: number): Promise<void> {
    // Buscar el producto que contiene esta variante
    const products = await this.db.products.toArray();

    for (const product of products) {
      const variantIndex = product.variants.findIndex(
        (v: any) => v._id === variantId
      );

      if (variantIndex !== -1) {
        // Actualizar el stock de la variante específica
        const updatedVariants = [...product.variants];
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          currentStock: newStock,
        };

        await this.db.products.update(product._id!, {
          variants: updatedVariants,
          updatedAt: new Date(),
        });

        return;
      }
    }

    throw new Error(`Variant with ID ${variantId} not found`);
  }

  async getVariantStock(
    variantId: string
  ): Promise<{ currentStock: number } | null> {
    const products = await this.db.products.toArray();

    for (const product of products) {
      const variant = product.variants.find((v: any) => v._id === variantId);
      if (variant) {
        return { currentStock: variant.currentStock };
      }
    }

    return null;
  }
}
