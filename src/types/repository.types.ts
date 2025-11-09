import type {
  Product,
  ProductVariant,
  RestockList,
  RestockItem,
  SyncOperation,
  InventoryMovement,
  ProductStats,
} from './inventory.types';

/**
 * Interface para Repository de Productos
 * Responsabilidad: CRUD y sincronización de productos
 */
export interface IProductRepository {
  // CRUD básico
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByBarcode(
    barcode: string
  ): Promise<{ product: Product; variant: ProductVariant } | null>;
  create(product: Product): Promise<string>;
  update(id: string, product: Partial<Product>): Promise<void>;
  delete(id: string): Promise<void>;

  // Búsquedas específicas
  findActiveProducts(): Promise<Product[]>;
  searchByText(query: string, limit?: number): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findByBrand(brand: string): Promise<Product[]>;

  // Filtros de stock
  findBelowMinStock(): Promise<
    Array<{
      product: Product;
      variant: ProductVariant;
      deficit: number;
      priority: 'high' | 'medium' | 'low';
    }>
  >;
  findExpiring(daysThreshold?: number): Promise<
    Array<{
      product: Product;
      variant: ProductVariant;
      daysUntilExpiry: number;
    }>
  >;

  // Sincronización
  markForSync(productId: string): Promise<void>;
  findPendingSync(): Promise<Product[]>;
}

/**
 * Interface para Repository de Stock
 * Responsabilidad: CRUD de movimientos de inventario
 */
export interface IStockRepository {
  // Movimientos de stock
  createMovement(movement: InventoryMovement): Promise<string>;
  findMovementsByVariant(variantId: string): Promise<InventoryMovement[]>;
  findMovementsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<InventoryMovement[]>;

  // Actualización de stock
  updateVariantStock(variantId: string, newStock: number): Promise<void>;
  getVariantStock(variantId: string): Promise<number | null>;

  // Estadísticas
  getVariantStats(variantId: string): Promise<ProductStats | null>;
  updateVariantStats(variantId: string, stats: ProductStats): Promise<void>;
}

/**
 * Interface para Repository de Listas de Reposición
 * Responsabilidad: CRUD de listas de reposición
 */
export interface IRestockListRepository {
  // CRUD básico
  findAll(): Promise<RestockList[]>;
  findById(id: string): Promise<RestockList | null>;
  create(list: Omit<RestockList, '_id' | 'createdAt'>): Promise<string>;
  update(id: string, list: Partial<RestockList>): Promise<void>;
  delete(id: string): Promise<void>;

  // Búsquedas específicas
  findActive(): Promise<RestockList[]>;
  findCompleted(): Promise<RestockList[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<RestockList[]>;
  findByUser(userId: string): Promise<RestockList[]>;

  // Operaciones en items
  updateItem(
    listId: string,
    itemIndex: number,
    item: Partial<RestockItem>
  ): Promise<void>;
  markItemCompleted(
    listId: string,
    itemIndex: number,
    completedAt?: Date
  ): Promise<void>;
}

/**
 * Interface para Repository de Sincronización
 * Responsabilidad: CRUD de operaciones de sincronización
 */
export interface ISyncRepository {
  // CRUD básico
  findAll(): Promise<SyncOperation[]>;
  findById(id: string): Promise<SyncOperation | null>;
  create(operation: Omit<SyncOperation, '_id' | 'timestamp'>): Promise<string>;
  update(id: string, operation: Partial<SyncOperation>): Promise<void>;
  delete(id: string): Promise<void>;

  // Gestión de cola
  findPending(): Promise<SyncOperation[]>;
  findByType(type: string): Promise<SyncOperation[]>;
  findByPriority(priority: number): Promise<SyncOperation[]>;
  findFailedOperations(): Promise<SyncOperation[]>;

  // Operaciones de sincronización
  markAsSynced(id: string): Promise<void>;
  incrementRetries(id: string, errorMessage?: string): Promise<void>;
  resetRetries(id: string): Promise<void>;
}

/**
 * Interface para Repository de Utilidades/Mantenimiento
 * Responsabilidad: Operaciones de mantenimiento y limpieza
 */
export interface IMaintenanceRepository {
  // Limpieza de datos
  cleanupOldData(daysThreshold?: number): Promise<number>;
  cleanupFailedOperations(): Promise<number>;

  // Estadísticas generales
  getDatabaseStats(): Promise<{
    totalProducts: number;
    totalVariants: number;
    totalLists: number;
    pendingOperations: number;
    databaseSize: number;
  }>;

  // Operaciones de respaldo
  exportData(): Promise<{
    products: Product[];
    restockLists: RestockList[];
    timestamp: Date;
  }>;

  importData(data: {
    products: Product[];
    restockLists: RestockList[];
  }): Promise<void>;

  // Optimización
  optimizeDatabase(): Promise<void>;
  rebuildIndexes(): Promise<void>;
}
