import type { Product, ProductVariant } from '@/types/inventory.types';
import { db } from './database';

/**
 * Servicio para operaciones de búsqueda de productos
 */
export class ProductSearchService {
  /**
   * Buscar producto por código de barras
   * Método optimizado para escaneo rápido
   */
  static async findByBarcode(barcode: string): Promise<{
    product: Product;
    variant: ProductVariant;
  } | null> {
    try {
      const products = await db.products.where('isActive').equals(1).toArray();

      for (const product of products) {
        const variant = product.variants.find(v => v.barcode === barcode);
        if (variant) {
          return { product, variant };
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Error buscando por código de barras: ${error}`);
    }
  }

  /**
   * Buscar productos por texto
   * Búsqueda en nombre, marca y descripción
   */
  static async searchByText(query: string, limit = 20): Promise<Product[]> {
    try {
      const lowerQuery = query.toLowerCase();

      return await db.products
        .where('isActive')
        .equals(1)
        .filter(
          (product: any) =>
            product.baseProduct?.toLowerCase().includes(lowerQuery) ||
            product.brand?.toLowerCase().includes(lowerQuery) ||
            product.name?.toLowerCase().includes(lowerQuery) ||
            (product.description &&
              product.description.toLowerCase().includes(lowerQuery))
        )
        .limit(limit)
        .toArray();
    } catch (error) {
      throw new Error(`Error buscando productos: ${error}`);
    }
  }

  /**
   * Obtener productos con stock bajo mínimo
   * Para sugerencias de reposición
   */
  static async getBelowMinStock(): Promise<
    Array<{
      product: Product;
      variant: ProductVariant;
      deficit: number;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    try {
      const products = await db.products.where('isActive').equals(1).toArray();
      const lowStockItems: Array<{
        product: Product;
        variant: ProductVariant;
        deficit: number;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      for (const product of products) {
        for (const variant of product.variants) {
          if (variant.stock <= variant.stockMinimo) {
            const deficit = variant.stockMinimo - variant.stock;
            const priority =
              variant.stock === 0
                ? 'high'
                : deficit > variant.stockMinimo * 0.5
                  ? 'medium'
                  : 'low';

            lowStockItems.push({
              product,
              variant,
              deficit,
              priority,
            });
          }
        }
      }

      return lowStockItems.sort((a, b) => {
        // Ordenar por prioridad y luego por déficit
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.deficit - a.deficit;
      });
    } catch (error) {
      throw new Error(`Error obteniendo productos con stock bajo: ${error}`);
    }
  }

  /**
   * Obtener productos próximos a vencer
   * Para notificaciones de vencimiento
   */
  static async getExpiring(daysThreshold = 7): Promise<
    Array<{
      product: Product;
      variant: ProductVariant;
      daysUntilExpiry: number;
    }>
  > {
    try {
      const products = await db.products.where('isActive').equals(1).toArray();
      const expiringItems: Array<{
        product: Product;
        variant: ProductVariant;
        daysUntilExpiry: number;
      }> = [];

      const now = new Date();

      for (const product of products) {
        for (const variant of product.variants) {
          if (variant.expirationDate) {
            const daysUntilExpiry = Math.ceil(
              (variant.expirationDate.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0) {
              expiringItems.push({
                product,
                variant,
                daysUntilExpiry,
              });
            }
          }
        }
      }

      return expiringItems.sort(
        (a, b) => a.daysUntilExpiry - b.daysUntilExpiry
      );
    } catch (error) {
      throw new Error(`Error obteniendo productos próximos a vencer: ${error}`);
    }
  }
}
