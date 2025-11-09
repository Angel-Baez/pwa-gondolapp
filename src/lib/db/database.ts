import Dexie, { Table } from 'dexie';
import type {
  Product,
  RestockList,
  SyncOperation,
  InventoryMovement,
} from '@/types/inventory.types';

/**
 * Interfaz Database para compatibilidad con repositories
 */
export interface Database extends Dexie {
  products: Table<Product, string>;
  restockLists: Table<RestockList, string>;
  inventoryMovements: Table<InventoryMovement, string>;
  syncOperations: Table<SyncOperation, string>;
}

/**
 * Cliente IndexedDB para GondolApp PWA
 * Implementa la estrategia offline-first con stores principales:
 * - products: Catálogo local sincronizado con MongoDB
 * - restockLists: Listas de reposición (solo local)
 * - inventoryMovements: Movimientos de inventario
 * - syncOperations: Cola de operaciones para sincronizar
 */
export class GondolAppDB extends Dexie implements Database {
  // Store para catálogo de productos (sincronizado)
  products!: Table<Product, string>;

  // Store para listas de reposición (solo local)
  restockLists!: Table<RestockList, string>;

  // Store para movimientos de inventario
  inventoryMovements!: Table<InventoryMovement, string>;

  // Store para cola de sincronización
  syncOperations!: Table<SyncOperation, string>;

  constructor() {
    super('GondolAppDB');

    this.version(1).stores({
      // Products: índices para búsquedas eficientes
      products:
        '++_id, sku, baseProduct, brand, category.level1, category.level2, category.level3, isActive, needsSync, createdAt, updatedAt',

      // RestockLists: índices para filtrado por fecha y estado
      restockLists:
        '++_id, name, userId, status, createdAt, updatedAt, completedAt',

      // InventoryMovements: índices para movimientos
      inventoryMovements: '++_id, variantId, type, timestamp, userId',

      // SyncOperations: índices para procesamiento de cola
      syncOperations: '++_id, type, timestamp, synced, retries',
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
        return (a.physicalZone || '').localeCompare(b.physicalZone || '');
      });
    });

    // Hook para operaciones de sincronización
    this.syncOperations.hook('creating', (_primKey: any, obj: any) => {
      if (!obj.priority) {
        obj.priority = 1; // Prioridad media por defecto
      }
    });
  }
}

// Instancia singleton de la base de datos
export const db = new GondolAppDB();
