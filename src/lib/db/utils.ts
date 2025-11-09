import type {
  Product,
  ProductVariant,
  RestockItem,
  PhysicalZone,
} from '@/types/inventory.types';
import { DEFAULT_ZONES, STOCK_CONFIG } from './config';

/**
 * Utilidades para trabajar con IndexedDB
 */

/**
 * Generar ID único para operaciones
 */
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

/**
 * Generar SKU automático basado en código de barras
 */
export const generateSKU = (barcode: string, variantIndex: number): string => {
  const firstTenDigits = barcode.substring(0, 10);
  const letter = String.fromCharCode(65 + variantIndex); // A, B, C...
  return `${firstTenDigits}-${letter}`;
};

/**
 * Validar código de barras EAN-13 o EAN-8
 */
export const validateBarcode = (barcode: string): boolean => {
  if (!barcode || typeof barcode !== 'string') return false;

  // Verificar longitud (EAN-8 o EAN-13)
  if (barcode.length !== 8 && barcode.length !== 13) return false;

  // Verificar que solo contenga dígitos
  if (!/^\d+$/.test(barcode)) return false;

  // Validar dígito de control
  return validateBarcodeChecksum(barcode);
};

/**
 * Validar dígito de control de código de barras
 */
const validateBarcodeChecksum = (barcode: string): boolean => {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

/**
 * Calcular prioridad de reposición basada en stock
 */
export const calculateRestockPriority = (
  currentStock: number,
  minStock: number
): 'high' | 'medium' | 'low' => {
  if (currentStock === 0) return 'high';

  const ratio = currentStock / minStock;

  if (ratio <= STOCK_CONFIG.priorities.high.threshold) return 'high';
  if (ratio <= STOCK_CONFIG.priorities.medium.threshold) return 'medium';
  return 'low';
};

/**
 * Calcular cantidad sugerida de reposición
 */
export const calculateSuggestedQuantity = (
  currentStock: number,
  minStock: number,
  restockFactor: number = STOCK_CONFIG.restockFactor
): number => {
  const deficit = Math.max(0, minStock - currentStock);
  const suggestionBase = Math.round(minStock * restockFactor);
  return Math.max(deficit, suggestionBase);
};

/**
 * Formatear nombre de producto para display
 */
export const formatProductName = (
  product: Product,
  variant: ProductVariant
): string => {
  return `${product.brand} ${product.name} ${variant.size}`;
};

/**
 * Ordenar items por zona física para optimizar recorrido
 */
export const sortItemsByZone = <T extends { zona: PhysicalZone }>(
  items: T[]
): T[] => {
  return [...items].sort((a, b) => {
    // Primero por sección
    if (a.zona.section !== b.zona.section) {
      return a.zona.section.localeCompare(b.zona.section);
    }

    // Luego por orden dentro de la sección
    return a.zona.sortOrder - b.zona.sortOrder;
  });
};

/**
 * Encontrar zona física por nombre
 */
export const findZoneByName = (
  section: string,
  location: string
): PhysicalZone | null => {
  const zone = DEFAULT_ZONES.find(
    z => z.section === section && z.location === location
  );
  return zone ? { ...zone } : null;
};

/**
 * Obtener zonas de una sección específica
 */
export const getZonesBySection = (section: string): PhysicalZone[] => {
  return DEFAULT_ZONES.filter(z => z.section === section)
    .map(z => ({ ...z }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Calcular tiempo estimado de recorrido
 */
export const calculateEstimatedTime = (items: RestockItem[]): number => {
  if (items.length === 0) return 0;

  // Tiempo base por item (2 minutos)
  let totalTime = items.length * 2;

  // Tiempo adicional por cambio de sección
  let currentSection = '';
  for (const item of items) {
    if (currentSection && currentSection !== item.physicalZone) {
      totalTime += 3; // 3 minutos para cambiar de sección
    }
    currentSection = item.physicalZone;
  }

  return totalTime;
};

/**
 * Verificar si un producto está próximo a vencer
 */
export const isProductExpiring = (
  expirationDate: Date | undefined,
  daysThreshold: number = STOCK_CONFIG.expirationAlertDays
): boolean => {
  if (!expirationDate) return false;

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0;
};

/**
 * Calcular días hasta vencimiento
 */
export const getDaysUntilExpiry = (expirationDate: Date): number => {
  const now = new Date();
  return Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
};

/**
 * Verificar si un producto tiene stock bajo
 */
export const isLowStock = (currentStock: number, minStock: number): boolean => {
  return currentStock <= minStock;
};

/**
 * Calcular valor total de inventario para una variante
 */
export const calculateVariantValue = (variant: ProductVariant): number => {
  return variant.currentStock * variant.costPrice;
};

/**
 * Filtrar productos activos
 */
export const filterActiveProducts = (products: Product[]): Product[] => {
  return products.filter(p => p.isActive);
};

/**
 * Buscar producto por cualquier campo de texto
 */
export const searchProducts = (
  products: Product[],
  query: string
): Product[] => {
  if (!query.trim()) return products;

  const lowerQuery = query.toLowerCase();

  return products.filter(
    product =>
      product.baseProduct.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.name.toLowerCase().includes(lowerQuery) ||
      (product.description &&
        product.description.toLowerCase().includes(lowerQuery)) ||
      product.variants.some(
        variant =>
          variant.barcode.includes(query) ||
          variant.sku?.toLowerCase().includes(lowerQuery) ||
          variant.size.toLowerCase().includes(lowerQuery)
      )
  );
};

/**
 * Agrupar productos por categoría
 */
export const groupProductsByCategory = (
  products: Product[]
): Record<string, Product[]> => {
  return products.reduce(
    (groups, product) => {
      const category = product.category.level1;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
      return groups;
    },
    {} as Record<string, Product[]>
  );
};

/**
 * Validar integridad de datos de producto
 */
export const validateProduct = (product: Partial<Product>): string[] => {
  const errors: string[] = [];

  if (!product.baseProduct?.trim()) {
    errors.push('Nombre base del producto es requerido');
  }

  if (!product.brand?.trim()) {
    errors.push('Marca es requerida');
  }

  if (!product.name?.trim()) {
    errors.push('Nombre es requerido');
  }

  if (!product.category) {
    errors.push('Categoría es requerida');
  }

  if (!product.variants || product.variants.length === 0) {
    errors.push('Al menos una variante es requerida');
  } else {
    // Validar cada variante
    product.variants.forEach((variant, index) => {
      if (!variant.barcode?.trim()) {
        errors.push(`Variante ${index + 1}: Código de barras es requerido`);
      } else if (!validateBarcode(variant.barcode)) {
        errors.push(`Variante ${index + 1}: Código de barras inválido`);
      }

      if (!variant.size?.trim()) {
        errors.push(`Variante ${index + 1}: Tamaño es requerido`);
      }

      if (!variant.unit?.trim()) {
        errors.push(`Variante ${index + 1}: Unidad es requerida`);
      }

      if (variant.salePrice <= 0) {
        errors.push(`Variante ${index + 1}: Precio debe ser mayor a 0`);
      }

      if (variant.costPrice <= 0) {
        errors.push(`Variante ${index + 1}: Costo debe ser mayor a 0`);
      }

      if (variant.currentStock < 0) {
        errors.push(`Variante ${index + 1}: Stock no puede ser negativo`);
      }

      if (variant.minStock < 0) {
        errors.push(
          `Variante ${index + 1}: Stock mínimo no puede ser negativo`
        );
      }
    });

    // Verificar códigos de barras únicos
    const barcodes = product.variants.map(v => v.barcode);
    const uniqueBarcodes = new Set(barcodes);
    if (barcodes.length !== uniqueBarcodes.size) {
      errors.push('Los códigos de barras deben ser únicos');
    }
  }

  return errors;
};

/**
 * Validar datos de lista de reposición
 */
export const validateRestockList = (
  name: string,
  items: RestockItem[]
): string[] => {
  const errors: string[] = [];

  if (!name?.trim()) {
    errors.push('Nombre de lista es requerido');
  }

  if (!items || items.length === 0) {
    errors.push('Al menos un item es requerido');
  } else {
    items.forEach((item, index) => {
      if (!item.variantId?.trim()) {
        errors.push(`Item ${index + 1}: ID de variante es requerido`);
      }

      if (!item.barcode?.trim()) {
        errors.push(`Item ${index + 1}: Código de barras es requerido`);
      }

      if (item.targetQuantity <= 0) {
        errors.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
      }

      if (!item.productName?.trim()) {
        errors.push(`Item ${index + 1}: Nombre de producto es requerido`);
      }
    });
  }

  return errors;
};

/**
 * Limpiar datos de entrada
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Formatear número como moneda
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

/**
 * Formatear fecha relativa
 */
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return 'Hace menos de 1 hora';
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInDays < 30) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-AR');
  }
};

/**
 * Debounce function para búsquedas
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
