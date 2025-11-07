# Guía de Desarrollo - GondolApp PWA

## 📋 Tabla de Contenidos

1. [Arquitectura y Estructura](#arquitectura-y-estructura)
2. [Diseño y Sistema de UI](#diseño-y-sistema-de-ui)
3. [Principios y Mejores Prácticas](#principios-y-mejores-prácticas)
4. [Estándares de Código](#estándares-de-código)
5. [Metodología de Trabajo](#metodología-de-trabajo)
6. [Asistencia Contextual](#asistencia-contextual)

---

## 1. ARQUITECTURA Y ESTRUCTURA

### 1.1 Convenciones de Nomenclatura

#### Archivos y Carpetas

```
// ✅ Correcto
components/ProductCard.tsx
hooks/useProductSync.ts
utils/predictionEngine.ts
types/inventory.types.ts

// ❌ Incorrecto
components/product_card.tsx
hooks/UseProductSync.ts
utils/PredictionEngine.ts
types/inventoryTypes.ts
```

**Reglas:**

- **Archivos:** PascalCase para componentes React, camelCase para utilities/hooks
- **Carpetas:** camelCase o kebab-case consistente
- **Tipos/Interfaces:** PascalCase con sufijo `.types.ts`
- **Constantes:** SCREAMING_SNAKE_CASE
- **Archivos de configuración:** kebab-case (`eslint.config.js`)

#### Variables y Funciones

```typescript
// ✅ Correcto
const productVariant = { ... };
const calculateRestockQuantity = (variant: ProductVariant) => { ... };
const STOCK_SAFETY_FACTOR = 1.2;
const API_ENDPOINTS = { ... };

// ❌ Incorrecto
const ProductVariant = { ... };
const calculate_restock_quantity = (variant) => { ... };
const stockSafetyFactor = 1.2; // Constante debe ser MAYÚSCULA
```

**Reglas:**

- **Variables/Funciones:** camelCase descriptivo
- **Constantes:** SCREAMING_SNAKE_CASE
- **Componentes React:** PascalCase
- **Hooks personalizados:** prefijo `use` + PascalCase

#### Base de Datos

```typescript
// ✅ Correcto - Colecciones
products, movements, consumptionHistory, syncQueue;

// ✅ Correcto - Campos
{
  baseProduct, expirationDate, stockMinimo, variantId;
}

// ❌ Incorrecto
{
  base_product, expiration_date, stock_minimo, variant_id;
}
```

### 1.2 Estructura de Directorios

```
gondolapp/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (dashboard)/         # Grupo de rutas protegidas
│   │   │   ├── products/        # Gestión de productos
│   │   │   ├── lists/           # Listas de reposición
│   │   │   ├── reports/         # Reportes y análisis
│   │   │   └── settings/        # Configuraciones
│   │   ├── api/                 # API Routes
│   │   │   ├── products/
│   │   │   ├── movements/
│   │   │   ├── sync/
│   │   │   └── push/
│   │   ├── globals.css          # Estilos globales
│   │   ├── layout.tsx           # Layout raíz
│   │   └── page.tsx             # Página principal
│   ├── components/              # Componentes reutilizables
│   │   ├── ui/                  # Componentes base (botones, inputs)
│   │   ├── forms/               # Formularios específicos
│   │   ├── charts/              # Gráficos y visualizaciones
│   │   └── scanner/             # Componentes de escaneo
│   ├── hooks/                   # Custom hooks
│   │   ├── useProductSync.ts    # Sincronización de productos
│   │   ├── useOfflineQueue.ts   # Cola offline
│   │   └── usePrediction.ts     # Motor de predicción
│   ├── lib/                     # Utilidades y configuración
│   │   ├── db/                  # IndexedDB + MongoDB schemas
│   │   │   ├── indexeddb.ts     # Cliente IndexedDB (Dexie)
│   │   │   ├── mongodb.ts       # Cliente MongoDB
│   │   │   └── schemas.ts       # Schemas compartidos
│   │   ├── services/            # Servicios de negocio
│   │   │   ├── inventoryService.ts
│   │   │   ├── predictionService.ts
│   │   │   ├── syncService.ts
│   │   │   └── notificationService.ts
│   │   ├── utils/               # Utilidades puras
│   │   │   ├── calculations.ts  # Fórmulas y algoritmos
│   │   │   ├── dateUtils.ts     # Manejo de fechas
│   │   │   ├── validators.ts    # Validaciones
│   │   │   └── formatters.ts    # Formateo de datos
│   │   ├── constants.ts         # Constantes globales
│   │   └── config.ts            # Configuración de la app
│   ├── types/                   # Definiciones de tipos
│   │   ├── inventory.types.ts   # Productos, variantes, stock
│   │   ├── movements.types.ts   # Movimientos de inventario
│   │   ├── reports.types.ts     # Reportes y análisis
│   │   └── api.types.ts         # Tipos de API
│   └── middleware.ts            # Middleware de Next.js
├── public/                      # Assets estáticos
│   ├── icons/                   # Iconos PWA
│   ├── images/                  # Imágenes de la app
│   └── manifest.json            # Manifest PWA
├── docs/                        # Documentación
│   ├── api.md                   # Documentación de API
│   ├── database-schema.md       # Esquemas de BD
│   └── deployment.md            # Guía de deploy
├── tests/                       # Tests
│   ├── __mocks__/               # Mocks para testing
│   ├── components/              # Tests de componentes
│   ├── hooks/                   # Tests de hooks
│   ├── services/                # Tests de servicios
│   └── utils/                   # Tests de utilidades
├── .github/                     # GitHub workflows y templates
├── next.config.js               # Configuración Next.js
├── tailwind.config.js           # Configuración Tailwind
├── tsconfig.json                # Configuración TypeScript
└── package.json                 # Dependencias y scripts
```

**Propósito de cada carpeta:**

- **`app/`**: Rutas y layouts de Next.js 14+ (App Router)
- **`components/`**: Componentes React reutilizables, organizados por función
- **`hooks/`**: Custom hooks para lógica compartida
- **`lib/`**: Configuración, servicios y utilidades del negocio
- **`types/`**: Definiciones TypeScript organizadas por dominio
- **`tests/`**: Tests espejo de la estructura src/

### 1.3 Arquitectura de Datos Simplificada

**Estrategia por tipo de dato:**

| **Qué**                | **Dónde se guarda** | **Por qué**                   | **Patrón**        |
| ---------------------- | ------------------- | ----------------------------- | ----------------- |
| **Catálogo productos** | MongoDB + IndexedDB | Persistencia real + velocidad | Repository + Sync |
| **Listas del día**     | Solo IndexedDB      | Más rápido, no depende de red | Repository local  |
| **Movimientos**        | MongoDB             | Historial permanente          | Append-only       |

**Ventajas:**

- Menos sincronización (solo catálogo)
- Mayor velocidad (listas 100% locales)
- Menor complejidad de conflictos
- Mejor experiencia offline

### 1.4 Patrones de Diseño a Implementar

#### Repository Pattern (Acceso a Datos)

```typescript
// lib/repositories/ProductRepository.ts
interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<ProductVariant | null>;
  create(product: CreateProductDto): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<boolean>;
}

class ProductRepository implements IProductRepository {
  constructor(
    private indexedDB: IndexedDBService,
    private mongoClient: MongoDBService
  ) {}

  async findAll(): Promise<Product[]> {
    // Prioridad: IndexedDB -> MongoDB si hay conexión
    return this.indexedDB.products.toArray();
  }
}
```

#### Service Layer Pattern (Lógica de Negocio)

```typescript
// lib/services/InventoryService.ts
class InventoryService {
  constructor(
    private productRepo: IProductRepository,
    private movementRepo: IMovementRepository,
    private predictionService: PredictionService
  ) {}

  async createRestockList(categoryId?: string): Promise<RestockList> {
    const products = await this.productRepo.findByCategory(categoryId);
    const suggestions = await this.predictionService.calculateSuggestions(
      products
    );

    return new RestockList({
      items: suggestions,
      priority: this.calculatePriority(suggestions),
      createdAt: new Date(),
    });
  }
}
```

#### Factory Pattern (Creación de Objetos Complejos)

```typescript
// lib/factories/ReportFactory.ts
class ReportFactory {
  static createReport(type: ReportType, data: any[]): Report {
    switch (type) {
      case "expiring-products":
        return new ExpiringProductsReport(data);
      case "restock-suggestions":
        return new RestockSuggestionsReport(data);
      case "top-restocked":
        return new TopRestockedReport(data);
      default:
        throw new Error(`Tipo de reporte no soportado: ${type}`);
    }
  }
}
```

#### Observer Pattern (Sincronización)

```typescript
// lib/services/SyncService.ts
class SyncService {
  private observers: SyncObserver[] = [];

  subscribe(observer: SyncObserver): void {
    this.observers.push(observer);
  }

  private notifyObservers(event: SyncEvent): void {
    this.observers.forEach((observer) => observer.onSyncEvent(event));
  }

  async syncToServer(): Promise<void> {
    this.notifyObservers({ type: "sync-start" });
    // ... lógica de sincronización
    this.notifyObservers({ type: "sync-complete" });
  }
}
```

### 1.4 Separación de Responsabilidades

#### Estructura por Capas

```
┌─────────────────────────────────────┐
│         PRESENTACIÓN                │  <- components/, app/
│  (UI Components, Pages, Forms)      │
├─────────────────────────────────────┤
│         APLICACIÓN                  │  <- hooks/, services/
│  (Business Logic, Use Cases)        │
├─────────────────────────────────────┤
│         DOMINIO                     │  <- types/, lib/utils/
│  (Entities, Value Objects, Rules)   │
├─────────────────────────────────────┤
│         INFRAESTRUCTURA             │  <- lib/db/, repositories/
│  (Database, External APIs, Cache)   │
└─────────────────────────────────────┘
```

**Responsabilidades por capa:**

1. **Presentación**: Renderizado, eventos de usuario, validación de formularios
2. **Aplicación**: Orquestación de casos de uso, manejo de estado global
3. **Dominio**: Reglas de negocio, entidades, cálculos puros
4. **Infraestructura**: Persistencia, APIs externas, notificaciones

---

## 2. DISEÑO Y SISTEMA DE UI

### 2.1 Stack de Diseño

**Framework UI:**

- **Tailwind CSS** como framework principal de utilidades CSS
- **shadcn/ui** como sistema de componentes base
- **Lucide React** para iconografía consistente
- **CSS Variables** para temas dinámicos

#### Configuración de shadcn/ui

```bash
# Instalación inicial
npx shadcn-ui@latest init

# Agregar componentes según necesidad
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add sheet # Para menús móviles
npx shadcn-ui@latest add toast # Para notificaciones
npx shadcn-ui@latest add badge # Para estados de productos
```

### 2.2 Paleta de Colores

#### Modo Claro (Light Mode)

```css
/* components.json - theme config */
:root {
  --background: 0 0% 100%; /* Blanco puro */
  --foreground: 0 0% 3.9%; /* Negro casi puro */
  --card: 0 0% 100%; /* Blanco para cards */
  --card-foreground: 0 0% 3.9%; /* Negro para texto en cards */
  --popover: 0 0% 100%; /* Blanco para popovers */
  --popover-foreground: 0 0% 3.9%; /* Negro para texto en popovers */

  /* Azules suaves como acentos principales */
  --primary: 210 100% 50%; /* Azul principal #0080FF */
  --primary-foreground: 0 0% 98%; /* Blanco sobre azul */
  --secondary: 210 40% 95%; /* Azul muy claro #F0F4FF */
  --secondary-foreground: 210 100% 40%; /* Azul oscuro sobre fondo claro */

  /* Estados y utilidades */
  --muted: 210 40% 98%; /* Gris azulado muy claro */
  --muted-foreground: 215 13.8% 34.1%; /* Gris medio */
  --accent: 210 40% 95%; /* Igual a secondary */
  --accent-foreground: 222.2 84% 4.9%; /* Gris muy oscuro */

  /* Bordes y separadores */
  --border: 214.3 31.8% 91.4%; /* Gris azulado claro */
  --input: 214.3 31.8% 91.4%; /* Igual a border */
  --ring: 210 100% 50%; /* Azul para focus rings */

  /* Estados de productos (semáforo) */
  --success: 142 76% 36%; /* Verde para stock normal */
  --warning: 38 92% 50%; /* Amarillo para stock bajo */
  --destructive: 0 72% 51%; /* Rojo para crítico/vencido */
  --info: 210 100% 50%; /* Azul para información */
}
```

#### Modo Oscuro (Dark Mode)

```css
.dark {
  --background: 0 0% 3.9%; /* Negro casi puro */
  --foreground: 0 0% 98%; /* Blanco casi puro */
  --card: 0 0% 3.9%; /* Negro para cards */
  --card-foreground: 0 0% 98%; /* Blanco para texto en cards */
  --popover: 0 0% 3.9%; /* Negro para popovers */
  --popover-foreground: 0 0% 98%; /* Blanco para texto en popovers */

  /* Rosas suaves como acentos principales */
  --primary: 330 81% 60%; /* Rosa principal #E879F9 */
  --primary-foreground: 0 0% 9%; /* Negro sobre rosa */
  --secondary: 330 12% 15%; /* Rosa muy oscuro #2A1F2A */
  --secondary-foreground: 330 81% 80%; /* Rosa claro sobre fondo oscuro */

  /* Estados y utilidades */
  --muted: 0 0% 15%; /* Gris oscuro */
  --muted-foreground: 215 20.2% 65.1%; /* Gris claro */
  --accent: 330 12% 15%; /* Igual a secondary */
  --accent-foreground: 0 0% 98%; /* Blanco sobre fondo oscuro */

  /* Bordes y separadores */
  --border: 215 27.9% 16.9%; /* Gris oscuro con tinte */
  --input: 215 27.9% 16.9%; /* Igual a border */
  --ring: 330 81% 60%; /* Rosa para focus rings */

  /* Estados de productos (semáforo) */
  --success: 142 70% 45%; /* Verde más claro para contraste */
  --warning: 38 95% 60%; /* Amarillo más claro */
  --destructive: 0 62% 60%; /* Rojo más claro */
  --info: 330 81% 60%; /* Rosa para información */
}
```

### 2.3 Guías de Componentes

#### Componentes Base (shadcn/ui)

```typescript
// components/ui/ - Usar shadcn/ui tal como viene
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// ✅ Correcto - Usar variantes predefinidas
<Button variant="default">Acción Principal</Button>
<Button variant="secondary">Acción Secundaria</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="ghost">Cancelar</Button>

// Estados de productos con badges
<Badge variant="default">Normal</Badge>        // Azul/Rosa según tema
<Badge variant="secondary">Stock Bajo</Badge>  // Gris
<Badge variant="destructive">Crítico</Badge>   // Rojo
```

#### Componentes de Dominio

```typescript
// components/inventory/ - Específicos del negocio
const ProductCard = ({ variant, priority }: ProductCardProps) => {
  const priorityColor = {
    critical: "destructive", // Rojo - ≤2 días para vencer
    urgent: "warning", // Amarillo - ≤5 días para vencer
    low: "secondary", // Gris - Stock bajo mínimo
    normal: "default", // Azul/Rosa - Normal
  } as const;

  return (
    <Card className="touch-target-44">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {variant.baseProduct}
        </CardTitle>
        <Badge variant={priorityColor[priority]}>
          {getPriorityLabel(priority)}
        </Badge>
      </CardHeader>
      <CardContent>{/* Contenido del producto */}</CardContent>
    </Card>
  );
};
```

### 2.4 Responsive Design Mobile-First

#### Breakpoints de Tailwind

```typescript
// tailwind.config.js - Breakpoints optimizados para PWA móvil
module.exports = {
  theme: {
    screens: {
      xs: "375px", // iPhone SE, móviles pequeños
      sm: "640px", // Móviles grandes, tablets pequeñas
      md: "768px", // Tablets
      lg: "1024px", // Desktop pequeño
      xl: "1280px", // Desktop grande
      "2xl": "1536px", // Pantallas muy grandes
    },
  },
};
```

#### Clases Utilitarias Personalizadas

```css
/* globals.css - Utilidades específicas para PWA */
@layer utilities {
  /* Touch targets mínimos para móvil */
  .touch-target-44 {
    @apply min-h-[44px] min-w-[44px];
  }

  /* Safe area para PWA */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Gestos táctiles */
  .swipe-indicator {
    @apply relative overflow-hidden;
  }

  .swipe-indicator::after {
    @apply absolute inset-y-0 right-0 w-1 bg-primary/20;
    content: "";
  }

  /* Estados de conectividad */
  .offline-indicator {
    @apply bg-muted border-l-4 border-l-warning p-2 text-xs;
  }

  .sync-pulse {
    @apply animate-pulse bg-primary/10;
  }
}
```

### 2.5 Guías de Accesibilidad

#### Focus Management

```typescript
// Navegación por teclado optimizada para PWA
const NavigationMenu = () => {
  return (
    <nav className="focus-within:ring-2 focus-within:ring-ring">
      <Button
        variant="ghost"
        className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Productos
      </Button>
      {/* Más elementos de navegación */}
    </nav>
  );
};
```

#### Contraste y Legibilidad

```css
/* Garantizar contraste WCAG AA */
.text-high-contrast {
  @apply text-foreground; /* Ratio 7:1 en ambos temas */
}

.text-medium-contrast {
  @apply text-muted-foreground; /* Ratio 4.5:1 mínimo */
}

/* Indicadores de estado accesibles */
.status-critical {
  @apply bg-destructive text-destructive-foreground;
  @apply before:content-['⚠️'] before:mr-1; /* Icono para usuarios con daltonismo */
}
```

### 2.6 APIs Nativas para PWA

#### Detección Progresiva de Capacidades

```typescript
// lib/services/NativeAPIService.ts
class NativeAPIService {
  // Escaneo de códigos optimizado
  static async initBarcodeScanner() {
    if ("BarcodeDetector" in window) {
      return {
        type: "native",
        detector: new BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128"],
        }),
        performance: "high", // ~5-10% CPU
      };
    } else {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      return {
        type: "fallback",
        detector: new BrowserMultiFormatReader(),
        performance: "medium", // ~15-25% CPU
      };
    }
  }

  // Feedback háptico
  static hapticFeedback = {
    complete: () => navigator.vibrate?.(50),
    remove: () => navigator.vibrate?.([100, 50, 100]),
    error: () => navigator.vibrate?.(200),
    scan: () => navigator.vibrate?.(25),
  };
}
```

### 2.7 Convenciones de Estilo

#### Espaciado Consistente

```typescript
// ✅ Correcto - Usar escala de espaciado de Tailwind
<div className="space-y-4">        {/* 16px entre elementos */}
  <div className="p-4">            {/* 16px padding interno */}
    <h2 className="mb-2">Título</h2> {/* 8px margen inferior */}
    <p className="text-sm">Texto</p>
  </div>
</div>

// ❌ Incorrecto - Valores arbitrarios
<div className="space-y-[13px]">   {/* Valor no estándar */}
  <div className="p-[15px]">        {/* Valor no estándar */}
```

#### Jerarquía Tipográfica

```typescript
// Escala tipográfica para móvil
const TypographyScale = {
  h1: "text-2xl font-bold",          // 24px - Títulos principales
  h2: "text-xl font-semibold",       // 20px - Secciones
  h3: "text-lg font-medium",         // 18px - Subsecciones
  body: "text-base",                 // 16px - Texto normal
  small: "text-sm",                  // 14px - Texto secundario
  xs: "text-xs"                      // 12px - Metadatos, badges
};

// Uso en componentes
<h1 className={TypographyScale.h1}>Dashboard</h1>
<p className={TypographyScale.body}>Contenido principal</p>
<span className={TypographyScale.small}>Última actualización</span>
```

---

## 3. PRINCIPIOS Y MEJORES PRÁCTICAS

### 2.1 Principios SOLID

#### Single Responsibility Principle (SRP)

```typescript
// ✅ Correcto - Una sola responsabilidad por clase
class BarcodeScanner {
  async scanBarcode(videoElement: HTMLVideoElement): Promise<string> {
    // Solo se encarga del escaneo
  }
}

class ProductLookup {
  async findByBarcode(barcode: string): Promise<ProductVariant | null> {
    // Solo se encarga de buscar productos
  }
}

// ❌ Incorrecto - Múltiples responsabilidades
class ProductScanner {
  async scanAndLookup(videoElement: HTMLVideoElement): Promise<ProductVariant> {
    // Hace escaneo Y búsqueda - viola SRP
  }
}
```

#### Open/Closed Principle (OCP)

```typescript
// ✅ Correcto - Abierto a extensión, cerrado a modificación
abstract class PredictionAlgorithm {
  abstract calculate(consumptionData: ConsumptionData[]): number;
}

class ExponentialSmoothingAlgorithm extends PredictionAlgorithm {
  calculate(data: ConsumptionData[]): number {
    // Implementación EES
  }
}

class SimpleMovingAverageAlgorithm extends PredictionAlgorithm {
  calculate(data: ConsumptionData[]): number {
    // Implementación SMA
  }
}
```

#### Liskov Substitution Principle (LSP)

```typescript
// ✅ Correcto - Las subclases son sustituibles
interface DatabaseAdapter {
  save<T>(entity: T): Promise<T>;
  find<T>(id: string): Promise<T | null>;
}

class IndexedDBAdapter implements DatabaseAdapter {
  async save<T>(entity: T): Promise<T> {
    /* ... */
  }
  async find<T>(id: string): Promise<T | null> {
    /* ... */
  }
}

class MongoDBAdapter implements DatabaseAdapter {
  async save<T>(entity: T): Promise<T> {
    /* ... */
  }
  async find<T>(id: string): Promise<T | null> {
    /* ... */
  }
}
```

#### Interface Segregation Principle (ISP)

```typescript
// ✅ Correcto - Interfaces específicas
interface Readable {
  read(): Promise<any>;
}

interface Writable {
  write(data: any): Promise<void>;
}

interface Syncable {
  sync(): Promise<void>;
}

// ❌ Incorrecto - Interfaz muy grande
interface DataManager {
  read(): Promise<any>;
  write(data: any): Promise<void>;
  sync(): Promise<void>;
  backup(): Promise<void>;
  restore(): Promise<void>;
  // ... demasiados métodos
}
```

#### Dependency Inversion Principle (DIP)

```typescript
// ✅ Correcto - Depende de abstracciones
class InventoryService {
  constructor(
    private productRepo: IProductRepository, // Abstracción
    private logger: ILogger // Abstracción
  ) {}
}

// ❌ Incorrecto - Depende de concreciones
class InventoryService {
  constructor() {
    this.productRepo = new MongoProductRepository(); // Concreción
    this.logger = new ConsoleLogger(); // Concreción
  }
}
```

### 2.2 DRY (Don't Repeat Yourself)

```typescript
// ✅ Correcto - Lógica compartida extraída
const STOCK_CALCULATIONS = {
  calculateSafetyStock: (minStock: number, factor = 1.2) =>
    Math.ceil(minStock * factor),
  calculateCoverage: (consumption: number, days = 3) =>
    Math.ceil(consumption * days),
  isLowStock: (current: number, minimum: number) => current <= minimum,
};

// Uso en múltiples lugares
const safetyStock = STOCK_CALCULATIONS.calculateSafetyStock(
  variant.stockMinimo
);
const coverageNeeded = STOCK_CALCULATIONS.calculateCoverage(dailyConsumption);

// ❌ Incorrecto - Código duplicado
function calculateRestockA(variant) {
  return Math.ceil(variant.stockMinimo * 1.2); // Duplicado
}

function calculateRestockB(variant) {
  return Math.ceil(variant.stockMinimo * 1.2); // Duplicado
}
```

### 2.3 KISS (Keep It Simple, Stupid)

```typescript
// ✅ Correcto - Simple y directo
function isExpiringSoon(expirationDate: Date, daysThreshold = 7): boolean {
  const today = new Date();
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold;
}

// ❌ Incorrecto - Innecesariamente complejo
function isExpiringSoon(expirationDate: Date, daysThreshold = 7): boolean {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localNow = new Date(now.getTime() - timezoneOffset);
  const localExpiry = new Date(expiry.getTime() - timezoneOffset);
  // ... lógica innecesariamente compleja para una comparación simple
}
```

### 2.4 YAGNI (You Aren't Gonna Need It)

```typescript
// ✅ Correcto - Solo implementa lo necesario ahora
interface ProductVariant {
  variantId: string;
  sku: string;
  barcode: string;
  type: string;
  size: string;
  price: number;
  stock: number;
  stockMinimo: number;
  expirationDate?: Date;
}

// ❌ Incorrecto - Funcionalidades "por si acaso"
interface ProductVariant {
  variantId: string;
  sku: string;
  barcode: string;
  type: string;
  size: string;
  price: number;
  stock: number;
  stockMinimo: number;
  expirationDate?: Date;
  // Funcionalidades no requeridas:
  supplierInfo?: SupplierInfo; // No necesario ahora
  seasonalAdjustments?: SeasonalData; // No necesario ahora
  promotionalPricing?: PricingRule[]; // No necesario ahora
  nutritionalInfo?: NutritionData; // No necesario ahora
}
```

### 2.5 Composición sobre Herencia

```typescript
// ✅ Correcto - Composición
class NotificationService {
  constructor(
    private pushService: PushNotificationService,
    private emailService: EmailService
  ) {}

  async sendAlert(
    message: string,
    channels: NotificationChannel[]
  ): Promise<void> {
    const promises = channels.map((channel) => {
      switch (channel) {
        case "push":
          return this.pushService.send(message);
        case "email":
          return this.emailService.send(message);
        default:
          throw new Error(`Canal no soportado: ${channel}`);
      }
    });

    await Promise.allSettled(promises);
  }
}

// ❌ Incorrecto - Herencia compleja
abstract class BaseNotificationService {
  abstract send(message: string): Promise<void>;
}

class PushNotificationService extends BaseNotificationService {
  // Implementación específica
}

class EmailNotificationService extends BaseNotificationService {
  // Implementación específica
}

class MultiChannelNotificationService extends BaseNotificationService {
  // Herencia múltiple compleja
}
```

### 2.6 Límites de Complejidad

**Archivos máximo 500 líneas:**

```typescript
// ✅ Correcto - Archivo enfocado
// ProductService.ts (250 líneas)
export class ProductService {
  // Métodos relacionados solo con productos
}

// ❌ Incorrecto - Archivo monolítico
// InventoryManager.ts (1200 líneas)
export class InventoryManager {
  // Productos + Movimientos + Reportes + Sincronización
  // Demasiadas responsabilidades en un archivo
}
```

**Funciones máximo 50 líneas:**

```typescript
// ✅ Correcto - Función enfocada
async function calculateRestockSuggestion(
  variant: ProductVariant
): Promise<RestockSuggestion> {
  const consumptionHistory = await getConsumptionHistory(variant.variantId);
  const prediction = calculatePrediction(consumptionHistory);
  const safetyStock = calculateSafetyStock(variant.stockMinimo);

  return {
    variantId: variant.variantId,
    suggestedQuantity: Math.max(prediction + safetyStock - variant.stock, 0),
    reasoning: generateReasoning(prediction, safetyStock, variant.stock),
  };
}

// ❌ Incorrecto - Función muy larga
async function processInventoryUpdate() {
  // 150 líneas de código mezclando:
  // - Validación
  // - Cálculos complejos
  // - Actualizaciones de BD
  // - Notificaciones
  // - Logging
  // Debe dividirse en funciones más pequeñas
}
```

### 2.7 Comentarios Explicativos

```typescript
/**
 * Calcula la cantidad sugerida de reposición usando Exponential Smoothing Simple (EES)
 *
 * Fórmula: S_t = α × X_t + (1-α) × S_{t-1}
 * Donde α = 0.3 para datos estables de inventario
 *
 * @param consumptionData - Historial de consumo de los últimos 90 días
 * @param alpha - Factor de suavizado (0.1-0.9), default 0.3
 * @returns Predicción de consumo para los próximos 3 días
 */
function calculateExponentialSmoothing(
  consumptionData: ConsumptionData[],
  alpha: number = 0.3
): number {
  if (consumptionData.length === 0) return 0;

  let smoothedValue = consumptionData[0].quantity;

  // Aplicar EES a cada punto de datos histórico
  for (let i = 1; i < consumptionData.length; i++) {
    smoothedValue =
      alpha * consumptionData[i].quantity + (1 - alpha) * smoothedValue;
  }

  // Proyectar para 3 días con factor de seguridad del 20%
  return Math.ceil(smoothedValue * 3 * 1.2);
}

// ✅ Comentarios para lógica de negocio compleja
const priority =
  (1 / Math.max(daysUntilExpiry, 1)) * 0.5 + // Urgencia por vencimiento (50%)
  ((stockMinimo - stockActual) / stockMinimo) * 0.3 + // Nivel de stock (30%)
  (restocksLast30Days / 30) * 0.2; // Frecuencia histórica (20%)

// ❌ Comentarios innecesarios
const total = price * quantity; // Calcula el total multiplicando precio por cantidad
```

---

## 4. ESTÁNDARES DE CÓDIGO

### 4.1 Formato y Estilo

#### Configuración ESLint + Prettier

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "max-lines": ["warn", { "max": 500 }],
    "max-lines-per-function": ["warn", { "max": 50 }]
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Estilo de Código

```typescript
// ✅ Correcto - Formato consistente
const productVariants = await Promise.all(
  barcodes.map(async (barcode) => {
    const variant = await productRepository.findByBarcode(barcode);
    return variant ? transformToVariantDto(variant) : null;
  })
);

// Objetos: una propiedad por línea si excede 80 caracteres
const restockSuggestion: RestockSuggestion = {
  variantId: variant.variantId,
  currentStock: variant.stock,
  minimumStock: variant.stockMinimo,
  suggestedQuantity: calculatedQuantity,
  priority: calculatePriority(variant),
  reasoning: generateExplanation(variant, calculatedQuantity),
};

// Arrays: elementos en líneas separadas si es complejo
const reportTypes: ReportType[] = [
  "expiring-products",
  "top-restocked",
  "low-movement",
  "low-stock",
  "restock-suggestions",
];
```

### 4.2 Manejo de Errores y Excepciones

#### Jerarquía de Errores Personalizada

```typescript
// lib/errors/AppErrors.ts
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;
}

export class SyncError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = true;
}
```

#### Manejo de Errores con Result Pattern

```typescript
// lib/utils/Result.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });
export const Err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Uso en servicios
async function findProductByBarcode(
  barcode: string
): Promise<Result<ProductVariant, NotFoundError>> {
  try {
    const variant = await productRepository.findByBarcode(barcode);
    return variant
      ? Ok(variant)
      : Err(new NotFoundError(`Producto no encontrado: ${barcode}`));
  } catch (error) {
    return Err(
      new SyncError("Error accediendo a base de datos", { barcode, error })
    );
  }
}
```

#### Error Boundaries para React

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado por boundary:", error, errorInfo);
    // Enviar a servicio de logging
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 4.3 Validación de Datos

#### Schemas con Zod

```typescript
// lib/validations/product.schemas.ts
import { z } from "zod";

export const ProductVariantSchema = z.object({
  variantId: z.string().uuid(),
  sku: z.string().min(3).max(50),
  barcode: z.string().min(8).max(20),
  type: z.string().min(1).max(100),
  size: z.string().min(1).max(50),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  stockMinimo: z.number().int().min(0),
  expirationDate: z.date().optional(),
});

export const CreateProductSchema = z.object({
  baseProduct: z.string().min(1).max(200),
  brand: z.string().min(1).max(100),
  category: z.object({
    level1: z.string(),
    level2: z.string(),
    level3: z.string().optional(),
  }),
  variants: z.array(ProductVariantSchema).min(1),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
```

#### Validación en API Routes

```typescript
// app/api/products/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = CreateProductSchema.parse(body);

    const product = await productService.create(validatedData);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

### 4.4 Seguridad

#### Sanitización de Datos

```typescript
// lib/utils/sanitization.ts
import DOMPurify from "isomorphic-dompurify";

export const sanitizeInput = {
  text: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
  },

  barcode: (input: string): string => {
    // Solo números y letras, longitud 8-20
    return input.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);
  },

  number: (input: string): number | null => {
    const num = parseFloat(input.replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? null : num;
  },
};
```

#### Headers de Seguridad

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers de seguridad para PWA
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // CSP específico para PWA
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // PWA necesita inline scripts
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' https://api.whatsapp.com; " +
      "media-src 'self' blob:;" // Para cámara de escaneo
  );

  return response;
}
```

### 4.5 Testing

#### Estructura de Tests

```typescript
// tests/services/InventoryService.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { InventoryService } from "@/lib/services/InventoryService";
import { createMockProductRepository } from "../__mocks__/repositories";

describe("InventoryService", () => {
  let inventoryService: InventoryService;
  let mockProductRepo: ReturnType<typeof createMockProductRepository>;

  beforeEach(() => {
    mockProductRepo = createMockProductRepository();
    inventoryService = new InventoryService(mockProductRepo);
  });

  describe("calculateRestockSuggestions", () => {
    it("should suggest correct quantity for low stock items", async () => {
      // Arrange
      const mockVariant = createMockVariant({
        stock: 5,
        stockMinimo: 20,
        consumptionHistory: [10, 12, 8, 15], // Promedio: 11.25
      });
      mockProductRepo.findById.mockResolvedValue(mockVariant);

      // Act
      const result = await inventoryService.calculateRestockSuggestions([
        "variant-1",
      ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].suggestedQuantity).toBeCloseTo(35); // (11.25 * 3 * 1.2) - 5
      expect(mockProductRepo.findById).toHaveBeenCalledWith("variant-1");
    });

    it("should handle variants with no consumption history", async () => {
      // Arrange
      const mockVariant = createMockVariant({
        stock: 5,
        stockMinimo: 20,
        consumptionHistory: [],
      });
      mockProductRepo.findById.mockResolvedValue(mockVariant);

      // Act
      const result = await inventoryService.calculateRestockSuggestions([
        "variant-1",
      ]);

      // Assert
      expect(result[0].suggestedQuantity).toBe(15); // stockMinimo - stock
    });
  });
});
```

#### Cobertura Mínima

```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      },
      exclude: [
        'tests/**',
        '**/*.types.ts',
        '**/*.config.ts'
      ]
    }
  }
});
```

### 4.6 Documentación Inline

#### JSDoc para Funciones Públicas

````typescript
/**
 * Calcula sugerencias inteligentes de reposición basadas en consumo histórico
 *
 * @param variantIds - IDs de variantes a analizar
 * @param options - Configuración del cálculo
 * @param options.days - Días de cobertura deseada (default: 3)
 * @param options.safetyFactor - Factor de seguridad (default: 1.2)
 * @returns Array de sugerencias ordenadas por prioridad
 *
 * @example
 * ```typescript
 * const suggestions = await calculateRestockSuggestions(
 *   ['var-1', 'var-2'],
 *   { days: 5, safetyFactor: 1.3 }
 * );
 * ```
 */
async function calculateRestockSuggestions(
  variantIds: string[],
  options: RestockOptions = {}
): Promise<RestockSuggestion[]> {
  // Implementación...
}
````

#### Comentarios de Configuración

```typescript
// lib/constants.ts

/**
 * Configuraciones del motor de predicción de inventario
 *
 * Estos valores han sido calibrados específicamente para supermercados
 * pequeños basándose en patrones de consumo típicos.
 */
export const PREDICTION_CONFIG = {
  /**
   * Factor α para Exponential Smoothing Simple (EES)
   * - Valores altos (0.7-0.9): respuesta rápida a cambios, más volatilidad
   * - Valores bajos (0.1-0.3): suavizado mayor, más estabilidad
   * - Valor 0.3: balanceado para inventario de supermercado
   */
  SMOOTHING_FACTOR: 0.3,

  /**
   * Factor de seguridad aplicado a predicciones
   * 20% adicional para compensar variabilidad de demanda
   */
  SAFETY_FACTOR: 1.2,

  /**
   * Días mínimos de historial requeridos para predicción EES
   * Fallback a media móvil simple si hay menos datos
   */
  MIN_HISTORY_DAYS: 14,

  /**
   * Días máximos de historial a considerar
   * Datos más antiguos pueden no ser representativos
   */
  MAX_HISTORY_DAYS: 90,
} as const;
```

---

## 5. METODOLOGÍA DE TRABAJO

### 5.1 Flujo de Desarrollo (Git Flow Simplificado)

#### Estructura de Branches

```
main                    # Producción estable
├── develop            # Integración de features
├── feature/scanner    # Nueva funcionalidad
├── feature/reports    # Nueva funcionalidad
├── hotfix/sync-bug    # Corrección crítica
└── release/v1.0       # Preparación de release
```

#### Comandos Git Típicos

```bash
# Crear feature branch
git checkout develop
git pull origin develop
git checkout -b feature/barcode-scanner

# Trabajo diario
git add .
git commit -m "feat(scanner): add camera initialization logic"
git push origin feature/barcode-scanner

# Finalizar feature
git checkout develop
git pull origin develop
git merge feature/barcode-scanner
git push origin develop
git branch -d feature/barcode-scanner
```

### 5.2 Mensajes de Commit Semánticos (Conventional Commits)

#### Formato

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Tipos de Commit

```bash
# Nuevas funcionalidades
git commit -m "feat(inventory): implement exponential smoothing prediction"
git commit -m "feat(scanner): add barcode detection with ZXing"
git commit -m "feat(reports): generate PDF restock suggestions"

# Corrección de bugs
git commit -m "fix(sync): resolve offline queue duplicate entries"
git commit -m "fix(scanner): handle camera permission denied gracefully"

# Refactoring
git commit -m "refactor(services): extract prediction logic to separate service"
git commit -m "refactor(components): split ProductForm into smaller components"

# Documentación
git commit -m "docs(api): add JSDoc to inventory service methods"
git commit -m "docs(readme): update installation and setup instructions"

# Configuración
git commit -m "chore(deps): update Next.js to v14.2"
git commit -m "chore(config): configure Tailwind for PWA theme"

# Tests
git commit -m "test(inventory): add unit tests for restock calculations"
git commit -m "test(scanner): add integration tests for barcode detection"

# Performance
git commit -m "perf(indexeddb): optimize product queries with compound indexes"
git commit -m "perf(components): memoize expensive calculation in ProductCard"

# Estilos
git commit -m "style(ui): improve mobile responsiveness for product lists"
git commit -m "style(forms): standardize form validation error messages"
```

#### Scopes Recomendados

- `inventory` - Gestión de productos y stock
- `scanner` - Funcionalidades de escaneo de códigos
- `sync` - Sincronización offline/online
- `reports` - Generación y exportación de reportes
- `notifications` - Sistema de alertas y notificaciones
- `ui` - Componentes de interfaz de usuario
- `api` - Endpoints y lógica de API
- `db` - Acceso a datos y schemas
- `pwa` - Configuraciones PWA y Service Workers
- `config` - Archivos de configuración

### 5.3 Proceso de Revisión de Código

#### Template de Pull Request

```markdown
## Descripción

Breve descripción de los cambios implementados.

## Tipo de Cambio

- [ ] Bug fix (cambio que corrige un problema)
- [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] Breaking change (cambio que rompe funcionalidad existente)
- [ ] Documentación (actualización de documentación)

## Checklist

- [ ] Mi código sigue las guías de estilo del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado áreas complejas de mi código
- [ ] He agregado tests que validan mis cambios
- [ ] Tests nuevos y existentes pasan localmente
- [ ] He actualizado documentación si es necesario

## Testing

Describe las pruebas realizadas para validar los cambios.

## Screenshots (si aplica)

Agregar capturas de pantalla para cambios de UI.

## Notas Adicionales

Cualquier información adicional para los revisores.
```

#### Criterios de Aprobación

1. **Funcionalidad**: Los cambios cumplen los requisitos
2. **Estilo**: Código sigue convenciones establecidas
3. **Tests**: Cobertura adecuada y tests pasando
4. **Performance**: Sin degradación significativa
5. **Seguridad**: No introduce vulnerabilidades
6. **Documentación**: Cambios documentados apropiadamente

### 5.4 Estrategia de Testing Incremental

#### Pirámide de Testing

```
        ┌─────────────┐
        │   E2E (10%) │  <- Cypress/Playwright
        │             │
      ┌─┴─────────────┴─┐
      │ Integration (20%)│  <- API + DB tests
      │                 │
    ┌─┴─────────────────┴─┐
    │   Unit Tests (70%)   │  <- Vitest + Testing Library
    │                     │
    └─────────────────────┘
```

#### Tests por Categoría

```bash
# Unit Tests (70%)
npm run test:unit                    # Funciones puras, utilidades
npm run test:components             # Componentes React aislados
npm run test:services              # Lógica de negocio

# Integration Tests (20%)
npm run test:api                   # API endpoints + DB
npm run test:hooks                 # Custom hooks con contexto
npm run test:sync                  # Sincronización offline/online

# E2E Tests (10%)
npm run test:e2e                   # Flujos completos de usuario
npm run test:pwa                   # Funcionalidades PWA
```

#### Estrategia por Sprint

```
Sprint 1: Unit tests para utilidades y servicios core
Sprint 2: Component tests para UI principal
Sprint 3: Integration tests para sync y API
Sprint 4: E2E tests para flujos críticos
Sprint 5+: Mantener cobertura, agregar regression tests
```

### 5.5 Criterios de Definition of Done

#### Para Features

- [ ] **Funcionalidad**

  - [ ] Requisitos funcionales implementados completamente
  - [ ] Casos edge manejados apropiadamente
  - [ ] Funciona offline (crítico para PWA)

- [ ] **Calidad de Código**

  - [ ] Código reviewed y aprobado por al menos 1 dev
  - [ ] Sigue convenciones de naming y estructura
  - [ ] No duplicación innecesaria (DRY)
  - [ ] Funciones < 50 líneas, archivos < 500 líneas

- [ ] **Testing**

  - [ ] Unit tests con cobertura ≥ 80%
  - [ ] Integration tests para APIs críticas
  - [ ] Tests E2E para flujo principal
  - [ ] Todos los tests pasando en CI

- [ ] **Performance**

  - [ ] Lighthouse score ≥ 90 en mobile
  - [ ] First Contentful Paint < 2s
  - [ ] Largest Contentful Paint < 4s
  - [ ] No memory leaks detectados

- [ ] **Documentación**

  - [ ] JSDoc en funciones públicas
  - [ ] README actualizado si es necesario
  - [ ] API documentation actualizada
  - [ ] Cambios documentados en changelog

- [ ] **Accesibilidad**
  - [ ] Navegable por teclado
  - [ ] Screen reader compatible
  - [ ] Contraste cumple WCAG AA
  - [ ] Focus management apropiado

#### Para Bug Fixes

- [ ] **Corrección**

  - [ ] Root cause identificado y documentado
  - [ ] Fix implementado sin side effects
  - [ ] Regresion tests agregados

- [ ] **Validación**
  - [ ] Bug reproducido y validado como corregido
  - [ ] Tests relacionados pasando
  - [ ] No nuevos bugs introducidos

### 5.6 Integración Continua y Deployment

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e

  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

#### Ambientes

```
Development  -> Vercel Preview (cada PR)
Staging      -> develop branch deploy
Production   -> main branch deploy
```

---

## 6. ASISTENCIA CONTEXTUAL

### 6.1 Instrucciones para el Asistente IA

**ANTES de hacer sugerencias de código, SIEMPRE:**

1. **Pregunta por clarificaciones arquitectónicas:**

   ```
   "¿Prefieres que implemente esto como un hook personalizado,
   un servicio independiente, o integrado en el componente existente?"

   "¿Quieres que use el patrón Repository para esto,
   o prefieres acceso directo a IndexedDB?"

   "¿Debería manejar este estado localmente en el componente
   o en el estado global de la aplicación?"
   ```

2. **Explica el razonamiento detrás de sugerencias:**

   ```
   "Sugiero usar useMemo aquí porque el cálculo de priorización
   es costoso y solo debe recalcularse cuando cambian las dependencias."

   "Recomiendo extraer esta lógica a un servicio separado
   porque viola el principio de responsabilidad única."

   "Propongo usar React Query para esto porque maneja
   automáticamente cache, revalidación y estados de loading."
   ```

3. **Señala trade-offs en soluciones alternativas:**

   ```
   "Opción A (IndexedDB directo): Más rápido, pero acopla componente a DB
   Opción B (Service layer): Más mantenible, pero agrega abstracción
   Opción C (Custom hook): Balance entre performance y reutilización"

   "Podríamos usar localStorage (simple) vs IndexedDB (complejo pero robusto)
   vs Zustand (estado global). ¿Cuál prefieres considerando que es PWA offline?"
   ```

4. **Sugiere refactorizaciones cuando detectes code smells:**

   ```
   "Este componente tiene 15 props - considera usar compound components
   o context pattern para reducir prop drilling."

   "Esta función tiene 4 parámetros booleanos - un objeto de opciones
   sería más legible y extensible."

   "Hay duplicación en estas 3 funciones - podríamos extraer
   la lógica común a una utilidad reutilizable."
   ```

5. **Ofrece recursos cuando introduzcas conceptos nuevos:**

   ```
   "Este patrón Repository es útil aquí. Si quieres leer más:
   - Martin Fowler's PoEAA: Repository pattern
   - Clean Architecture by Robert Martin
   - Ejemplo práctico: [link a implementación]"

   "Para entender mejor IndexedDB en React:
   - MDN IndexedDB API guide
   - Dexie.js documentation (wrapper recomendado)
   - PWA offline patterns: [recursos específicos]"
   ```

### 6.2 Contexto del Proyecto a Mantener

**El asistente DEBE recordar siempre:**

1. **Es una PWA offline-first**: Prioriza IndexedDB sobre APIs externas
2. **Usuario objetivo**: Reponedor con móvil, una sola mano disponible
3. **Stack específico**: Next.js 14 + TypeScript + MongoDB + IndexedDB
4. **Patrones establecidos**: Repository + Service layer + Custom hooks
5. **Límites técnicos**: Mobile-first, funciona sin internet, performance crítica

### 6.3 Preguntas de Contexto Recomendadas

**Cuando el usuario pida implementar una feature:**

```
🤔 "Antes de implementar [FEATURE], necesito entender:

📱 ¿Cómo debería funcionar esta feature offline?
🔄 ¿Requiere sincronización con el servidor cuando haya conexión?
📊 ¿Los datos deben persistir en IndexedDB o es temporal?
🎯 ¿Es parte de un flujo crítico que debe ser super rápido?
📋 ¿Hay validaciones específicas de negocio que deba considerar?

Basándome en tu respuesta, puedo sugerir la mejor implementación
siguiendo nuestras convenciones arquitectónicas."
```

**Cuando detectes posibles mejoras:**

```
💡 "He notado que [SITUACIÓN]. Esto podría mejorarse:

🔧 Opción 1: [DESCRIPCIÓN]
   ✅ Pros: [VENTAJAS]
   ❌ Contras: [DESVENTAJAS]

🔧 Opción 2: [DESCRIPCIÓN]
   ✅ Pros: [VENTAJAS]
   ❌ Contras: [DESVENTAJAS]

¿Cuál te parece mejor considerando nuestros principios de
performance móvil y funcionalidad offline?"
```

### 6.4 Ejemplos de Asistencia Contextual

#### Ejemplo 1: Sugerencia de Arquitectura

```
Usuario: "Necesito mostrar las notificaciones de productos próximos a vencer"

Asistente:
"🤔 Para las notificaciones de vencimiento, veo varias opciones:

📱 **Opción A: Componente con hook personalizado**
- `useExpiringProducts()` que consulte IndexedDB cada 30 segundos
- ✅ Tiempo real, simple de implementar
- ❌ Podría afectar performance si hay muchos productos

📊 **Opción B: Service Worker con Periodic Background Sync**
- Calcula notificaciones en background, almacena resultado
- ✅ No bloquea UI, mejor para PWA offline
- ❌ Más complejo, requiere configuración SW

🔄 **Opción C: Computed state con Zustand**
- Estado derivado que se actualiza cuando cambia inventory
- ✅ Balance performance/simplicidad
- ❌ Requiere configurar store global

Dado que es PWA crítica para trabajo diario, recomendaría **Opción B**
para mantener fluidez. ¿Qué opinas? ¿O tienes preferencia específica?"
```

#### Ejemplo 2: Code Review Contextual

````
Usuario: [Comparte código con función de 80 líneas]

Asistente:
"📏 Esta función excede nuestro límite de 50 líneas. Analicemos:

🔍 **Code smells detectados:**
- Múltiples responsabilidades: validación + cálculo + persistencia
- 6 parámetros (límite recomendado: 3-4)
- Lógica de negocio mezclada con acceso a datos

🛠️ **Refactorización sugerida:**
```typescript
// Dividir en funciones más pequeñas
const validateRestockData = (data: RestockData): ValidationResult => {...}
const calculateSuggestions = (variants: ProductVariant[]): Suggestions => {...}
const persistSuggestions = (suggestions: Suggestions): Promise<void> => {...}

// Función orquestadora
const createRestockList = async (data: RestockData): Promise<RestockList> => {
  const validation = validateRestockData(data);
  if (!validation.isValid) throw new ValidationError(validation.errors);

  const suggestions = calculateSuggestions(data.variants);
  await persistSuggestions(suggestions);

  return new RestockList(suggestions);
}
````

Esto respeta SRP y hace el código más testeable. ¿Procedo con esta refactorización?"

```

---

**Versión del documento:** v1.0
**Fecha de creación:** 6 de noviembre de 2025
**Proyecto:** GondolApp - PWA Offline-First para Reposición de Supermercado

---

> 💡 **Nota importante:** Este documento es vivo y debe actualizarse conforme evolucione el proyecto. Todas las decisiones arquitectónicas significativas deben documentarse aquí para mantener consistencia en el desarrollo.
```
