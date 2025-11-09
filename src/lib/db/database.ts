import Dexie, { Table } from 'dexie';
import type {
  Product,
  RestockList,
  SyncOperation,
  ProductStats,
} from '@/types/inventory.types';

/**
 * Cliente IndexedDB para GondolApp PWA
 * Implementa la estrategia offline-first con tres stores principales:
 * - products: Catálogo local sincronizado con MongoDB
 * - restockLists: Listas de reposición (solo local)
 * - pendingSync: Cola de operaciones para sincronizar
 */
export class GondolAppDB extends Dexie {
  // Store para catálogo de productos (sincronizado)
  products!: Table<Product>;

  // Store para listas de reposición (solo local)
  restockLists!: Table<RestockList>;

  // Store para cola de sincronización
  pendingSync!: Table<SyncOperation>;

  // Store para estadísticas de productos (cache local)
  productStats!: Table<ProductStats>;

  constructor() {
    super('GondolAppDB');

    this.version(1).stores({
      // Products: índices para búsquedas eficientes
      products:
        '++_id, baseProduct, brand, category.level1, category.level2, category.level3, isActive, createdAt, updatedAt',

      // RestockLists: índices para filtrado por fecha y estado
      restockLists: '++_id, name, createdAt, completedAt, createdBy',

      // PendingSync: índices para procesamiento de cola
      pendingSync: '++_id, type, timestamp, retries, priority',

      // ProductStats: índices para análisis
      productStats:
        '++variantId, totalMovements, daysOfStock, turnoverRate, lastMovementDate',
    });

    // Configurar hooks para validación y consistencia
    this.setupHooks();
  }

  /**
   * Configurar hooks para validación y consistencia de datos
   */
  private setupHooks(): void {
    // Hook para validar productos antes de guardar
    this.products.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();

      // Validar que cada variante tenga código de barras único
      const barcodes = obj.variants.map(v => v.barcode);
      if (new Set(barcodes).size !== barcodes.length) {
        throw new Error('Códigos de barras duplicados en variantes');
      }

      // Auto-generar SKUs si no existen
      obj.variants = obj.variants.map(variant => {
        if (!variant.sku) {
          const firstTenDigits = variant.barcode.substring(0, 10);
          const variantIndex = obj.variants.indexOf(variant);
          const letter = String.fromCharCode(65 + variantIndex); // A, B, C...
          variant.sku = `${firstTenDigits}-${letter}`;
        }
        return variant;
      });
    });

    this.products.hook('updating', modifications => {
      (modifications as any).updatedAt = new Date();
    });

    // Hook para listas de reposición
    this.restockLists.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();

      // Ordenar items por zona física
      obj.items = obj.items.sort((a, b) => {
        if (a.zona.section !== b.zona.section) {
          return a.zona.section.localeCompare(b.zona.section);
        }
        return a.zona.sortOrder - b.zona.sortOrder;
      });
    });

    // Hook para operaciones de sincronización
    this.pendingSync.hook('creating', (_primKey, obj) => {
      if (!obj.priority) {
        obj.priority = 1; // Prioridad media por defecto
      }
    });
  }
}

// Instancia singleton de la base de datos
export const db = new GondolAppDB();
