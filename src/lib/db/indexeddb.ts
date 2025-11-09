// Re-export database and services
export { db } from './database';
export { ProductSearchService } from './productSearchService';
export { RestockService } from './restockService';
export { StockService } from './stockService';
export { DatabaseUtilsService } from './databaseUtils';

// Función para inicializar la base de datos
export const initializeDB = async (): Promise<void> => {
  try {
    const { db } = await import('./database');
    const { DatabaseUtilsService } = await import('./databaseUtils');

    await db.open();

    // Ejecutar limpieza de datos antiguos
    await DatabaseUtilsService.cleanupOldData();

    // Mostrar estadísticas iniciales
    const stats = await DatabaseUtilsService.getStats();
    // eslint-disable-next-line no-console
    console.log('✅ IndexedDB inicializada correctamente - Stats:', stats);
  } catch (error) {
    throw new Error(`Error inicializando IndexedDB: ${error}`);
  }
};

// Función para resetear la base de datos (solo para desarrollo)
export const resetDB = async (): Promise<void> => {
  const { DatabaseUtilsService } = await import('./databaseUtils');
  await DatabaseUtilsService.resetDatabase();
};

// Función para exportar datos (backup)
export const exportData = async () => {
  const { DatabaseUtilsService } = await import('./databaseUtils');
  return await DatabaseUtilsService.exportData();
};

// Función para importar datos (restore)
export const importData = async (data: {
  products: any[];
  restockLists: any[];
}) => {
  const { DatabaseUtilsService } = await import('./databaseUtils');
  await DatabaseUtilsService.importData(data);
};
