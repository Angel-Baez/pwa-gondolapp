---
name: App PWA Offline-First para Reposición de Supermercado
description: Aplicación móvil progresiva que funciona sin internet, permitiendo crear listas de reposición con escáner de códigos de barras, gestionar variantes de productos con jerarquía de categorías predefinida, predecir cantidades para cubrir 3 días basadas en consumo histórico, recibir notificaciones push de vencimientos a las 7-8am, mantener log completo de movimientos (reposiciones y descartes), exportar backups, y compartir reportes vía WhatsApp. Stack: Next.js + TypeScript + MongoDB + IndexedDB con sincronización automática.
---

# App PWA Offline-First para Reposición de Supermercado

## Contexto del Proyecto

**Usuario:** Reponedor en supermercado pequeño con experiencia en stack MERN + Next.js + TypeScript

**Problema a resolver:**

- Optimizar trabajo diario de reposición de productos
- Gestionar fechas de vencimiento de manera eficiente
- Crear listas de búsqueda en almacén de forma ágil
- Generar reportes e informes de inventario
- Trabajar sin conexión a internet (funcionalidad offline crítica)

**Dispositivo objetivo:** Teléfono móvil (mobile-first)

## Requisitos Funcionales

### 1. Gestión de Productos y Variantes

- Sistema de productos base con múltiples variantes (ej: Leche Milex Descremada 1L, Leche Milex Entera 500ml)
- Cada variante tiene:
  - **Código de barras único** (identificador primario)
  - **SKU generado automáticamente:** primeros 10 dígitos del código de barras + sufijo
    - Ejemplo: `1234567890-A` (A=primera variante, B=segunda, etc.)
    - Sin necesidad de configurar códigos de marca
  - Tipo/sabor, tamaño, precio
  - Stock actual y stock mínimo (configurado por variante)
  - Fecha de vencimiento
  - **Zona física:** ubicación exacta en el almacén (ej: "Lácteos - Estante Bajo Derecha")
- Jerarquía fija de categorías (3 niveles):
  - **Lácteos** > Leches / Yogures / Quesos
  - **Carnes** > Res / Pollo / Cerdo / Pescado
  - **Enlatados** > Conservas / Salsas / Sopas
  - **Bebidas** > Gaseosas / Jugos / Agua
  - **Panadería** > Pan / Galletas / Pasteles
  - **Limpieza** > Detergentes / Desinfectantes / Papel
  - **Snacks** > Dulces / Salados / Chocolates

### 2. Escaneo de Códigos de Barras Optimizado

- **API nativa prioritaria:** Barcode Detector API (si disponible)
  - Mejor rendimiento y menor consumo de batería
  - Procesamiento nativo del sistema operativo
- **Fallback:** `@zxing/browser` para compatibilidad
- **Optimización móvil:**
  - Resolución de cámara adaptativa
  - Throttling inteligente de frames
  - Auto-focus continuo
- Identificar variante exacta del producto
- Agregar rápidamente a listas de reposición
- **Fallback manual:** Entrada manual si escaneo falla

**Implementación técnica:**

```typescript
// Detección progresiva de capacidades
const initBarcodeScanner = async () => {
  if ('BarcodeDetector' in window) {
    // Usar API nativa (mejor rendimiento)
    const detector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128'],
    });
    return { type: 'native', detector };
  } else {
    // Fallback a @zxing/browser
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    return { type: 'zxing', detector: new BrowserMultiFormatReader() };
  }
};
```

### 3. Listas de Reposición Inteligentes

- Crear listas de productos para buscar en almacén
- **Ordenamiento inteligente por zona física:** `ORDER BY zona ASC, producto ASC`
  - Optimiza recorrido físico del almacén
  - Reduce tiempo de búsqueda en 10-20 minutos diarios
- Sugerencias básicas de cantidades (stock mínimo × 1.2)
- Cantidades editables manualmente
- **Selección rápida con chips:** Sabores y tamaños predefinidos
  - Sin formularios tediosos
  - Tap → listo
- **Modo "Espacio vacío":** Agregar productos sin escanear
  - Botón rápido cuando no hay código de barras disponible
  - Selección directa: producto base → variante → cantidad
- **Gestos táctiles con feedback háptico:**
  - Swipe right para completar + vibración de confirmación
  - Swipe left para eliminar + vibración de advertencia
  - Reduce errores de tacto durante uso intensivo
  - Confirma acciones sin mirar la pantalla

**Implementación de feedback háptico:**

