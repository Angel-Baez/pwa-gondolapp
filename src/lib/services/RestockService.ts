import type { RestockList, RestockItem } from '@/types/inventory.types';
import type { ServiceResult } from '@/types/service.types';
import { RestockListRepository } from '../db/repositories/RestockListRepository';
import { ProductRepository } from '../db/repositories/ProductRepository';

export class RestockService {
  constructor(
    private restockRepo: RestockListRepository,
    private productRepo: ProductRepository
  ) {}

  /**
   * Gestión de listas
   */
  async createList(
    name: string,
    userId: string
  ): Promise<ServiceResult<string>> {
    try {
      if (!name?.trim()) {
        return {
          success: false,
          error: new Error('El nombre de la lista es requerido'),
        };
      }

      if (!userId?.trim()) {
        return {
          success: false,
          error: new Error('El ID de usuario es requerido'),
        };
      }

      const listData: Omit<RestockList, '_id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        userId,
        status: 'active',
        items: [],
        totalItems: 0,
        completedItems: 0,
      };

      const createdList = await this.restockRepo.create(listData);
      return { success: true, data: createdList._id };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async deleteList(listId: string): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      // Solo permitir eliminar listas completadas o vacías
      if (list.status === 'active' && list.items.length > 0) {
        const hasIncompleteItems = list.items.some(item => !item.completed);
        if (hasIncompleteItems) {
          return {
            success: false,
            error: new Error(
              'No se puede eliminar una lista activa con elementos pendientes'
            ),
          };
        }
      }

      await this.restockRepo.delete(listId);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Generación automática de listas
   */
  async generateAutomaticList(
    userId: string,
    options = {
      includeLowStock: true,
      includeExpiring: true,
      includeOutOfStock: true,
      maxItems: 50,
    }
  ): Promise<ServiceResult<string>> {
    try {
      const listName = `Lista Automática - ${new Date().toLocaleDateString()}`;
      const createResult = await this.createList(listName, userId);

      if (!createResult.success) {
        return createResult;
      }

      const listId = createResult.data;
      if (!listId) {
        return {
          success: false,
          error: new Error('Error obteniendo ID de lista'),
        };
      }
      const itemsToAdd: Array<Omit<RestockItem, 'completedAt' | 'completed'>> =
        [];

      // Agregar productos con stock bajo
      if (options.includeLowStock || options.includeOutOfStock) {
        const lowStockProducts = await this.productRepo.findBelowMinStock();

        for (const { product, variant, deficit } of lowStockProducts) {
          if (options.includeOutOfStock || variant.currentStock > 0) {
            const suggestedQuantity = Math.ceil(variant.minStock * 1.2);

            itemsToAdd.push({
              _id: crypto.randomUUID(),
              productId: product._id!,
              variantId: variant._id!,
              productName: product.name,
              variantName: variant.name,
              barcode: variant.barcode,
              currentStock: variant.currentStock,
              targetQuantity: suggestedQuantity,
              scannedQuantity: 0,
              priority: deficit > variant.minStock * 0.8 ? 'high' : 'medium',
              physicalZone: product.physicalZone,
            });
          }
        }
      }

      // Agregar productos próximos a vencer
      if (options.includeExpiring) {
        const expiringProducts = await this.productRepo.findExpiring(7);

        for (const { product, variant, daysUntilExpiry } of expiringProducts) {
          // Evitar duplicados
          const exists = itemsToAdd.some(
            item =>
              item.productId === product._id && item.variantId === variant._id
          );

          if (!exists) {
            itemsToAdd.push({
              _id: crypto.randomUUID(),
              productId: product._id!,
              variantId: variant._id!,
              productName: product.name,
              variantName: variant.name,
              barcode: variant.barcode,
              currentStock: variant.currentStock,
              targetQuantity: Math.ceil(variant.minStock * 1.5),
              scannedQuantity: 0,
              priority: daysUntilExpiry <= 2 ? 'high' : 'medium',
              physicalZone: product.physicalZone,
            });
          }
        }
      }

      // Limitar número de items
      const finalItems = itemsToAdd
        .sort((a, b) => {
          // Ordenar por prioridad y zona física
          if (a.priority !== b.priority) {
            return a.priority === 'high' ? -1 : 1;
          }
          return (a.physicalZone || '').localeCompare(b.physicalZone || '');
        })
        .slice(0, options.maxItems);

      if (finalItems.length > 0) {
        const addResult = await this.addMultipleItems(listId, finalItems);
        if (!addResult.success) {
          return addResult;
        }
      }

      return { success: true, data: listId };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Gestión de items
   */
  async addItemToList(
    listId: string,
    item: Omit<RestockItem, 'completedAt' | 'completed'>
  ): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      if (list.status === 'completed') {
        return {
          success: false,
          error: new Error('No se pueden agregar items a una lista completada'),
        };
      }

      // Validar que el producto existe
      const product = await this.productRepo.findById(item.productId);
      if (!product) {
        return { success: false, error: new Error('Producto no encontrado') };
      }

      const newItem: RestockItem = {
        ...item,
        completed: false,
      };

      const updatedItems = [...list.items, newItem];

      await this.restockRepo.update(listId, {
        items: updatedItems,
        totalItems: updatedItems.length,
        completedItems: updatedItems.filter(i => i.completed).length,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async updateItem(
    listId: string,
    itemIndex: number,
    updates: Partial<RestockItem>
  ): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      if (itemIndex < 0 || itemIndex >= list.items.length) {
        return { success: false, error: new Error('Índice de item inválido') };
      }

      await this.restockRepo.updateItem(listId, itemIndex, updates);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async removeItemFromList(
    listId: string,
    itemIndex: number
  ): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      if (itemIndex < 0 || itemIndex >= list.items.length) {
        return { success: false, error: new Error('Índice de item inválido') };
      }

      const updatedItems = list.items.filter((_, index) => index !== itemIndex);

      await this.restockRepo.update(listId, {
        items: updatedItems,
        totalItems: updatedItems.length,
        completedItems: updatedItems.filter(item => item.completed).length,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async markItemCompleted(
    listId: string,
    itemIndex: number
  ): Promise<ServiceResult<void>> {
    try {
      await this.restockRepo.markItemCompleted(listId, itemIndex);

      // Actualizar contadores
      const list = await this.restockRepo.findById(listId);
      if (list) {
        const completedItems = list.items.filter(item => item.completed).length;
        await this.restockRepo.update(listId, {
          completedItems: completedItems,
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Operaciones en lote
   */
  async addMultipleItems(
    listId: string,
    items: Array<Omit<RestockItem, 'completedAt' | 'completed'>>
  ): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      const newItems: RestockItem[] = items.map(item => ({
        ...item,
        completed: false,
      }));

      const updatedItems = [...list.items, ...newItems];

      await this.restockRepo.update(listId, {
        items: updatedItems,
        totalItems: updatedItems.length,
        completedItems: updatedItems.filter(i => i.completed).length,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async markAllItemsCompleted(listId: string): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      const completedItems = list.items.map(item => ({
        ...item,
        completed: true,
        completedAt: item.completedAt || new Date(),
      }));

      await this.restockRepo.update(listId, {
        items: completedItems,
        completedItems: completedItems.length,
        status: 'completed',
        completedAt: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Organización y optimización
   */
  async sortListByZone(listId: string): Promise<ServiceResult<void>> {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      const sortedItems = [...list.items].sort((a, b) => {
        // Primero por zona física, luego por prioridad
        const zoneComparison = (a.physicalZone || '').localeCompare(
          b.physicalZone || ''
        );
        if (zoneComparison !== 0) return zoneComparison;

        if (a.priority !== b.priority) {
          return a.priority === 'high' ? -1 : 1;
        }

        return a.productName.localeCompare(b.productName);
      });

      await this.restockRepo.update(listId, {
        items: sortedItems,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async optimizeListRoute(listId: string): Promise<ServiceResult<void>> {
    // Por ahora solo ordenamos por zona, pero aquí se podría implementar
    // un algoritmo más sofisticado de optimización de rutas
    return await this.sortListByZone(listId);
  }

  /**
   * Consultas
   */
  async getActiveList(
    userId: string
  ): Promise<ServiceResult<RestockList | null>> {
    try {
      const activeLists = await this.restockRepo.findActive();
      const userActiveList = activeLists.find(list => list.userId === userId);

      return { success: true, data: userActiveList || null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getListProgress(listId: string): Promise<
    ServiceResult<{
      totalItems: number;
      completedItems: number;
      percentComplete: number;
      estimatedTimeRemaining: number;
    }>
  > {
    try {
      const list = await this.restockRepo.findById(listId);
      if (!list) {
        return { success: false, error: new Error('Lista no encontrada') };
      }

      const totalItems = list.items.length;
      const completedItems = list.items.filter(item => item.completed).length;
      const percentComplete =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Estimar tiempo restante basado en items pendientes
      const pendingItems = totalItems - completedItems;
      const estimatedTimePerItem = 2; // 2 minutos por item promedio
      const estimatedTimeRemaining = pendingItems * estimatedTimePerItem;

      return {
        success: true,
        data: {
          totalItems,
          completedItems,
          percentComplete,
          estimatedTimeRemaining,
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getUserLists(
    userId: string,
    includeCompleted = false
  ): Promise<ServiceResult<RestockList[]>> {
    try {
      const userLists = await this.restockRepo.findByUser(userId);

      if (!includeCompleted) {
        const activeLists = userLists.filter(list => list.status === 'active');
        return { success: true, data: activeLists };
      }

      return { success: true, data: userLists };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
