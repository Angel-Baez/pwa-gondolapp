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
  variantId: string; // UUID único
  barcode: string; // Código de barras EAN-13/EAN-8
  sku: string; // Auto-generado: {first10digits}-{A/B/C}
  size: string; // Ej: "1L", "500ml", "2kg"
  unit: string; // Ej: "unidad", "kg", "litro"
  price: number; // Precio unitario
  cost: number; // Costo de compra
  stock: number; // Stock actual
  stockMinimo: number; // Stock mínimo para alertas
  expirationDate?: Date; // Fecha de vencimiento (opcional)
  zona: PhysicalZone; // Ubicación física
}

/**
 * Producto base (marca + nombre)
 * Contiene múltiples variantes con diferentes códigos de barras
 */
export interface Product {
  _id: string; // MongoDB ObjectId o UUID para IndexedDB
  baseProduct: string; // Ej: "Leche Milex"
  brand: string; // Ej: "Milex"
  name: string; // Ej: "Leche"
  description?: string; // Descripción opcional
  category: ProductCategory; // Categoría jerárquica
  variants: ProductVariant[]; // Array de variantes
  imageUrl?: string; // URL de imagen del producto
  isActive: boolean; // Si el producto está activo
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
  variantId: string; // Referencia a ProductVariant
  barcode: string; // Para validación rápida
  productName: string; // Nombre del producto para display
  size: string; // Tamaño de la variante
  quantity: number; // Cantidad sugerida
  actualQuantity?: number; // Cantidad real escaneada
  zona: PhysicalZone; // Para ordenamiento por ubicación
  priority: 'high' | 'medium' | 'low'; // Prioridad basada en stock
  completed: boolean; // Si el item fue completado
  completedAt?: Date; // Timestamp de completado
  notes?: string; // Notas adicionales
}

/**
 * Lista de reposición completa
 */
export interface RestockList {
  _id: string; // UUID único
  name: string; // Nombre de la lista
  items: RestockItem[]; // Items ordenados por zona
  createdAt: Date;
  completedAt?: Date; // Si toda la lista fue completada
  estimatedDuration?: number; // Duración estimada en minutos
  actualDuration?: number; // Duración real
  createdBy?: string; // Usuario que creó la lista
  completedBy?: string; // Usuario que completó la lista
}

// ===============================
// TIPOS DE MOVIMIENTOS
// ===============================

/**
 * Tipo de movimiento de inventario
 */
export type MovementType =
  | 'restock' // Reposición de mercadería
  | 'discard' // Descarte por vencimiento/daño
  | 'sale' // Venta (futuro)
  | 'adjustment' // Ajuste de inventario
  | 'transfer'; // Transferencia entre ubicaciones

/**
 * Movimiento de inventario
 */
export interface InventoryMovement {
  _id: string; // UUID único
  type: MovementType;
  variantId: string; // Referencia a ProductVariant
  quantity: number; // Cantidad (positiva o negativa)
  resultingStock: number; // Stock resultante después del movimiento
  reason?: string; // Razón del movimiento
  location?: string; // Ubicación donde ocurrió
  timestamp: Date;
  userId?: string; // Usuario que realizó el movimiento
  batchId?: string; // Para agrupar movimientos relacionados
  metadata?: Record<string, any>; // Datos adicionales
}

// ===============================
// TIPOS DE SINCRONIZACIÓN
// ===============================

/**
 * Tipo de operación de sincronización
 */
export type SyncOperationType =
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'movement'
  | 'bulk_update';

/**
 * Operación pendiente de sincronización
 */
export interface SyncOperation {
  _id: string; // UUID único
  type: SyncOperationType;
  data: any; // Datos de la operación
  timestamp: Date; // Cuando se creó la operación
  retries: number; // Número de reintentos
  lastError?: string; // Último error si falló
  priority: number; // Prioridad de sincronización (0 = alta)
  batchId?: string; // Para agrupar operaciones relacionadas
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
  totalMovements: number;
  averageStock: number;
  daysOfStock: number; // Días de stock estimados
  turnoverRate: number; // Rotación de inventario
  lastRestockDate?: Date;
  lastMovementDate?: Date;
}

/**
 * Resumen de inventario
 */
export interface InventorySummary {
  totalProducts: number;
  totalVariants: number;
  totalValue: number; // Valor total del inventario
  lowStockCount: number;
  expiringCount: number;
  lastSyncDate?: Date;
  healthScore: number; // Score de salud del inventario (0-100)
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
