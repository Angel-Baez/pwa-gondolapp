import type {
  Product,
  ProductVariant,
  InventoryMovement,
  ProductStats,
} from '@/types/inventory.types';
import type { ServiceResult } from '@/types/service.types';
import { ProductRepository } from '../db/repositories/ProductRepository';
import { StockRepository } from '../db/repositories/StockRepository';
import { SyncRepository } from '../db/repositories/SyncRepository';

export class InventoryService {
  constructor(
    private productRepo: ProductRepository,
    private stockRepo: StockRepository,
    private syncRepo: SyncRepository,
    private movementRepo: StockRepository
  ) {}

  /**
   * Gestión de productos
   */
  async createProduct(
    productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'needsSync'>
  ): Promise<{ success: boolean; data?: Product; error?: Error }> {
    try {
      // Validaciones de negocio
      if (!productData.name?.trim()) {
        return {
          success: false,
          error: new Error('El nombre del producto es requerido'),
        };
      }

      if (!productData.brand?.trim()) {
        return {
          success: false,
          error: new Error('La marca del producto es requerida'),
        };
      }

      if (!productData.variants || productData.variants.length === 0) {
        return {
          success: false,
          error: new Error('El producto debe tener al menos una variante'),
        };
      }

      // Verificar códigos de barras únicos
      for (const variant of productData.variants) {
        const existing = await this.productRepo.findByBarcode(variant.barcode);
        if (existing) {
          return {
            success: false,
            error: new Error(
              `El código de barras ${variant.barcode} ya existe`
            ),
          };
        }
      }

      // Generar SKU automático si no existe
      const productWithSku = { ...productData };
      if (!productWithSku.sku) {
        productWithSku.sku = this.generateSKU(productData);
      }

      // Agregar metadatos
      const productToCreate: Product = {
        _id: crypto.randomUUID(),
        ...productWithSku,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: productWithSku.isActive ?? true,
        needsSync: true,
      };

      const createdProduct = await this.productRepo.create(productToCreate);

      // Queue for sync
      await this.syncRepo.add({
        type: 'product_update',
        data: createdProduct,
        synced: false,
        retries: 0,
        timestamp: new Date(),
      });

      return { success: true, data: createdProduct };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async updateProduct(
    productId: string,
    updates: Partial<Omit<Product, '_id' | 'createdAt'>>
  ): Promise<{ success: boolean; data?: Product; error?: Error }> {
    try {
      const existingProduct = await this.productRepo.findById(productId);
      if (!existingProduct) {
        return { success: false, error: new Error('Producto no encontrado') };
      }

      // Validar códigos de barras únicos si se actualizan variantes
      if (updates.variants) {
        for (const variant of updates.variants) {
          const existing = await this.productRepo.findByBarcode(
            variant.barcode
          );
          if (existing && existing.product._id !== productId) {
            return {
              success: false,
              error: new Error(
                `El código de barras ${variant.barcode} ya existe`
              ),
            };
          }
        }
      }

      const updateData: Partial<Product> = {
        ...updates,
        updatedAt: new Date(),
        needsSync: true,
      };

      const updatedProduct = await this.productRepo.update(
        productId,
        updateData
      );

      if (!updatedProduct) {
        throw new Error('Product not found');
      }

      // Queue for sync
      await this.syncRepo.add({
        type: 'product_update',
        data: updatedProduct,
        synced: false,
        retries: 0,
        timestamp: new Date(),
      });

      return { success: true, data: updatedProduct };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async deleteProduct(id: string): Promise<ServiceResult<void>> {
    try {
      const product = await this.productRepo.findById(id);
      if (!product) {
        return { success: false, error: new Error('Producto no encontrado') };
      }

      // Verificar si tiene stock antes de eliminar
      for (const variant of product.variants) {
        if (variant.currentStock > 0) {
          return {
            success: false,
            error: new Error(
              'No se puede eliminar un producto con stock existente'
            ),
          };
        }
      }

      await this.productRepo.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Búsquedas de productos
   */
  async findProductByBarcode(
    barcode: string
  ): Promise<ServiceResult<{ product: Product; variant: ProductVariant }>> {
    try {
      const result = await this.productRepo.findByBarcode(barcode);
      if (!result) {
        return { success: false, error: new Error('Producto no encontrado') };
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async searchProducts(
    query: string,
    filters?: {
      category?: string;
      brand?: string;
      inStock?: boolean;
      limit?: number;
    }
  ): Promise<ServiceResult<Product[]>> {
    try {
      let products: Product[];

      if (filters?.category) {
        products = await this.productRepo.findByCategory(filters.category);
      } else if (filters?.brand) {
        products = await this.productRepo.findByBrand(filters.brand);
      } else {
        products = await this.productRepo.searchByText(query, filters?.limit);
      }

      // Aplicar filtro de stock si se especifica
      if (filters?.inStock !== undefined) {
        products = products.filter(product => {
          const hasStock = product.variants.some(variant =>
            filters.inStock
              ? variant.currentStock > 0
              : variant.currentStock === 0
          );
          return hasStock;
        });
      }

      return { success: true, data: products };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Gestión de stock
   */
  async updateStock(
    variantId: string,
    newStock: number,
    reason: string
  ): Promise<ServiceResult<void>> {
    try {
      if (newStock < 0) {
        return {
          success: false,
          error: new Error('El stock no puede ser negativo'),
        };
      }

      const stockInfo = await this.stockRepo.getVariantStock(variantId);
      if (stockInfo === null) {
        return { success: false, error: new Error('Variante no encontrada') };
      }

      const currentStock = stockInfo.currentStock;

      // Crear movimiento de inventario
      const movement: Omit<InventoryMovement, '_id'> = {
        variantId,
        type: 'adjustment',
        quantity: newStock - currentStock,
        previousStock: currentStock,
        newStock,
        resultingStock: newStock,
        reason,
        timestamp: new Date(),
        userId: 'system', // TODO: obtener del contexto de usuario
      };

      // Actualizar stock y crear movimiento en transacción
      await this.stockRepo.updateStock(variantId, newStock);
      await this.movementRepo.create({
        _id: crypto.randomUUID(),
        ...movement,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async adjustStock(
    variantId: string,
    quantity: number,
    reason: string = 'Manual adjustment'
  ): Promise<ServiceResult<void>> {
    try {
      // Get current stock
      const stockInfo = await this.stockRepo.getVariantStock(variantId);
      if (!stockInfo) {
        return { success: false, error: new Error('Variante no encontrada') };
      }

      const previousStock = stockInfo.currentStock;
      const newStock = previousStock + quantity;

      if (newStock < 0) {
        return {
          success: false,
          error: new Error('El stock resultante no puede ser negativo'),
        };
      }

      // Update stock
      await this.stockRepo.updateStock(variantId, newStock);

      // Create movement record
      const movement: Omit<InventoryMovement, '_id'> = {
        variantId,
        type: 'adjustment',
        quantity,
        previousStock,
        newStock,
        resultingStock: newStock,
        reason,
        timestamp: new Date(),
        userId: 'system', // TODO: obtener del contexto de usuario
      };

      const createdMovement = await this.movementRepo.create({
        _id: crypto.randomUUID(),
        ...movement,
      });

      // Queue for sync
      await this.syncRepo.add({
        type: 'stock_adjustment',
        data: createdMovement,
        synced: false,
        retries: 0,
        timestamp: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Análisis de stock
   */
  async getProductsNeedingRestock(): Promise<{
    success: boolean;
    data?: Array<{
      product: Product;
      variant: ProductVariant;
      deficit: number;
      priority: 'high' | 'medium' | 'low';
      suggestedQuantity: number;
    }>;
    error?: Error;
  }> {
    try {
      const belowMinStock = await this.productRepo.findBelowMinStock();

      const results = belowMinStock.map(item => ({
        ...item,
        suggestedQuantity: this.calculateReorderQuantity(item.variant),
      }));

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getExpiringProducts(daysThreshold = 7): Promise<{
    success: boolean;
    data?: Array<{
      product: Product;
      variant: ProductVariant;
      daysUntilExpiry: number;
      urgency: 'critical' | 'warning' | 'normal';
    }>;
    error?: Error;
  }> {
    try {
      const expiringProducts =
        await this.productRepo.findExpiring(daysThreshold);

      const results = expiringProducts.map(item => ({
        ...item,
        urgency: this.calculateExpiryUrgency(item.daysUntilExpiry),
      }));

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Estadísticas
   */
  async getProductStats(
    productId: string
  ): Promise<{ success: boolean; data?: ProductStats; error?: Error }> {
    try {
      const product = await this.productRepo.findById(productId);
      if (!product) {
        return { success: false, error: new Error('Producto no encontrado') };
      }

      const firstVariant = product.variants[0];
      if (!firstVariant) {
        throw new Error('Product has no variants');
      }

      const movements = await this.movementRepo.findByVariant(firstVariant._id);
      const stats = this.calculateStockStats(product, movements);

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async updateProductStats(
    _variantId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // Obtener movimientos recientes para calcular estadísticas
      // const movements = await this.movementRepo.findByVariant(variantId);

      // Las estadísticas se calculan dinámicamente, no se almacenan
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Métodos utilitarios privados
   */
  /**
   * Métodos utilitarios privados
   */
  private generateSKU(productData: any): string {
    // Auto-generate SKU based on brand and name
    const brandPrefix = productData.brand.substring(0, 3).toUpperCase();
    const namePrefix = productData.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${brandPrefix}${namePrefix}${timestamp}`;
  }

  private calculateReorderQuantity(variant: ProductVariant): number {
    return Math.ceil(variant.minStock * 1.5);
  }

  private calculateExpiryUrgency(
    daysUntilExpiry: number
  ): 'critical' | 'warning' | 'normal' {
    if (daysUntilExpiry <= 2) return 'critical';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'normal';
  }

  private calculateStockStats(
    product: Product,
    movements: InventoryMovement[]
  ): ProductStats {
    const firstVariant = product.variants[0];
    if (!firstVariant) {
      throw new Error('Product has no variants');
    }

    const variantMovements = movements.filter(
      m => m.variantId === firstVariant._id
    );
    const averageDailyUsage = this.calculateAverageDailyUsage(variantMovements);
    const currentStock = firstVariant.currentStock;
    const daysUntilStockout =
      averageDailyUsage > 0
        ? Math.floor(currentStock / averageDailyUsage)
        : 999;

    const lastRestockMovement = variantMovements
      .filter(m => m.type === 'restock')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      variantId: firstVariant._id || '',
      productName: product.name,
      variantName: firstVariant.name,
      currentStock,
      averageDailyUsage,
      daysUntilStockout,
      suggestedReorderQuantity: this.calculateReorderQuantity(firstVariant),
      lastRestockDate: lastRestockMovement?.timestamp,
    };
  }

  private calculateAverageDailyUsage(movements: InventoryMovement[]): number {
    if (movements.length === 0) return 0;

    const outboundMovements = movements.filter(movement => {
      if (movement.type === 'sale' && movement.quantity < 0) {
        return true;
      } else if (movement.type === 'waste' && movement.quantity > 0) {
        return true;
      }
      return false;
    });

    if (outboundMovements.length === 0) return 0;

    const totalUsage = outboundMovements.reduce(
      (sum, movement) => sum + Math.abs(movement.quantity),
      0
    );

    const daysCovered = this.calculateDaysCovered(movements);
    return daysCovered > 0 ? totalUsage / daysCovered : 0;
  }

  private calculateDaysCovered(movements: InventoryMovement[]): number {
    if (movements.length === 0) return 0;

    const dates = movements.map(m => m.timestamp.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    return Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
  }
}
