import type { Database } from '../database';
import type { Product, ProductVariant } from '../../../types/inventory.types';

export class ProductRepository {
  constructor(private db: Database) {}

  /**
   * CRUD básico
   */
  async findAll(): Promise<Product[]> {
    return await this.db.products.toArray();
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.db.products.get(id);
    return product || null;
  }

  async findByBarcode(
    barcode: string
  ): Promise<{ product: Product; variant: ProductVariant } | null> {
    const products = await this.db.products.toArray();

    for (const product of products) {
      const variant = product.variants.find(
        (v: ProductVariant) => v.barcode === barcode
      );
      if (variant) {
        return { product, variant };
      }
    }

    return null;
  }

  async create(product: Product): Promise<Product> {
    await this.db.products.add(product);
    return product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    await this.db.products.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.products.delete(id);
  }

  /**
   * Búsquedas específicas
   */
  async findActiveProducts(): Promise<Product[]> {
    return await this.db.products.where('isActive').equals(1).toArray();
  }

  async searchByText(query: string, limit = 50): Promise<Product[]> {
    const searchTerm = query.toLowerCase();

    return await this.db.products
      .filter((product: Product) => {
        const name = product.name.toLowerCase();
        const brand = product.brand.toLowerCase();
        const sku = product.sku?.toLowerCase() || '';

        // Búsqueda en nombre, marca y SKU
        return (
          name.includes(searchTerm) ||
          brand.includes(searchTerm) ||
          sku.includes(searchTerm)
        );
      })
      .limit(limit)
      .toArray();
  }

  async findByCategory(category: string): Promise<Product[]> {
    return await this.db.products.where('category').equals(category).toArray();
  }

  async findByBrand(brand: string): Promise<Product[]> {
    return await this.db.products.where('brand').equals(brand).toArray();
  }

  /**
   * Filtros de stock
   */
  async findBelowMinStock(): Promise<
    Array<{
      product: Product;
      variant: ProductVariant;
      deficit: number;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    const products = await this.db.products.toArray();
    const results: Array<{
      product: Product;
      variant: ProductVariant;
      deficit: number;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.currentStock < variant.minStock) {
          const deficit = variant.minStock - variant.currentStock;
          let priority: 'high' | 'medium' | 'low' = 'low';

          // Determinar prioridad basada en el déficit porcentual
          const deficitPercentage = deficit / variant.minStock;
          if (deficitPercentage >= 0.8) priority = 'high';
          else if (deficitPercentage >= 0.5) priority = 'medium';

          results.push({
            product,
            variant,
            deficit,
            priority,
          });
        }
      }
    }

    return results;
  }

  async findExpiring(daysThreshold = 7): Promise<
    Array<{
      product: Product;
      variant: ProductVariant;
      daysUntilExpiry: number;
    }>
  > {
    const products = await this.db.products.toArray();
    const results: Array<{
      product: Product;
      variant: ProductVariant;
      daysUntilExpiry: number;
    }> = [];

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.expirationDate && variant.expirationDate <= thresholdDate) {
          const daysUntilExpiry = Math.ceil(
            (variant.expirationDate.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          );

          results.push({
            product,
            variant,
            daysUntilExpiry,
          });
        }
      }
    }

    return results;
  }

  /**
   * Sincronización
   */
  async markForSync(productId: string): Promise<void> {
    await this.db.products.update(productId, {
      needsSync: true,
      updatedAt: new Date(),
    });
  }

  async findPendingSync(): Promise<Product[]> {
    return await this.db.products.where('needsSync').equals(1).toArray();
  }
}
