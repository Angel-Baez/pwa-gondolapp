export { ProductRepository } from './ProductRepository';
export { StockRepository } from './StockRepository';
export { RestockListRepository } from './RestockListRepository';
export { SyncRepository } from './SyncRepository';
export { MaintenanceRepository } from './MaintenanceRepository';

// Re-export de tipos para conveniencia
export type {
  IProductRepository,
  IStockRepository,
  IRestockListRepository,
  ISyncRepository,
  IMaintenanceRepository,
} from '../../../types/repository.types';