```typescript
// Diferentes patrones de vibración por acción
const hapticFeedback = {
  complete: () => navigator.vibrate?.(50), // Vibración corta (completar)
  remove: () => navigator.vibrate?.([100, 50, 100]), // Patrón (eliminar)
  error: () => navigator.vibrate?.(200), // Vibración larga (error)
  scan: () => navigator.vibrate?.(25), // Micro vibración (escaneo)
};

// Uso en componentes
const handleSwipeRight = item => {
  completeItem(item);
  hapticFeedback.complete(); // Confirma acción sin mirar
};
```

### 4. Sistema de Alertas de Vencimiento

- Notificaciones push del sistema operativo
- **Horario con timezone:** 7:00am hora local del usuario
  - Backend: `node-cron` con conversión de timezone
  - Cálculo: `moment.tz(userTimezone).hour(7).minute(0)`
  - Evita notificaciones a horas incorrectas
- Alertas en 3 umbrales:
  - 7 días antes del vencimiento
  - 3 días antes del vencimiento
  - 1 día antes del vencimiento
- Badge counter en icono PWA con cantidad de alertas pendientes
- Al clic en notificación: abrir app en pantalla de alertas

**Implementación técnica de notificaciones:**

```javascript
// Backend: Cron job con timezone awareness
const cron = require('node-cron');
const moment = require('moment-timezone');

cron.schedule(
  '0 7 * * *',
  async () => {
    const subscriptions = await getActiveSubscriptions();

    for (const sub of subscriptions) {
      const userTime = moment.tz(sub.timezone);
      if (userTime.hour() === 7) {
        await sendExpirationNotifications(sub.userId);
      }
    }
  },
  {
    timezone: 'UTC', // Cron en UTC, conversión por usuario
  }
);
```

### 5. Priorización Simple

- **Ordenamiento básico por urgencia:**
  1. Productos próximos a vencer (≤7 días)
  2. Stock por debajo del mínimo
  3. Ordenamiento por zona física para optimizar recorrido
- Indicadores visuales simples:
  - 🔴 Rojo: Crítico (≤3 días para vencer)
  - 🟡 Amarillo: Stock bajo mínimo
  - 🟢 Verde: Normal
- **Configuración manual de orden de zonas** según layout del almacén

### 6. Log de Movimientos de Inventario

- Registro de dos tipos de movimientos:
  - **Reposiciones:** Agregar stock (+)
  - **Descartes:** Retirar stock (-)
- Cada movimiento registra:
  - Fecha y hora (timestamp)
  - Tipo de movimiento
  - Variante del producto
  - Cantidad
  - Stock resultante
  - Motivo (obligatorio para descartes): vencido / dañado / otros
- Historial con filtros avanzados:
  - Por fecha (rango)
  - Por tipo de movimiento
  - Por categoría
  - Por producto/variante
  - Por motivo de descarte
- Paginación para grandes volúmenes de datos

### 7. Reportes Básicos

Generar 3 tipos de reportes esenciales:

1. **Productos próximos a vencer:** Listado simple con días restantes
2. **Stock bajo mínimo:** Lista de productos a reponer
3. **Lista de compras:** Productos ordenados por zona física

**Funcionalidades básicas:**

- Exportación a texto plano o CSV
- Compartir directamente a WhatsApp (Web Share API)
- Sin gráficos complejos en versión inicial

### 8. Backup Simple

- Exportación básica de datos a JSON
- Incluye: productos, variantes, stock actual, configuraciones
- Descarga manual desde ajustes
- Importación básica (sobrescribe datos existentes)
- Exportación rápida a CSV

### 9. Sugerencias Básicas

- Cálculo simple: `stock mínimo × factor de seguridad (1.2)`
- Almacenar últimas 3 reposiciones por producto
- Sugerencia basada en promedio de últimas reposiciones
- Sin algoritmos complejos en versión inicial

## Requisitos Técnicos

### Stack Tecnológico

**Frontend:**

- Next.js 14+ con App Router
- TypeScript
- React 18+
- Tailwind CSS + shadcn/ui (sistema de componentes con modo oscuro)
- PWA con `next-pwa` + Workbox
- IndexedDB via `Dexie.js` (store local)
- **Escaneo de códigos:** `@zxing/browser` + Barcode Detector API (si disponible)
- **Feedback háptico:** Vibration API para confirmaciones
- `react-pdf` o `jsPDF` (generación de PDFs)
- Chart.js o Recharts (gráficos simples)
- `JSZip` (compresión de backups)

**Backend:**

