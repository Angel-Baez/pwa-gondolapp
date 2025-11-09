/**
 * IndexedDB Client para GondolApp PWA
 * Exporta todas las funcionalidades de la base de datos offline-first
 */

// Cliente principal y funciones de inicialización
export { db, initializeDB, resetDB, exportData, importData } from './indexeddb';

// Configuración y constantes
export {
  DB_CONFIG,
  STORES_CONFIG,
  STOCK_CONFIG,
  DEFAULT_ZONES,
  DEFAULT_CATEGORIES,
  ERROR_MESSAGES,
  DB_EVENTS,
  PERFORMANCE_CONFIG,
} from './config';

// Utilidades
export {
  generateId,
  generateSKU,
  validateBarcode,
  calculateRestockPriority,
  calculateSuggestedQuantity,
  formatProductName,
  sortItemsByZone,
  findZoneByName,
  getZonesBySection,
  calculateEstimatedTime,
  isProductExpiring,
  getDaysUntilExpiry,
  isLowStock,
  calculateVariantValue,
  filterActiveProducts,
  searchProducts,
  groupProductsByCategory,
  validateProduct,
  validateRestockList,
  sanitizeInput,
  formatCurrency,
  formatRelativeDate,
  debounce,
} from './utils';

// Funciones y utilidades principales
export {
  useIndexedDB,
  useInventoryStats,
  useIndexedDBMaintenance,
} from '@/hooks/useIndexedDB';

// Re-exportar tipos principales
export type {
  Product,
  ProductVariant,
  ProductCategory,
  PhysicalZone,
  RestockList,
  RestockItem,
  InventoryMovement,
  MovementType,
  SyncOperation,
  SyncOperationType,
  InventorySummary,
  ProductStats,
  StockSettings,
  ZoneConfiguration,
  ApiResponse,
  SearchParams,
  SyncResult,
  Result,
  ConnectionStatus,
  AppConfig,
} from '@/types/inventory.types';
