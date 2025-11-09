import type {
  RestockList,
  RestockItem,
  InventoryMovement,
} from '@/types/inventory.types';
import { db } from './database';

/**
 * Servicio para gestión de listas de reposición
 */
export class RestockService {
  /**
   * Crear lista de reposición optimizada por zona física
   */
  static async createList(
    name: string,
    items: Omit<RestockItem, 'completed' | 'completedAt'>[]
  ): Promise<string> {
    try {
      const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Ordenar items por zona física para optimizar recorrido
      const sortedItems: RestockItem[] = items
        .sort((a, b) => {
          if (a.zona.section !== b.zona.section) {
            return a.zona.section.localeCompare(b.zona.section);
          }
          return a.zona.sortOrder - b.zona.sortOrder;
        })
        .map(item => ({
          ...item,
          completed: false,
        }));

      // Calcular duración estimada (2 minutos por item base + tiempo de desplazamiento)
      const estimatedDuration =
        sortedItems.length * 2 + this.calculateTravelTime(sortedItems);

      await db.restockLists.add({
        _id: listId,
        name,
        items: sortedItems,
        createdAt: new Date(),
        estimatedDuration,
      });

      return listId;
    } catch (error) {
      throw new Error(`Error creando lista de reposición: ${error}`);
    }
  }

  /**
   * Calcular tiempo estimado de desplazamiento entre zonas
   */
  private static calculateTravelTime(items: RestockItem[]): number {
    if (items.length <= 1) return 0;

    let travelTime = 0;
    let currentSection = '';

    for (const item of items) {
      if (currentSection && currentSection !== item.zona.section) {
        travelTime += 3; // 3 minutos para cambiar de sección
      }
      currentSection = item.zona.section;
    }

    return travelTime;
  }

  /**
   * Completar item de lista de reposición
   */
  static async completeItem(
    listId: string,
    itemIndex: number,
    actualQuantity?: number
  ): Promise<void> {
    try {
      await db.transaction(
        'rw',
        [db.restockLists, db.products, db.pendingSync],
        async () => {
          const list = await db.restockLists.get(listId);
          if (!list) {
            throw new Error(`Lista ${listId} no encontrada`);
          }

          if (itemIndex >= list.items.length) {
            throw new Error('Índice de item inválido');
          }

          const item = list.items[itemIndex];
          if (item.completed) {
            throw new Error('Item ya completado');
          }

          // Marcar como completado
          list.items[itemIndex].completed = true;
          list.items[itemIndex].completedAt = new Date();

          if (actualQuantity !== undefined) {
            list.items[itemIndex].actualQuantity = actualQuantity;
          }

          // Verificar si toda la lista está completada
          const allCompleted = list.items.every(i => i.completed);
          if (allCompleted && !list.completedAt) {
            list.completedAt = new Date();
            list.actualDuration = Math.round(
              (list.completedAt.getTime() - list.createdAt.getTime()) /
                (1000 * 60)
            );
          }

          await db.restockLists.put(list);

          // Actualizar stock si se especificó cantidad
          const quantityToAdd = actualQuantity ?? item.quantity;
          if (quantityToAdd > 0) {
            await this.updateVariantStock(item.variantId, quantityToAdd);
          }
        }
      );
    } catch (error) {
      throw new Error(`Error completando item: ${error}`);
    }
  }

  /**
   * Actualizar stock directamente (método interno)
   */
  private static async updateVariantStock(
    variantId: string,
    quantityToAdd: number
  ): Promise<void> {
    const products = await db.products.toArray();

    for (const product of products) {
      const variantIndex = product.variants.findIndex(
        v => v.variantId === variantId
      );
      if (variantIndex !== -1) {
        product.variants[variantIndex].stock += quantityToAdd;
        product.updatedAt = new Date();
        await db.products.put(product);

        // Registrar movimiento
        const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.pendingSync.add({
          _id: movementId,
          type: 'movement',
          data: {
            type: 'restock',
            variantId,
            quantity: quantityToAdd,
            resultingStock: product.variants[variantIndex].stock,
            timestamp: new Date(),
          } as InventoryMovement,
          timestamp: new Date(),
          retries: 0,
          priority: 1,
        });
        break;
      }
    }
  }

  /**
   * Obtener listas de reposición activas
   */
  static async getActiveLists(): Promise<RestockList[]> {
    try {
      return await db.restockLists
        .where('completedAt')
        .equals(null as any)
        .reverse()
        .sortBy('createdAt');
    } catch (error) {
      throw new Error(`Error obteniendo listas activas: ${error}`);
    }
  }
}