- Node.js + Express
- MongoDB (base de datos principal)
- `web-push` (notificaciones push)
- `node-cron` (tareas programadas con timezone)
- `zod` (validación de schemas)
- `moment-timezone` (manejo de timezones)
- JWT (autenticación simple single-user)

### Arquitectura Offline-First Simplificada

**Estrategia de datos por tipo:**

| **Qué**                           | **Dónde se guarda**          | **Por qué**                      |
| --------------------------------- | ---------------------------- | -------------------------------- |
| **Catálogo productos/variantes**  | MongoDB + copia en IndexedDB | Necesitas persistencia real      |
| **Listas del día**                | Solo IndexedDB               | Más rápido, no depende de red    |
| **Historial largo (movimientos)** | MongoDB                      | Esto es lo que respaldarás luego |

**Flujo de sincronización:**

1. **Catálogo:** Sync bidireccional - cambios van a MongoDB
2. **Listas:** Solo local - no necesitan servidor
3. **Movimientos:** Solo van a MongoDB cuando hay conexión

**Resolución de conflictos:**

- **Catálogo:** Last-Write-Wins (solo cambias tú)
- **Listas:** No aplica (solo local)
- **Movimientos:** Append-only (no hay conflictos)

**Consistencia de datos:**

- **Transacciones atómicas** en IndexedDB (Dexie.js)
- **Validación de schema** antes de sync a MongoDB
- **Rollback automático** si falla cualquier operación
- **Queue resiliente** con reintentos y fallbacks

```typescript
// Generación automática de SKU simple
const generateSimpleSKU = (barcode: string, variantIndex: number): string => {
  const baseCode = barcode.substring(0, 10); // Primeros 10 dígitos
  const suffix = String.fromCharCode(65 + variantIndex); // A, B, C...
  return `${baseCode}-${suffix}`;
};

// Ejemplo de uso
const variants = [
  { barcode: '1234567890123', type: 'Entera' }, // SKU: 1234567890-A
  { barcode: '1234567890124', type: 'Descremada' }, // SKU: 1234567890-B
];

// Ejemplo de operación resiliente
const safeStockUpdate = async (variantId: string, quantity: number) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await db.transaction('rw', [db.products, db.pendingSync], async () => {
        // Operaciones atómicas aquí
        await updateLocalStock(variantId, quantity);
        await queueMovementSync(variantId, quantity);
      });
      break; // Éxito
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        // Log error y mostrar al usuario
        console.error('Error crítico en actualización de stock:', error);
        throw error;
      }
      // Retry con backoff exponencial
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
```

**Service Workers:**

- Caching estratégico con Workbox:
  - **Cache-First:** Assets estáticos (JS, CSS, imágenes)
  - **Network-First:** Solo catálogo de productos
  - **Cache-Only:** Listas del día (siempre local)
- Background sync solo para movimientos críticos
- Push notification handler

### Esquema de Datos Simplificado

**MongoDB + IndexedDB: products** (sincronizado)

```typescript
{
  _id: string,
  baseProduct: string,              // "Leche Milex"
  brand: string,                     // "Milex"
  category: {
    level1: string,                  // "Lácteos"
    level2: string,                  // "Leches"
    level3?: string                  // "Leche Entera" (opcional)
  },
  variants: [
    {
      variantId: string,
      barcode: string,               // Código de barras único (identificador primario)
      sku: string,                   // "1234567890-A" (auto-generado)
      type: string,                  // "Descremada"
      size: string,                  // "1L"
      price: number,
      stock: number,
      stockMinimo: number,
      zona: string,                  // "Lácteos - Estante Bajo Derecha"
      expirationDate?: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Solo IndexedDB: restockLists** (local únicamente)

```typescript
{
  _id: string,
  name: string,                      // "Lista Mañana 6 Nov"
  items: [
    {
      variantId: string,
      quantity: number,
      completed: boolean,
      zona: string                   // Para ordenamiento
    }
  ],
  createdAt: Date,
  completedAt?: Date
}
```

**Solo MongoDB: movements** (historial permanente)

```typescript
{
  _id: string,
  type: "restock" | "discard",
  productId: string,
  variantId: string,
  quantity: number,
  resultingStock: number,
  reason?: string,                   // Solo para descartes
  timestamp: Date
  // No necesita 'syncedToServer' - va directo cuando hay red
}
```

**Solo IndexedDB: pendingSync** (cola mínima)

```typescript
{
  _id: string,
  type: "product_update" | "movement",
  data: any,
  timestamp: Date,
  retries: number
}
```

**Colección: pushSubscriptions**

```typescript
{
  _id: string,
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  },
  userId: string,
  notificationTime: string,          // "07:00" formato HH:mm
  timezone: string,                  // "America/La_Paz"
  createdAt: Date
}
```

### API Endpoints (REST)

**Catálogo (sincronizado):**

- `GET /api/products` - Listar todos los productos
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear nuevo producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/barcode/:barcode` - Buscar por código de barras
- `GET /api/products/sync/:timestamp` - Cambios desde timestamp

