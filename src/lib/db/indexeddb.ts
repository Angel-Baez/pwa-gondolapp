// Re-export database and core components
export { db } from './database';
export type { Database } from './database';

// Re-export repositories and services
export * from './repositories';
export * from '../services';

// Función para inicializar la base de datos
export const initializeDB = async (): Promise<void> => {
  try {
    const { db } = await import('./database');
    const { MaintenanceRepository } = await import('./repositories');

    await db.open();

    // Ejecutar limpieza de datos antiguos usando Repository
    const maintenanceRepo = new MaintenanceRepository(db);
    await maintenanceRepo.clearOldData();

    // Mostrar estadísticas iniciales
    await maintenanceRepo.getDatabaseStats();
    // IndexedDB initialized successfully with stats
  } catch (error) {
    throw new Error(`Error inicializando IndexedDB: ${error}`);
  }
};

// Función para resetear la base de datos (solo para desarrollo)
export const resetDB = async (): Promise<void> => {
  const { db } = await import('./database');
  await db.delete();
  await db.open();
};

// Función para exportar datos (placeholder)
export const exportData = async (): Promise<any> => {
  throw new Error('exportData not implemented yet');
};

// Función para importar datos (placeholder)
export const importData = async (_data: any): Promise<void> => {
  throw new Error('importData not implemented yet');
};

// Función para obtener estadísticas de la base de datos
export const getDatabaseStats = async () => {
  const { db } = await import('./database');
  const { MaintenanceRepository } = await import('./repositories');
  const maintenanceRepo = new MaintenanceRepository(db);
  return await maintenanceRepo.getDatabaseStats();
};

// Función para compactar la base de datos
export const compactDatabase = async () => {
  const { db } = await import('./database');
  const { MaintenanceRepository } = await import('./repositories');
  const maintenanceRepo = new MaintenanceRepository(db);
  return await maintenanceRepo.compactDatabase();
};
