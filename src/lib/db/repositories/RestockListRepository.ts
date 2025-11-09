import type { Database } from '../database';
import type { RestockList, RestockItem } from '../../../types/inventory.types';

export class RestockListRepository {
  constructor(private db: Database) {}

  /**
   * CRUD básico
   */
  async findAll(): Promise<RestockList[]> {
    return await this.db.restockLists.orderBy('createdAt').reverse().toArray();
  }

  async findById(id: string): Promise<RestockList | null> {
    const list = await this.db.restockLists.get(id);
    return list || null;
  }

  async create(
    list: Omit<RestockList, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<RestockList> {
    const newList: RestockList = {
      ...list,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RestockList;
    await this.db.restockLists.add(newList);
    return newList;
  }

  async update(id: string, list: Partial<RestockList>): Promise<void> {
    await this.db.restockLists.update(id, {
      ...list,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.restockLists.delete(id);
  }

  /**
   * Búsquedas específicas
   */
  async findActive(): Promise<RestockList[]> {
    return await this.db.restockLists
      .where('status')
      .equals('active')
      .reverse()
      .sortBy('createdAt');
  }

  async findCompleted(): Promise<RestockList[]> {
    return await this.db.restockLists
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('completedAt');
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<RestockList[]> {
    return await this.db.restockLists
      .where('createdAt')
      .between(startDate, endDate, true, true)
      .reverse()
      .sortBy('createdAt');
  }

  async findByUser(userId: string): Promise<RestockList[]> {
    return await this.db.restockLists
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  }

  /**
   * Operaciones en items
   */
  async updateItem(
    listId: string,
    itemIndex: number,
    item: Partial<RestockItem>
  ): Promise<void> {
    const list = await this.db.restockLists.get(listId);
    if (!list) {
      throw new Error(`RestockList with ID ${listId} not found`);
    }

    if (itemIndex < 0 || itemIndex >= list.items.length) {
      throw new Error(`Invalid item index ${itemIndex}`);
    }

    const updatedItems = [...list.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      ...item,
    };

    const updateData: Partial<RestockList> = {
      items: updatedItems,
      updatedAt: new Date(),
      totalItems: updatedItems.length,
      completedItems: updatedItems.filter(i => i.completed).length,
    };

    await this.db.restockLists.update(listId, updateData);
  }

  async markItemCompleted(
    listId: string,
    itemIndex: number,
    completedAt?: Date
  ): Promise<void> {
    const list = await this.db.restockLists.get(listId);
    if (!list) {
      throw new Error(`RestockList with ID ${listId} not found`);
    }

    if (itemIndex < 0 || itemIndex >= list.items.length) {
      throw new Error(`Invalid item index ${itemIndex}`);
    }

    const updatedItems = [...list.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      completed: true,
      completedAt: completedAt || new Date(),
    };

    // Verificar si todos los items están completados
    const allCompleted = updatedItems.every(item => item.completed);
    const updateData: Partial<RestockList> = {
      items: updatedItems,
      updatedAt: new Date(),
      totalItems: updatedItems.length,
      completedItems: updatedItems.filter(i => i.completed).length,
    };

    if (allCompleted && list.status !== 'completed') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    await this.db.restockLists.update(listId, updateData);
  }
}