**Movimientos (solo escritura con validación):**

- `POST /api/movements` - Registrar movimiento (reposición/descarte)
- `POST /api/movements/batch` - Registrar múltiples movimientos
- `GET /api/movements` - Historial con filtros (solo para reportes)

**Validación de Schema (Backend):**

```typescript
// Validación antes de escribir a MongoDB
const MovementSchema = z.object({
  type: z.enum(['restock', 'discard']),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  timestamp: z.date(),
});

// En el endpoint POST /api/movements
app.post('/api/movements', async (req, res) => {
  try {
    // Validar datos de la cola offline
    const validatedData = MovementSchema.parse(req.body);

    // Solo entonces escribir a MongoDB
    const movement = await Movement.create(validatedData);
    res.json(movement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos de cola offline',
        details: error.errors,
      });
    }
    // Manejar otros errores...
  }
});
```

**Listas (no hay API - solo local)**

- Las listas viven solo en IndexedDB
- Más rápido, sin dependencia de red
- Se crean, modifican y eliminan localmente

**Reportes:**

- `GET /api/reports/expiring` - Productos próximos a vencer
- `GET /api/reports/top-restocked` - Más repuestos
- `GET /api/reports/low-movement` - Menos movimiento
- `GET /api/reports/low-stock` - Bajo stock mínimo
- `GET /api/reports/restock-suggestions` - Sugerencias de pedido

**Sincronización:**

- `POST /api/sync/batch` - Sincronizar múltiples operaciones
- `GET /api/sync/status` - Estado de sincronización

**Push Notifications:**

- `POST /api/push/subscribe` - Registrar suscripción
- `PUT /api/push/subscribe/:id` - Actualizar configuración
- `DELETE /api/push/subscribe/:id` - Eliminar suscripción

**Backup:**

- `GET /api/backup/export` - Exportar backup completo (JSON)
- `POST /api/backup/import` - Importar backup

**Testing (Solo en desarrollo):**

- `POST /api/test/seed` - Poblar BD con datos de prueba
- `DELETE /api/test/reset` - Limpiar datos de prueba
- `GET /api/test/health` - Verificar estado de servicios

### Consideraciones de Performance

**Mobile-First:**

- Touch targets mínimo 44×44px
- **Modo oscuro optimizado para uso nocturno/baja iluminación**
- **Contraste automático según tema seleccionado**
- Optimización de imágenes y assets
- Code splitting por rutas
- Lazy loading de componentes pesados
- Debouncing en búsquedas
- Throttling en procesamiento de video (escaneo)

**Límites de Almacenamiento:**

- IndexedDB: típicamente 50-100MB en móviles
- **Catálogo:** ~5-10MB (productos y variantes)
- **Listas:** ~1-2MB (solo datos del día/semana)
- **Cola sync:** ~100KB (movimientos pendientes)
- Limpiar listas completadas > 30 días automáticamente

**Transacciones Atómicas (Dexie.js):**

```typescript
// Swipe para completar item - transacción atómica
await db.transaction('rw', [db.restockLists, db.pendingSync], async () => {
  // 1. Marcar item como completado
  await db.restockLists.update(listId, {
    [`items.${itemIndex}.completed`]: true,
    [`items.${itemIndex}.completedAt`]: new Date(),
  });

  // 2. Agregar movimiento a cola de sync
  await db.pendingSync.add({
    type: 'movement',
    data: {
      type: 'restock',
      variantId: item.variantId,
      quantity: item.quantity,
      timestamp: new Date(),
    },
  });

  // 3. Actualizar stock local
  await db.products
    .where('variants.variantId')
    .equals(item.variantId)
    .modify(product => {
      const variant = product.variants.find(
        v => v.variantId === item.variantId
      );
      if (variant) variant.stock += item.quantity;
    });
});

// Si falla cualquier operación, se revierten todas
```

**Escaneo de Códigos Optimizado:**

- **Barcode Detector API:** Procesamiento nativo (mejor rendimiento)
- **@zxing/browser fallback:** Con optimizaciones
  - Reducir resolución de captura de video
  - Procesamiento en Web Worker
  - Throttling inteligente de frames
