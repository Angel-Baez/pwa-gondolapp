import type {
  Product,
  ProductVariant,
  RestockList,
  RestockItem,
  InventoryMovement,
  ProductStats,
} from './inventory.types';

/**
 * Result type para manejo de errores en servicios
 */
export type ServiceResult<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Interface para Servicio de Inventario
 * Responsabilidad: Lógica de negocio para gestión de productos
 */
export interface IInventoryService {
  // Gestión de productos
  createProduct(
    productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResult<string>>;
  updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<ServiceResult<void>>;
  deleteProduct(id: string): Promise<ServiceResult<void>>;

  // Búsquedas de productos
  findProductByBarcode(
    barcode: string
  ): Promise<ServiceResult<{ product: Product; variant: ProductVariant }>>;
  searchProducts(
    query: string,
    filters?: {
      category?: string;
      brand?: string;
      inStock?: boolean;
      limit?: number;
    }
  ): Promise<ServiceResult<Product[]>>;

  // Gestión de stock
  updateStock(
    variantId: string,
    newStock: number,
    reason: string
  ): Promise<ServiceResult<void>>;
  adjustStock(
    variantId: string,
    quantity: number,
    reason: string
  ): Promise<ServiceResult<void>>;
  recordMovement(
    movement: Omit<InventoryMovement, '_id' | 'timestamp'>
  ): Promise<ServiceResult<string>>;

  // Análisis de stock
  getProductsNeedingRestock(): Promise<
    ServiceResult<
      Array<{
        product: Product;
        variant: ProductVariant;
        deficit: number;
        priority: 'high' | 'medium' | 'low';
        suggestedQuantity: number;
      }>
    >
  >;

  getExpiringProducts(daysThreshold?: number): Promise<
    ServiceResult<
      Array<{
        product: Product;
        variant: ProductVariant;
        daysUntilExpiry: number;
        urgency: 'critical' | 'warning' | 'normal';
      }>
    >
  >;

  // Estadísticas
  getProductStats(productId: string): Promise<ServiceResult<ProductStats>>;
  updateProductStats(variantId: string): Promise<ServiceResult<void>>;
}

/**
 * Interface para Servicio de Listas de Reposición
 * Responsabilidad: Lógica de negocio para gestión de listas
 */
export interface IRestockService {
  // Gestión de listas
  createList(name: string, userId: string): Promise<ServiceResult<string>>;
  deleteList(listId: string): Promise<ServiceResult<void>>;

  // Generación automática de listas
  generateAutomaticList(
    userId: string,
    options?: {
      includeLowStock?: boolean;
      includeExpiring?: boolean;
      includeOutOfStock?: boolean;
      maxItems?: number;
    }
  ): Promise<ServiceResult<string>>;

  // Gestión de items
  addItemToList(
    listId: string,
    item: Omit<RestockItem, 'completedAt' | 'isCompleted'>
  ): Promise<ServiceResult<void>>;
  updateItem(
    listId: string,
    itemIndex: number,
    updates: Partial<RestockItem>
  ): Promise<ServiceResult<void>>;
  removeItemFromList(
    listId: string,
    itemIndex: number
  ): Promise<ServiceResult<void>>;
  markItemCompleted(
    listId: string,
    itemIndex: number
  ): Promise<ServiceResult<void>>;

  // Operaciones en lote
  addMultipleItems(
    listId: string,
    items: Array<Omit<RestockItem, 'completedAt' | 'isCompleted'>>
  ): Promise<ServiceResult<void>>;
  markAllItemsCompleted(listId: string): Promise<ServiceResult<void>>;

  // Organización y optimización
  sortListByZone(listId: string): Promise<ServiceResult<void>>;
  optimizeListRoute(listId: string): Promise<ServiceResult<void>>;

  // Consultas
  getActiveList(userId: string): Promise<ServiceResult<RestockList | null>>;
  getListProgress(listId: string): Promise<
    ServiceResult<{
      totalItems: number;
      completedItems: number;
      percentComplete: number;
      estimatedTimeRemaining: number; // en minutos
    }>
  >;

  getUserLists(
    userId: string,
    includeCompleted?: boolean
  ): Promise<ServiceResult<RestockList[]>>;
}

/**
 * Interface para Servicio de Predicciones
 * Responsabilidad: Algoritmos de predicción y análisis
 */
export interface IPredictionService {
  // Predicción de demanda
  predictDemand(
    variantId: string,
    days: number
  ): Promise<
    ServiceResult<{
      predictedSales: number;
      confidence: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      seasonalFactor: number;
    }>
  >;

  // Cálculo de stock óptimo
  calculateOptimalStock(variantId: string): Promise<
    ServiceResult<{
      minStock: number;
      maxStock: number;
      reorderPoint: number;
      economicOrderQuantity: number;
    }>
  >;

  // Análisis de patrones
  analyzeConsumptionPattern(variantId: string): Promise<
    ServiceResult<{
      avgDailyConsumption: number;
      peakDays: string[];
      slowDays: string[];
      volatility: number;
    }>
  >;

