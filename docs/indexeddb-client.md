# IndexedDB Client - GondolApp PWA

## 📋 Descripción

Cliente IndexedDB con Dexie implementado para GondolApp PWA, diseñado para soportar funcionalidad **offline-first** en gestión de inventario de supermercados.

## 🏗️ Arquitectura

### Stores Principales

| Store              | Propósito                         | Sincronización               |
| ------------------ | --------------------------------- | ---------------------------- |
| **`products`**     | Catálogo de productos y variantes | ✅ Bidireccional con MongoDB |
| **`restockLists`** | Listas de reposición diarias      | ❌ Solo local (IndexedDB)    |
| **`pendingSync`**  | Cola de operaciones offline       | ✅ Append-only a MongoDB     |
| **`productStats`** | Estadísticas de productos         | ✅ Cache local               |

### Estrategia de Datos de Tres Niveles

```
📊 Datos de Catálogo    → MongoDB + IndexedDB (sincronizado)
📝 Listas Diarias      → IndexedDB únicamente (más rápido)
📈 Historial Movim.    → MongoDB únicamente (auditoria)
```

## 🚀 Uso Básico

### Inicialización

```typescript
import { initializeDB, db } from '@/lib/db';

// Inicializar al cargar la app
await initializeDB();
```

### Buscar Productos

```typescript
// Por código de barras (escaneo)
const result = await db.findProductByBarcode('7791234567890');
if (result) {
  const { product, variant } = result;
}

// Búsqueda por texto
const products = await db.searchProducts('leche milex');

// Productos con stock bajo
const lowStock = await db.getProductsBelowMinStock();
```

### Gestión de Stock

```typescript
// Actualizar stock (transacción atómica)
await db.updateVariantStock(
  variantId,
  newStock,
  'restock', // tipo de movimiento
  'Reposición semanal', // razón
  userId
);
```

### Listas de Reposición

```typescript
// Crear lista optimizada por zona
const listId = await db.createRestockList('Lista Matutina', items);

// Completar item con escáner
await db.completeRestockItem(listId, itemIndex, actualQuantity);

// Obtener listas activas
const activeLists = await db.getActiveRestockLists();
```

## 📱 Hooks Reactivos

### useProducts - Gestión de Productos

```typescript
const { products, loading, error, searchProducts, findByBarcode } =
  useProducts();

// Buscar por código de barras
const result = await findByBarcode(scannedCode);
```

### useStock - Control de Inventario

```typescript
const { lowStockItems, expiringItems, updateStock, generateSuggestions } =
  useStock();

// Actualizar stock con validación
await updateStock(variantId, newQuantity, 'restock');

// Generar sugerencias automáticas
const suggestions = await generateSuggestions();
```

### useRestockLists - Listas de Trabajo

```typescript
const { lists, activeLists, createList, completeItem } = useRestockLists();

// Crear nueva lista
const listId = await createList('Reposición Lácteos', items);

// Completar item
await completeItem(listId, 0, actualQuantity);
```

### useInventoryStats - Estadísticas

```typescript
const { stats, loading } = useInventoryStats();

console.log(`Health Score: ${stats?.healthScore}%`);
console.log(`Stock Bajo: ${stats?.lowStockCount} items`);
```

## 🔄 Sincronización Offline

### Cola de Operaciones

```typescript
const { pendingOperations, markAsSynced } = useSync();

// Procesar cola cuando hay conexión
for (const op of pendingOperations) {
  try {
    await syncToServer(op);
    await markAsSynced(op._id);
  } catch (error) {
    await incrementRetries(op._id, error.message);
  }
}
```

### Flujo de Sincronización

1. **Operación Offline** → Se agrega a `pendingSync`
2. **Conexión Detectada** → Procesar cola por prioridad
3. **Éxito** → Eliminar de cola
4. **Error** → Incrementar reintentos (máx 3)

## 🛠️ Utilidades

### Validación de Códigos de Barras

```typescript
import { validateBarcode } from '@/lib/db';

if (validateBarcode(scannedCode)) {
  // Código válido EAN-13/EAN-8
}
```

### Cálculos de Reposición

```typescript
import { calculateSuggestedQuantity, calculateRestockPriority } from '@/lib/db';

const quantity = calculateSuggestedQuantity(currentStock, minStock);
const priority = calculateRestockPriority(currentStock, minStock);
```