- **Feedback multimodal:**
  - Visual: resaltado inmediato del código
  - Háptico: micro vibración al detectar
  - Audio: beep de confirmación (opcional)
- **Gestión de batería:** Auto-pausa después de 30s sin uso

**Comparativa de rendimiento:**

```typescript
// Barcode Detector API (nativo)
- CPU: ~5-10% durante escaneo
- Batería: Optimizada por el OS
- Latencia: <100ms

// @zxing/browser (JavaScript)
- CPU: ~15-25% durante escaneo
- Batería: Mayor consumo
- Latencia: 200-500ms
```

**Uso Intensivo en Almacén:**

- **Gestión de batería:** Auto-pausa de cámara, modo de bajo consumo
- **Resistencia a errores:** Recuperación automática de fallos de cámara
- **Ergonomía móvil:** Botones grandes, swipes amplios, feedback háptico
- **Trabajo con guantes:** Touch targets aumentados, gestos simplificados
- **Uso continuo:** Prevención de overheating, throttling inteligente

**Testing y Desarrollo:**

- **Mock de datos**: Simulación de productos y variantes para testing
- **Modo offline simulado**: Toggle para probar funcionalidad sin conexión
- **Reset de datos**: Limpieza rápida de IndexedDB para pruebas
- **Testing de APIs:** Simulación de Barcode Detector y Vibration API
- **Logging detallado**: Console logs para debugging en desarrollo
- **Hot reload**: Sincronización instantánea de cambios en desarrollo

## Flujos de Usuario Principales

### 1. Crear Lista de Reposición

1. Abrir app → Vista de listas
2. Crear nueva lista o abrir existente
3. **Agregar productos:**
   - **Escanear códigos de barras** (método principal)
   - **Modo "Espacio vacío"** cuando no hay código:
     - Botón "Añadir a lista"
     - Seleccionar producto base
     - Seleccionar variante con chips
     - Definir cantidad
4. Sistema sugiere cantidades básicas (editable)
5. **Lista automáticamente ordenada por zona física**
   - Optimiza recorrido físico del almacén
   - Ahorra 10-20 minutos diarios
6. Ir al almacén siguiendo el orden por zonas
7. **Marcar items completados:**
   - Swipe right + vibración de confirmación
   - Feedback visual inmediato
   - Trabajo sin mirar constantemente la pantalla
8. Al finalizar, registrar reposición → actualiza stock y log

### 2. Gestionar Productos con Variantes

1. Menú → Productos
2. Navegar por categorías (árbol colapsable)
3. Seleccionar producto base o crear nuevo
4. Agregar/editar variantes:
   - **Escanear código de barras** (se convierte en identificador primario)
   - **Seleccionar tipo/sabor con chips predefinidos** (tap rápido)
     - Ejemplo lácteos: [Entera] [Deslactosada] [Chocolate] [Light]
   - **Seleccionar tamaño con chips** (tap rápido)
     - Ejemplo: [200ml] [500ml] [1L] [2L]
   - Definir precio, stock, stock mínimo
   - **Asignar zona física:** "Lácteos - Estante Bajo Derecha"
   - Asignar fecha de vencimiento si aplica
5. **SKU generado automáticamente:** `{primeros10dígitosCódigo}-{sufijo}`
   - Sin configuración de códigos de marca
   - Ejemplo: `1234567890-A`, `1234567890-B`
6. Guardar → sincroniza cuando hay conexión

### 3. Registrar Descarte de Producto Vencido

1. Recibir notificación push: "5 productos vencen en 2 días"
2. Abrir app → Vista de alertas
3. Revisar lista de productos próximos a vencer
4. Seleccionar producto a descartar
5. Confirmar descarte y elegir motivo: "Vencido"
6. Registrar cantidad descartada
7. Stock actualizado automáticamente
8. Movimiento guardado en log

### 4. Generar y Compartir Reporte

1. Menú → Reportes
2. Seleccionar tipo de reporte (ej: "Sugerencias de pedido")
3. Aplicar filtros si es necesario (fecha, categoría)
4. Generar PDF
5. Preview del reporte
6. Botón "Compartir en WhatsApp"
7. Selector de contactos de WhatsApp
8. Enviar reporte

### 5. Exportar Backup

1. Menú → Ajustes → Backup
2. Ver fecha del último backup automático
3. Botón "Exportar ahora"
4. **Solo exporta lo importante:**
   - Catálogo de productos (IndexedDB)
   - Configuraciones personales
   - NO incluye listas temporales
5. Descarga automática o compartir archivo
6. Confirmación: "Backup creado exitosamente"