  // Sugerencias de reposición
  getSuggestedReorderQuantity(variantId: string): Promise<
    ServiceResult<{
      quantity: number;
      reason: string;
      urgency: 'low' | 'medium' | 'high';
      daysUntilStockout: number;
    }>
  >;
}

/**
 * Interface para Servicio de Sincronización
 * Responsabilidad: Lógica de sincronización con servidor
 */
export interface ISyncService {
  // Estado de sincronización
  getSyncStatus(): Promise<
    ServiceResult<{
      isOnline: boolean;
      lastSync: Date | null;
      pendingOperations: number;
      failedOperations: number;
    }>
  >;

  // Operaciones de sincronización
  syncAll(): Promise<
    ServiceResult<{
      synchronized: number;
      failed: number;
      errors: string[];
    }>
  >;

  syncProducts(): Promise<ServiceResult<void>>;
  syncLists(): Promise<ServiceResult<void>>;
  syncMovements(): Promise<ServiceResult<void>>;

  // Gestión de cola offline
  queueOperation(operation: {
    type: 'product_update' | 'stock_movement' | 'list_update';
    data: any;
    priority?: number;
  }): Promise<ServiceResult<void>>;

  retryFailedOperations(): Promise<ServiceResult<number>>; // retorna número de operaciones reintentadas
  clearFailedOperations(): Promise<ServiceResult<void>>;

  // Resolución de conflictos
  resolveConflict(
    operationId: string,
    resolution: 'local' | 'remote'
  ): Promise<ServiceResult<void>>;
  getConflicts(): Promise<
    ServiceResult<
      Array<{
        operationId: string;
        type: string;
        localData: any;
        remoteData: any;
        timestamp: Date;
      }>
    >
  >;
}

/**
 * Interface para Servicio de Notificaciones
 * Responsabilidad: Gestión de notificaciones y alertas
 */
export interface INotificationService {
  // Configuración de notificaciones
  scheduleStockAlert(
    variantId: string,
    threshold: number
  ): Promise<ServiceResult<void>>;
  scheduleExpirationAlert(
    variantId: string,
    daysBeforeExpiry: number
  ): Promise<ServiceResult<void>>;

  // Envío de notificaciones
  sendLowStockNotification(
    products: Array<{ product: Product; variant: ProductVariant }>
  ): Promise<ServiceResult<void>>;
  sendExpirationNotification(
    products: Array<{
      product: Product;
      variant: ProductVariant;
      daysLeft: number;
    }>
  ): Promise<ServiceResult<void>>;

  // Gestión de preferencias
  updateNotificationPreferences(
    userId: string,
    preferences: {
      lowStockAlerts: boolean;
      expirationAlerts: boolean;
      dailyReport: boolean;
      weeklyReport: boolean;
    }
  ): Promise<ServiceResult<void>>;

  // Notificaciones push
  registerPushSubscription(
    subscription: PushSubscription
  ): Promise<ServiceResult<void>>;
  sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ): Promise<ServiceResult<void>>;
}

/**
 * Interface para Servicio de Reportes
 * Responsabilidad: Generación de reportes y análisis
 */
export interface IReportService {
  // Reportes de inventario
  generateInventoryReport(options?: {
    includeOutOfStock?: boolean;
    includeExpiring?: boolean;
    categoryFilter?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<
    ServiceResult<{
      totalProducts: number;
      totalValue: number;
      outOfStock: number;
      lowStock: number;
      expiring: number;
      products: Array<{
        product: Product;
        variants: Array<{
          variant: ProductVariant;
          stock: number;
          status: 'ok' | 'low' | 'out' | 'expiring';
        }>;
      }>;
    }>
  >;

  // Reportes de movimientos
  generateMovementReport(dateRange: { start: Date; end: Date }): Promise<
    ServiceResult<{
      totalMovements: number;
      inboundMovements: number;
      outboundMovements: number;
      adjustments: number;
      topProducts: Array<{
        product: Product;
        totalMovement: number;
      }>;
      movements: InventoryMovement[];
    }>
  >;

  // Reportes de performance
  generatePerformanceReport(dateRange: { start: Date; end: Date }): Promise<
    ServiceResult<{
      listsCompleted: number;
      avgCompletionTime: number;
      productivityMetrics: {
        itemsPerHour: number;
        averageListSize: number;
        peakHours: string[];
      };
      userStats: Array<{
        userId: string;
        listsCompleted: number;
        avgTime: number;
        efficiency: number;
      }>;
    }>
  >;

  // Exportación de datos
  exportToExcel(
    reportType: 'inventory' | 'movements' | 'performance',
    options?: any
  ): Promise<ServiceResult<Blob>>;
  exportToPDF(
    reportType: 'inventory' | 'movements' | 'performance',
    options?: any
  ): Promise<ServiceResult<Blob>>;
}
