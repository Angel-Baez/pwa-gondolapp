/**
 * Tipos para el sistema de inventario de GondolApp
 * Diseñado para soporte offline-first con IndexedDB y MongoDB
 */

// ===============================
// TIPOS BASE DE PRODUCTOS
// ===============================

/**
 * Categoría jerárquica de productos (3 niveles)
 */
export interface ProductCategory {
  level1: string; // Ej: "Lácteos"
  level2: string; // Ej: "Leches"
  level3: string; // Ej: "Entera"
}

/**
 * Zona física en el supermercado
 */
export interface PhysicalZone {
  section: string; // Ej: "Lácteos"
  location: string; // Ej: "Estante Bajo Derecha"
  sortOrder: number; // Para optimizar recorrido
}

/**
 * Variante de producto con código de barras único
 * Cada variante representa un SKU específico
 */
export interface ProductVariant {
  _id: string; // UUID único
  name: string; // Nombre de la variante
  barcode: string; // Código de barras EAN-13/EAN-8
  sku?: string; // Auto-generado: {first10digits}-{A/B/C}
  size: string; // Ej: "1L", "500ml", "2kg"
  unit: 'kg' | 'lt' | 'un' | 'gr' | 'ml'; // Unidades estandarizadas
  costPrice: number; // Costo de compra
  salePrice: number; // Precio de venta
  currentStock: number; // Stock actual
  minStock: number; // Stock mínimo para alertas
  maxStock: number; // Stock máximo
  reorderPoint: number; // Punto de reorden
  expirationDate?: Date; // Fecha de vencimiento (opcional)
  isActive: boolean; // Si la variante está activa
}

/**
 * Producto base (marca + nombre)
 * Contiene múltiples variantes con diferentes códigos de barras
 */
export interface Product {
  _id: string; // MongoDB ObjectId o UUID para IndexedDB
  sku: string; // SKU del producto base
  baseProduct: string; // Ej: "Leche Milex"
  brand: string; // Ej: "Milex"
  name: string; // Ej: "Leche"
  description?: string; // Descripción opcional
  category: ProductCategory; // Categoría jerárquica
  variants: ProductVariant[]; // Array de variantes
  physicalZone: string; // Zona física del producto
  imageUrl?: string; // URL de imagen del producto
  isActive: boolean; // Si el producto está activo
  needsSync: boolean; // Si necesita sincronización
  createdAt: Date;
  updatedAt: Date;
}

// ===============================
// TIPOS DE LISTAS DE REPOSICIÓN
// ===============================

/**
 * Item en lista de reposición
 */
export interface RestockItem {
  _id: string; // UUID único
  productId: string; // Referencia al Product
  variantId: string; // Referencia a ProductVariant
  barcode: string; // Para validación rápida
  productName: string; // Nombre del producto para display
  variantName: string; // Nombre de la variante
  currentStock: number; // Stock actual
  targetQuantity: number; // Cantidad objetivo
  scannedQuantity: number; // Cantidad escaneada
  priority: 'low' | 'medium' | 'high'; // Prioridad basada en stock
  physicalZone: string; // Zona física para ordenamiento
  completed: boolean; // Si el item fue completado
  completedAt?: Date; // Timestamp de completado
}

/**
 * Lista de reposición completa
 */
export interface RestockList {
  _id: string; // UUID único
  name: string; // Nombre de la lista
  userId: string; // ID del usuario que creó la lista
  status: 'active' | 'completed' | 'cancelled'; // Estado de la lista
  items: RestockItem[]; // Items ordenados por zona
  totalItems: number; // Total de items en la lista
  completedItems: number; // Items completados
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // Si toda la lista fue completada
}

// ===============================
// TIPOS DE MOVIMIENTOS
// ===============================

/**
 * Tipo de movimiento de inventario
 */
export type MovementType =
  | 'adjustment' // Ajuste de inventario
  | 'restock' // Reposición de mercadería
  | 'sale' // Venta
  | 'waste' // Descarte por vencimiento/daño
  | 'transfer'; // Transferencia entre ubicaciones

/**
 * Movimiento de inventario
 */
export interface InventoryMovement {
  _id: string; // UUID único
  variantId: string; // Referencia a ProductVariant
  type: MovementType;
  quantity: number; // Cantidad (positiva o negativa)
  previousStock: number; // Stock antes del movimiento
  newStock: number; // Stock después del movimiento
  resultingStock: number; // Stock resultante después del movimiento
  reason: string; // Razón del movimiento
  timestamp: Date;
  userId: string; // Usuario que realizó el movimiento
}

// ===============================
// TIPOS DE SINCRONIZACIÓN
// ===============================

/**
 * Tipo de operación de sincronización
 */
export type SyncOperationType =
  | 'product_update'
  | 'stock_adjustment'
  | 'list_completion';

/**
 * Operación pendiente de sincronización
 */
export interface SyncOperation {
  _id: string; // UUID único
  type: SyncOperationType;
  data: any; // Datos de la operación
  timestamp: Date; // Cuando se creó la operación
  synced: boolean; // Si ya fue sincronizada
  retries: number; // Número de reintentos
  lastError?: string; // Último error si falló
}

// ===============================
// TIPOS DE CONFIGURACIÓN
// ===============================

/**
 * Configuración de stock y alertas
 */
export interface StockSettings {
  defaultStockMinimo: number; // Stock mínimo por defecto
  restockFactor: number; // Factor de reposición (ej: 1.2)
  expirationAlertDays: number; // Días antes de vencimiento para alertar
  lowStockThreshold: number; // Umbral de stock bajo
  autoGenerateLists: boolean; // Auto-generar listas de reposición
}

/**
 * Configuración de zona física
 */
export interface ZoneConfiguration {
  sections: string[]; // Secciones disponibles
  locations: Record<string, string[]>; // Ubicaciones por sección
  defaultOrder: string[]; // Orden por defecto para recorrido
}

// ===============================
// TIPOS DE REPORTES
// ===============================

/**
 * Estadísticas de producto
 */
export interface ProductStats {
  variantId: string;
  productName: string;
  variantName: string;
  currentStock: number;
  averageDailyUsage: number;
  daysUntilStockout: number;
  suggestedReorderQuantity: number;
  lastRestockDate?: Date;
}

/**
 * Resumen de inventario
 */
export interface InventorySummary {
  totalProducts: number;
  totalVariants: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number; // Valor total del inventario
  lastUpdated: Date;
}

// ===============================
// TIPOS DE API
// ===============================

/**
 * Respuesta estándar de API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Parámetros de búsqueda
 */
export interface SearchParams {
  query?: string;
  category?: Partial<ProductCategory>;
  barcode?: string;
  lowStock?: boolean;
  expiring?: boolean;
  zone?: string;
  limit?: number;
  offset?: number;
}

/**
 * Resultado de sincronización
 */
export interface SyncResult {
  operationsProcessed: number;
  operationsSuccessful: number;
  operationsFailed: number;
  errors: string[];
  duration: number; // Duración en ms
}

// ===============================
// TIPOS AUXILIARES
// ===============================

/**
 * Resultado de operación con manejo de errores
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Estado de conexión
 */
export type ConnectionStatus = 'online' | 'offline' | 'syncing';

/**
 * Configuración de la aplicación
 */
export interface AppConfig {
  version: string;
  apiBaseUrl: string;
  syncInterval: number; // Intervalo de sincronización en ms
  maxRetries: number;
  stockSettings: StockSettings;
  zoneConfiguration: ZoneConfiguration;
  features: {
    predictiveRestock: boolean;
    barcodeScanning: boolean;
    pushNotifications: boolean;
    offlineMode: boolean;
  };
}