## Configuraciones de Usuario

**Ajustes disponibles:**

- **Tema de la aplicación:** Claro / Oscuro / Auto (detectar preferencia del sistema)
- Hora de notificación diaria (default: 7:00am)
- Umbrales de alertas de vencimiento (7/3/1 días - personalizables)
- Frecuencia de backup automático (semanal/mensual/manual)
- **Configuración de zonas:** Orden manual según layout del almacén
- **Chips de variantes:** Sabores y tamaños frecuentes
- Factor de buffer en sugerencias (default: 1.2 = 20% extra)
- Días de cobertura para pedidos (default: 3 días)

## Funcionalidades Pro (Versión 2.0 - Fases 3-4)

### Motor de Predicción Avanzado

- **Exponential Smoothing Simple (EES)** completo
- Algoritmo: `S_t = 0.3 × X_t + 0.7 × S_{t-1}`
- Almacenar historial de consumo: últimos 90 días
- Predicción para cobertura de 3 días

### Sistema de Priorización Inteligente

- Algoritmo complejo con ponderaciones:
  ```
  Priority = (1 / max(DíasHastaVencer, 1) × 0.5) +
             ((stockMinimo - stockActual) / stockMinimo × 0.3) +
             (ReposicionesÚltimos30días / 30 × 0.2)
  ```
- Machine Learning para optimización de rutas

### Reportes Avanzados

- **Top 20 más repuestos:** Frecuencia de reposición mensual
- **Productos con menos movimiento:** Últimos 30 días
- **Análisis de tendencias:** Gráficos con Chart.js
- **Reportes personalizables:** Filtros avanzados
- Generación de PDF profesional con tablas y gráficos

### Backup Inteligente

- Generación de archivo ZIP con timestamp
- Validación de schema y merge inteligente
- Backup automático programado (semanal/mensual)
- Sincronización automática de backups a servidor
- Versionado de backups con rollback

### Integraciones Avanzadas

- Integración con sistema de punto de venta (POS)
- API para proveedores y pedidos automáticos
- Dashboard web para gerencia
- Análisis predictivo con Machine Learning

## Fases de Implementación Sugeridas

### Fase 1: MVP Funcional Offline (Semanas 1-3)

- Configurar proyecto Next.js + PWA + IndexedDB
- **Implementar sistema de temas (modo claro/oscuro) con shadcn/ui**
- **Configuración de paleta de colores responsive (azul claro/rosa oscuro)**
- **Setup inicial de testing (Vitest + Testing Library + Cypress)**
- **Mock de datos de productos para desarrollo y testing**
- CRUD de productos con variantes + **zona física**
- **Chips de selección rápida** para sabores y tamaños
- Categorías fijas implementadas
- **Escaneo optimizado:** Barcode Detector API + @zxing/browser fallback
- **Feedback háptico:** Vibration API para confirmaciones
- **Modo "Espacio vacío"** para agregar sin escanear
- **Ordenamiento por zona física** en listas (ahorra 10-20 min diarios)
- Configuración manual de orden de zonas
- **Toggle de tema accesible desde configuraciones**
- **Tests unitarios para utilidades y servicios core**
- **Tests de integración para CRUD de productos**
- **Funcionalidad offline-first completa** (crítico para almacenes sin WiFi)
- Sync básico con backend

### Fase 2: Inteligencia y Alertas (Semanas 4-5)

- Sugerencias básicas de cantidades mejoradas
- Sistema de alertas de vencimiento
- Notificaciones push configuradas (7:00-8:00am)
- Priorización simple pero efectiva:
  - Productos próximos a vencer (≤7 días)
  - Stock por debajo del mínimo
  - Ordenamiento por zona física
- Log completo de movimientos (reposiciones + descartes)
- **Tests unitarios para algoritmos básicos**
- **Tests de hooks personalizados (useProductSync, useOfflineQueue)**
- **Simulación de notificaciones push en testing**
- **Testing exhaustivo offline/online**
- **Validación de sincronización automática**

### Fase 3: Reportes y Análisis (Semana 6)

- 3 tipos de reportes esenciales:
  - Productos próximos a vencer
  - Stock bajo mínimo
  - Lista de compras ordenada por zona
- Exportación a CSV y texto plano
- Integración Web Share API para WhatsApp
- Sistema de backup básico pero robusto
- **Tests de generación de reportes con datos mock**
- **Tests de integración para Web Share API**
- **Validación de formato de reportes exportados**
- **Tests de integridad de datos en backup/restore**

### Fase 4: Gestión Avanzada (Semana 7)

