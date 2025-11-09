import type {
  SyncOperation,
  SyncOperationType,
} from '../../types/inventory.types';
import type { ServiceResult } from '@/types/service.types';
import { SyncRepository } from '../db/repositories/SyncRepository';
import { ProductRepository } from '../db/repositories/ProductRepository';
import { RestockListRepository } from '../db/repositories/RestockListRepository';

export class SyncService {
  private isOnline = false;
  private lastSyncAttempt: Date | null = null;

  constructor(
    private syncRepo: SyncRepository,
    private productRepo: ProductRepository,
    private restockRepo: RestockListRepository
  ) {
    this.initializeOnlineStatus();
  }

  /**
   * Estado de sincronización
   */
  async getSyncStatus(): Promise<{
    success: boolean;
    data?: {
      isOnline: boolean;
      lastSync: Date | null;
      pendingOperations: number;
      failedOperations: number;
    };
    error?: Error;
  }> {
    try {
      const [pendingOps, failedOps] = await Promise.all([
        this.syncRepo.findPending(),
        this.syncRepo.findFailedOperations(),
      ]);

      return {
        success: true,
        data: {
          isOnline: this.isOnline,
          lastSync: this.lastSyncAttempt,
          pendingOperations: pendingOps.length,
          failedOperations: failedOps.length,
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Operaciones de sincronización
   */
  async syncAll(): Promise<
    ServiceResult<{
      synchronized: number;
      failed: number;
      errors: string[];
    }>
  > {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: new Error('No hay conexión a internet'),
        };
      }

      const results = await Promise.allSettled([
        this.syncProducts(),
        this.syncLists(),
        this.syncMovements(),
      ]);

      let synchronized = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          synchronized++;
        } else {
          failed++;
          if (result.status === 'rejected') {
            errors.push(result.reason?.message || 'Error desconocido');
          } else if (result.status === 'fulfilled' && !result.value.success) {
            errors.push(result.value.error.message);
          }
        }
      }

      this.lastSyncAttempt = new Date();

      return {
        success: true,
        data: { synchronized, failed, errors },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async syncProducts(): Promise<ServiceResult<void>> {
    try {
      const pendingProducts = await this.productRepo.findPendingSync();

      for (const product of pendingProducts) {
        try {
          // Simular sincronización con servidor
          await this.syncProductToServer(product);

          // Marcar como sincronizado
          await this.productRepo.update(product._id!, {
            needsSync: false,
            updatedAt: new Date(),
          });
        } catch (error) {
          // Encolar para reintento
          await this.queueOperation({
            type: 'product_update',
            data: product,
          });
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async syncLists(): Promise<ServiceResult<void>> {
    try {
      // Obtener listas que necesitan sincronización
      const pendingLists = await this.restockRepo.findCompleted();
      const recentLists = pendingLists.filter(list => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return list.completedAt && list.completedAt > dayAgo;
      });

      for (const list of recentLists) {
        try {
          await this.syncListToServer(list);
        } catch (error) {
          await this.queueOperation({
            type: 'list_completion',
            data: list,
          });
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async syncMovements(): Promise<ServiceResult<void>> {
    try {
      // Obtener operaciones de movimiento pendientes
      const movementOps = await this.syncRepo.findByType('stock_movement');

      for (const operation of movementOps) {
        try {
          await this.syncMovementToServer(operation.data);
          await this.syncRepo.markAsSynced(operation._id!);
        } catch (error) {
          await this.syncRepo.incrementRetries(
            operation._id!,
            error instanceof Error ? error.message : 'Error desconocido'
          );
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Gestión de cola offline
   */
  async queueOperation(operation: {
    type: SyncOperationType;
    data: any;
  }): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.syncRepo.add({
        type: operation.type,
        data: operation.data,
        synced: false,
        retries: 0,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async retryFailedOperations(): Promise<ServiceResult<number>> {
    try {
      const failedOps = await this.syncRepo.findFailedOperations();
      let retriedCount = 0;

      for (const operation of failedOps) {
        // Solo reintentar si no ha excedido el límite máximo
        if ((operation.retries || 0) < 5) {
          try {
            await this.processSyncOperation(operation);
            await this.syncRepo.markAsSynced(operation._id!);
            retriedCount++;
          } catch (error) {
            await this.syncRepo.incrementRetries(
              operation._id!,
              error instanceof Error ? error.message : 'Error en reintento'
            );
          }
        }
      }

      return { success: true, data: retriedCount };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async clearFailedOperations(): Promise<ServiceResult<void>> {
    try {
      const failedOps = await this.syncRepo.findFailedOperations();

      for (const operation of failedOps) {
        await this.syncRepo.delete(operation._id!);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Resolución de conflictos
   */
  async resolveConflict(
    operationId: string,
    resolution: 'local' | 'remote'
  ): Promise<ServiceResult<void>> {
    try {
      const operation = await this.syncRepo.findById(operationId);
      if (!operation) {
        return { success: false, error: new Error('Operación no encontrada') };
      }

      if (resolution === 'local') {
        // Forzar sincronización con datos locales
        await this.processSyncOperation(operation);
        await this.syncRepo.markAsSynced(operationId);
      } else {
        // Descartar cambios locales y marcar como sincronizado
        await this.syncRepo.markAsSynced(operationId);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getConflicts(): Promise<
    ServiceResult<
      Array<{
        operationId: string;
        type: string;
        localData: any;
        remoteData: any;
        timestamp: Date;
      }>
    >
  > {
    try {
      // En una implementación real, esto requeriría comparar con el servidor
      // Por ahora retornamos las operaciones que han fallado múltiples veces
      const problematicOps = await this.syncRepo.findFailedOperations();

      const conflicts = problematicOps
        .filter(op => (op.retries || 0) >= 3)
        .map(op => ({
          operationId: op._id!,
          type: op.type,
          localData: op.data,
          remoteData: null, // Se obtendría del servidor
          timestamp: op.timestamp,
        }));

      return { success: true, data: conflicts };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Métodos privados
   */
  private initializeOnlineStatus(): void {
    // Inicializar estado online/offline
    this.isOnline = navigator.onLine;

    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleConnectionRestored();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async handleConnectionRestored(): Promise<void> {
    // Auto-sincronizar cuando se restaure la conexión
    try {
      await this.syncAll();
    } catch (error) {
      // Error en sincronización automática - logged silently
    }
  }

  private async syncProductToServer(product: any): Promise<void> {
    // Simular llamada al servidor
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }

  private async syncListToServer(list: any): Promise<void> {
    // Simular llamada al servidor
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }

  private async syncMovementToServer(movement: any): Promise<void> {
    // Simular llamada al servidor
    const response = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movement),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }

  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'product_update':
        await this.syncProductToServer(operation.data);
        break;
      case 'stock_adjustment':
        await this.syncMovementToServer(operation.data);
        break;
      case 'list_completion':
        await this.syncListToServer(operation.data);
        break;
      default:
        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
    }
  }
}