### Ordenamiento por Zona

```typescript
import { sortItemsByZone } from '@/lib/db';

// Optimizar recorrido físico
const optimizedItems = sortItemsByZone(restockItems);
```

## 📊 Configuración

### Zonas Físicas Predefinidas

```typescript
import { DEFAULT_ZONES, getZonesBySection } from '@/lib/db';

const lacteosZones = getZonesBySection('Lácteos');
// → ['Estante Alto Izquierda', 'Estante Alto Centro', ...]
```

### Configuración de Stock

```typescript
import { STOCK_CONFIG } from '@/lib/db';

const {
  defaultMinStock, // 10
  restockFactor, // 1.2
  expirationAlertDays, // 7
} = STOCK_CONFIG;
```

## 🔧 Mantenimiento

### Limpieza Automática

```typescript
const { runCleanup, exportData, lastCleanup } = useMaintenance();

// Limpieza manual
await runCleanup();

// Exportar backup
await exportData(); // Descarga JSON
```

### Performance

- **Límite IndexedDB**: ~50MB en dispositivos móviles
- **Batch Size**: 100 operaciones por lote
- **Auto-cleanup**: Cada 24 horas
- **Índices optimizados** para búsquedas frecuentes

## 🚨 Manejo de Errores

### Validación de Datos

```typescript
import { validateProduct, validateRestockList } from '@/lib/db';

const errors = validateProduct(productData);
if (errors.length > 0) {
  console.error('Errores de validación:', errors);
}
```

### Transacciones Atómicas

```typescript
// Todas las operaciones son atómicas
await db.transaction('rw', [db.products, db.pendingSync], async () => {
  // Si cualquier operación falla, todas se revierten
  await updateProduct();
  await queueSync();
});
```

## 📱 Consideraciones Móviles

### Optimizaciones Touch

- **Targets táctiles**: Mínimo 44×44px
- **Haptic feedback**: `navigator.vibrate(50)` solo en confirmaciones
- **Batería**: Auto-pausa cámara después de 30s

### Limitaciones de Memoria

- **Chunked loading**: Leer archivos grandes por partes
- **Lazy loading**: Cargar datos bajo demanda
- **Cache inteligente**: Limpiar datos no utilizados

## 🔍 Debugging

### Logs de Desarrollo

```typescript
// Activar logs detallados
localStorage.setItem('gondolapp:debug', 'true');

// Resetear DB (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  await resetDB();
}
```

### Estadísticas de Performance

```typescript
const stats = await db.getStats();
console.table(stats);
```

## 📖 Casos de Uso Principales

### 1. Escaneo Rápido de Productos

```typescript
const handleScan = async (barcode: string) => {
  const result = await db.findProductByBarcode(barcode);
  if (result) {
    // Producto encontrado
    const { product, variant } = result;
    navigator.vibrate(50); // Feedback táctil
  }
};
```

### 2. Reposición Diaria

```typescript
// 1. Generar sugerencias automáticas
const suggestions = await db.generateRestockSuggestions();

// 2. Crear lista optimizada por zona
const listId = await db.createRestockList('Reposición Matutina', suggestions);

// 3. Trabajar la lista
for (let i = 0; i < items.length; i++) {
  await db.completeRestockItem(listId, i, scannedQuantity);
}
```

### 3. Alertas de Vencimiento

```typescript
// Ejecutar cada mañana a las 7AM
const expiringProducts = await db.getExpiringProducts(7);
if (expiringProducts.length > 0) {
  // Enviar notificación push
  showNotification(`${expiringProducts.length} productos próximos a vencer`);
}
```

---

## 🎯 **Características Clave**

✅ **Offline-first**: Funciona sin internet  
✅ **Mobile-optimized**: Diseñado para dispositivos móviles  
✅ **Atomic transactions**: Consistencia de datos garantizada  
✅ **Smart sync**: Sincronización inteligente por prioridad  
✅ **Performance**: Optimizado para 50-100MB IndexedDB  
✅ **Zone-optimized**: Listas ordenadas por recorrido físico  
✅ **Auto-cleanup**: Mantenimiento automático de datos

Este cliente IndexedDB está diseñado específicamente para las necesidades de GondolApp, priorizando la funcionalidad offline, performance móvil y optimización del flujo de trabajo de reposición en supermercados.