- Historial con filtros avanzados
- Sistema de backup/exportación mejorado
- Importación y restauración con validaciones
- **Tests de filtros avanzados con grandes volúmenes**
- **Validación de schemas en importación**
- **Tests de migración de datos entre versiones**
- **Tests de integridad completa de datos**

### Fase 5: Optimización y Pulido (Semana 8)

- Optimización de performance móvil
- **Testing exhaustivo offline/online con Cypress**
- **Tests E2E de flujos completos de usuario**
- **Tests de performance y memoria**
- **Tests de accesibilidad (a11y)**
- **Testing en diferentes dispositivos móviles**
- **Validación PWA con Lighthouse**
- Refinamiento de UI/UX con modo oscuro optimizado
- Documentación de usuario

## Estrategia de Testing

### Testing Stack

**Herramientas de Testing:**

- **Vitest**: Framework de testing unitario (más rápido que Jest)
- **Testing Library**: Testing de componentes React
- **Cypress**: Testing E2E y de integración
- **MSW (Mock Service Worker)**: Mocking de APIs
- **Playwright**: Testing cross-browser (opcional)

### Tipos de Tests por Funcionalidad

#### 1. Tests Unitarios (70% cobertura objetivo)

```typescript
// Utilidades y cálculos puros
describe('PredictionEngine', () => {
  it('should calculate EES correctly', () => {
    const data = [10, 12, 8, 15];
    const result = calculateExponentialSmoothing(data, 0.3);
    expect(result).toBeCloseTo(33.6); // (11.25 * 3 * 1.2)
  });
});

// Servicios de negocio
describe('InventoryService', () => {
  it('should create restock suggestions', async () => {
    const mockRepo = createMockRepository();
    const service = new InventoryService(mockRepo);
    const suggestions = await service.getRestockSuggestions();
    expect(suggestions).toHaveLength(3);
  });
});
```

#### 2. Tests de Componentes (20% cobertura objetivo)

```typescript
// Componentes React
describe("ProductCard", () => {
  it("should display critical priority correctly", () => {
    const variant = createMockVariant({ daysUntilExpiry: 1 });
    render(<ProductCard variant={variant} />);
    expect(screen.getByText("Crítico")).toBeInTheDocument();
    expect(screen.getByRole("badge")).toHaveClass("bg-destructive");
  });
});

// Custom Hooks
describe("useProductSync", () => {
  it("should sync when online", async () => {
    const { result } = renderHook(() => useProductSync());
    act(() => {
      result.current.triggerSync();
    });
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });
});
```

#### 3. Tests E2E (10% cobertura objetivo)

```typescript
// Flujos completos de usuario
describe('Restock Flow', () => {
  it('should create and complete restock list', () => {
    cy.visit('/lists');
    cy.get('[data-testid="create-list"]').click();
    cy.get('[data-testid="barcode-scanner"]').click();
    cy.mockBarcodeResult('1234567890');
    cy.get('[data-testid="add-to-list"]').click();
    cy.get('[data-testid="complete-item"]').swipe('right');
    cy.get('[data-testid="finish-list"]').click();
    cy.url().should('include', '/lists/completed');
  });
});
```

### Datos de Prueba

#### Mock Data Factory

```typescript
// tests/factories/productFactory.ts
export const createMockProduct = (overrides = {}) => ({
  _id: 'prod-123',
  baseProduct: 'Leche Milex',
  brand: 'Milex',
  category: {
    level1: 'Lácteos',
    level2: 'Leches',
  },
  variants: [
    createMockVariant({
      sku: 'MILEX-DESC-1L',
      barcode: '1234567890',
      stock: 10,
      stockMinimo: 20,
      ...overrides,
    }),
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

#### Fixtures de Testing

```json
// cypress/fixtures/products.json
{
  "sampleProducts": [
    {
      "_id": "prod-001",
      "baseProduct": "Coca Cola",
      "variants": [
        {
          "variantId": "var-001",
          "barcode": "1111111111",
          "size": "350ml",
          "stock": 5,
          "stockMinimo": 15
        }
      ]
    }
  ]
}
```

### Testing Offline/Online

#### Simulación de Estados de Red

```typescript
// tests/utils/networkMock.ts
export const mockOffline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false,
  });
  window.dispatchEvent(new Event('offline'));
};

