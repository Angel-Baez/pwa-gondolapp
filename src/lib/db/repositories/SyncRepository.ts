import type { Database } from '../database';
import type { SyncOperation } from '../../../types/inventory.types';

export class SyncRepository {
  constructor(private db: Database) {}

  /**
   * CRUD básico
   */
  async findAll(): Promise<SyncOperation[]> {
    return await this.db.syncOperations
      .orderBy('timestamp')
      .reverse()
      .toArray();
  }

  async findById(id: string): Promise<SyncOperation | null> {
    const operation = await this.db.syncOperations.get(id);
    return operation || null;
  }

  async add(operation: Omit<SyncOperation, '_id'>): Promise<SyncOperation> {
    const newOperation: SyncOperation = {
      _id: crypto.randomUUID(),
      ...operation,
    };
    await this.db.syncOperations.add(newOperation);
    return newOperation;
  }

  async update(id: string, operation: Partial<SyncOperation>): Promise<void> {
    await this.db.syncOperations.update(id, operation);
  }

  async delete(id: string): Promise<void> {
    await this.db.syncOperations.delete(id);
  }

  /**
   * Gestión de cola
   */
  async findPending(): Promise<SyncOperation[]> {
    return await this.db.syncOperations
      .where('synced')
      .equals(0)
      .sortBy('timestamp');
  }

  async findByType(type: string): Promise<SyncOperation[]> {
    return await this.db.syncOperations
      .where('type')
      .equals(type)
      .sortBy('timestamp');
  }

  async findFailedOperations(): Promise<SyncOperation[]> {
    return await this.db.syncOperations
      .where('retries')
      .above(0)
      .and((operation: SyncOperation) => !operation.synced)
      .sortBy('timestamp');
  }

  /**
   * Operaciones de sincronización
   */
  async markAsSynced(id: string): Promise<void> {
    await this.db.syncOperations.update(id, {
      synced: true,
      lastError: undefined,
    });
  }

  async incrementRetries(id: string, errorMessage?: string): Promise<void> {
    const operation = await this.db.syncOperations.get(id);
    if (!operation) {
      throw new Error(`SyncOperation with ID ${id} not found`);
    }

    await this.db.syncOperations.update(id, {
      retries: (operation.retries || 0) + 1,
      lastError: errorMessage,
    });
  }

  async resetRetries(id: string): Promise<void> {
    await this.db.syncOperations.update(id, {
      retries: 0,
      lastError: undefined,
    });
  }
}
