/**
 * Configuración y constantes para IndexedDB
 */

export const DB_CONFIG = {
  name: 'GondolAppDB',
  version: 1,
  maxRetries: 3,
  syncInterval: 30000, // 30 segundos
  cleanupInterval: 86400000, // 24 horas
  maxOfflineOperations: 1000,
} as const;

/**
 * Configuración de stores
 */
export const STORES_CONFIG = {
  products: {
    indexes:
      '++_id, baseProduct, brand, category.level1, category.level2, category.level3, isActive, createdAt, updatedAt',
    cacheDuration: 3600000, // 1 hora
  },
  restockLists: {
    indexes: '++_id, name, createdAt, completedAt, createdBy',
    cacheDuration: 1800000, // 30 minutos
  },
  pendingSync: {
    indexes: '++_id, type, timestamp, retries, priority',
    cacheDuration: 0, // No cache para operaciones pendientes
  },
  productStats: {
    indexes:
      '++variantId, totalMovements, daysOfStock, turnoverRate, lastMovementDate',
    cacheDuration: 7200000, // 2 horas
  },
} as const;

/**
 * Configuración de stock
 */
export const STOCK_CONFIG = {
  defaultMinStock: 10,
  restockFactor: 1.2,
  expirationAlertDays: 7,
  lowStockThreshold: 0.2, // 20% del stock mínimo
  priorities: {
    high: { color: '#ef4444', threshold: 0 },
    medium: { color: '#f59e0b', threshold: 0.5 },
    low: { color: '#10b981', threshold: 1 },
  },
} as const;

/**
 * Configuración de zonas físicas por defecto
 */
export const DEFAULT_ZONES = [
  { section: 'Lácteos', location: 'Estante Alto Izquierda', sortOrder: 1 },
  { section: 'Lácteos', location: 'Estante Alto Centro', sortOrder: 2 },
  { section: 'Lácteos', location: 'Estante Alto Derecha', sortOrder: 3 },
  { section: 'Lácteos', location: 'Estante Bajo Izquierda', sortOrder: 4 },
  { section: 'Lácteos', location: 'Estante Bajo Centro', sortOrder: 5 },
  { section: 'Lácteos', location: 'Estante Bajo Derecha', sortOrder: 6 },
  { section: 'Carnes', location: 'Cámara Frigorífica A', sortOrder: 7 },
  { section: 'Carnes', location: 'Cámara Frigorífica B', sortOrder: 8 },
  { section: 'Verduras', location: 'Estante Refrigerado 1', sortOrder: 9 },
  { section: 'Verduras', location: 'Estante Refrigerado 2', sortOrder: 10 },
  { section: 'Panadería', location: 'Estante Principal', sortOrder: 11 },
  { section: 'Bebidas', location: 'Góndola Central', sortOrder: 12 },
  { section: 'Limpieza', location: 'Estante Superior', sortOrder: 13 },
  { section: 'Perfumería', location: 'Vitrina Principal', sortOrder: 14 },
] as const;

/**
 * Configuración de categorías por defecto
 */
export const DEFAULT_CATEGORIES = {
  Lácteos: {
    Leches: ['Entera', 'Descremada', 'Semidescremada', 'Deslactosada'],
    Yogures: ['Natural', 'Sabores', 'Griego', 'Bebible'],
    Quesos: ['Frescos', 'Duros', 'Procesados', 'Especiales'],
    Manteca: ['Común', 'Con sal', 'Sin sal'],
  },
  Carnes: {
    Res: ['Cortes finos', 'Cortes comunes', 'Picada'],
    Pollo: ['Entero', 'Trozado', 'Pechuga', 'Muslo'],
    Cerdo: ['Chuleta', 'Costilla', 'Bondiola'],
    Embutidos: ['Jamón', 'Salame', 'Mortadela', 'Chorizo'],
  },
  Verduras: {
    'Hoja verde': ['Lechuga', 'Espinaca', 'Acelga', 'Rúcula'],
    Tubérculos: ['Papa', 'Batata', 'Zanahoria'],
    Frutas: ['Tomate', 'Pimiento', 'Zapallito'],
  },
  Panadería: {
    Pan: ['Francés', 'Integral', 'Especiales'],
    Facturas: ['Dulces', 'Saladas'],
  },
  Bebidas: {
    Gaseosas: ['Cola', 'Naranja', 'Lima', 'Agua tónica'],
    Jugos: ['Naranja', 'Manzana', 'Multifruta'],
    Agua: ['Natural', 'Con gas', 'Saborizada'],
  },
  Limpieza: {
    Detergentes: ['Ropa', 'Vajilla', 'Multiuso'],
    Desodorantes: ['Ambiente', 'Ropa', 'Baño'],
  },
  Perfumería: {
    'Cuidado personal': ['Shampoo', 'Jabón', 'Crema dental'],
    Cosmética: ['Maquillaje', 'Cremas', 'Perfumes'],
  },
} as const;

/**
 * Mensajes de error estándar
 */
export const ERROR_MESSAGES = {
  DB_INIT_FAILED: 'Error inicializando base de datos',
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  VARIANT_NOT_FOUND: 'Variante no encontrada',
  LIST_NOT_FOUND: 'Lista no encontrada',
  BARCODE_DUPLICATE: 'Código de barras duplicado',
  INVALID_STOCK: 'Stock inválido',
  SYNC_FAILED: 'Error en sincronización',
  NETWORK_ERROR: 'Error de conexión',
  INSUFFICIENT_STOCK: 'Stock insuficiente',
  EXPIRED_PRODUCT: 'Producto vencido',
} as const;

/**
 * Eventos del sistema
 */
export const DB_EVENTS = {
  INITIALIZED: 'db:initialized',
  SYNC_START: 'db:sync:start',
  SYNC_SUCCESS: 'db:sync:success',
  SYNC_ERROR: 'db:sync:error',
  STOCK_LOW: 'stock:low',
  PRODUCT_EXPIRING: 'product:expiring',
  LIST_COMPLETED: 'list:completed',
  OPERATION_QUEUED: 'operation:queued',
} as const;

/**
 * Configuración de performance
 */
export const PERFORMANCE_CONFIG = {
  batchSize: 100, // Tamaño de lote para operaciones bulk
  indexThreshold: 1000, // Umbral para crear índices adicionales
  memoryLimit: 50 * 1024 * 1024, // 50MB límite de memoria
  maxConcurrentOps: 5, // Máximo operaciones concurrentes
} as const;