export const mockOnline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
  window.dispatchEvent(new Event('online'));
};
```

#### Tests de Sincronización

```typescript
describe('Offline Functionality', () => {
  it('should queue operations when offline', async () => {
    mockOffline();
    const service = new SyncService();
    await service.createProduct(mockProduct);

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].operation).toBe('POST');
  });

  it('should sync queued operations when online', async () => {
    mockOnline();
    const service = new SyncService();
    await service.processQueue();

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });
});
```

### Configuración de CI/CD Testing

#### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:components

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

### Scripts de Testing

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:components": "vitest run src/**/*.component.test.tsx",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Estrategia de Testing

### Testing Stack

**Herramientas de Testing:**

- **Vitest**: Framework de testing unitario (más rápido que Jest)
- **Testing Library**: Testing de componentes React
- **Cypress**: Testing E2E y de integración
- **MSW (Mock Service Worker)**: Mocking de APIs
- **Playwright**: Testing cross-browser (opcional)

### Tipos de Tests por Funcionalidad

#### 1. Tests Unitarios (70% cobertura objetivo)

```typescript
// Utilidades y cálculos puros
describe('PredictionEngine', () => {
  it('should calculate EES correctly', () => {
    const data = [10, 12, 8, 15];
    const result = calculateExponentialSmoothing(data, 0.3);
    expect(result).toBeCloseTo(33.6); // (11.25 * 3 * 1.2)
  });
});

// Servicios de negocio
describe('InventoryService', () => {
  it('should create restock suggestions', async () => {
    const mockRepo = createMockRepository();
    const service = new InventoryService(mockRepo);
    const suggestions = await service.getRestockSuggestions();
    expect(suggestions).toHaveLength(3);
  });
});
```

#### 2. Tests de Componentes (20% cobertura objetivo)

```typescript
// Componentes React
describe("ProductCard", () => {
  it("should display critical priority correctly", () => {
    const variant = createMockVariant({ daysUntilExpiry: 1 });
    render(<ProductCard variant={variant} />);
    expect(screen.getByText("Crítico")).toBeInTheDocument();
    expect(screen.getByRole("badge")).toHaveClass("bg-destructive");
  });
});

// Custom Hooks
describe("useProductSync", () => {
  it("should sync when online", async () => {
    const { result } = renderHook(() => useProductSync());
    act(() => {
      result.current.triggerSync();
    });
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });
});
```

#### 3. Tests E2E (10% cobertura objetivo)

```typescript
// Flujos completos de usuario
describe('Restock Flow', () => {
  it('should create and complete restock list', () => {
    cy.visit('/lists');
    cy.get('[data-testid="create-list"]').click();
    cy.get('[data-testid="barcode-scanner"]').click();
    cy.mockBarcodeResult('1234567890');
    cy.get('[data-testid="add-to-list"]').click();
    cy.get('[data-testid="complete-item"]').swipe('right');
    cy.get('[data-testid="finish-list"]').click();
    cy.url().should('include', '/lists/completed');
  });
});
```

### Testing Offline/Online

#### Simulación de Estados de Red

```typescript
// tests/utils/networkMock.ts
export const mockOffline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false,
  });
  window.dispatchEvent(new Event('offline'));
};

export const mockOnline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
  window.dispatchEvent(new Event('online'));
};
```

#### Tests de Sincronización

```typescript
describe('Offline Functionality', () => {
  it('should queue operations when offline', async () => {
    mockOffline();
    const service = new SyncService();
    await service.createProduct(mockProduct);

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].operation).toBe('POST');
  });

  it('should sync queued operations when online', async () => {
    mockOnline();
    const service = new SyncService();
    await service.processQueue();

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });
});
```

### Scripts de Testing

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:components": "vitest run src/**/*.component.test.tsx",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Consideraciones Finales

**Ventajas de esta solución:**

- Funciona completamente offline (crítico para almacenes sin WiFi)
- Mobile-first: optimizado para uso con una mano
- Escaneo rápido acelera creación de listas
- Sugerencias inteligentes reducen errores de reposición
- Priorización automática optimiza tiempo en almacén
- Log completo permite auditoría y análisis
- Reportes compartibles facilitan comunicación con supervisores
- **Testing robusto garantiza calidad desde el desarrollo**

**Escalabilidad futura:**

- Multi-usuario: agregar roles (reponedor/supervisor/gerente)
- Integración con sistema de punto de venta (POS)
- Análisis predictivo avanzado con ML
- Reconocimiento visual de productos (Computer Vision)
- Integración con proveedores para pedidos automáticos
- Dashboard web para gerencia

---

**Fecha de creación:** 6 de noviembre de 2025
**Stack:** MERN + Next.js + TypeScript + PWA
**Tipo de proyecto:** Aplicación de gestión de inventario offline-first
