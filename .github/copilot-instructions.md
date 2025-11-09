# GondolApp PWA - AI Coding Agent Instructions

## Project Overview

GondolApp is an **offline-first PWA** for supermarket inventory management, built for mobile-first usage by warehouse workers. The app functions completely without internet, syncing when connection is available.

### Core Architecture

- **Next.js 14** (App Router) + **TypeScript**
- **Offline-first data strategy**: IndexedDB (Dexie) + MongoDB with selective sync
- **UI**: Tailwind CSS + shadcn/ui with dark/light theme support
- **Mobile-optimized**: Touch targets, haptic feedback, one-handed operation

## Essential Data Flow Patterns

### Three-Tier Data Strategy

| Data Type            | Storage                  | Sync Pattern  | Rationale                      |
| -------------------- | ------------------------ | ------------- | ------------------------------ |
| **Product Catalog**  | MongoDB + IndexedDB copy | Bidirectional | Persistent + fast access       |
| **Daily Lists**      | IndexedDB only           | No sync       | Fastest, no network dependency |
| **Movement History** | MongoDB only             | Append-only   | Permanent audit trail          |

### Key Architectural Decisions

1. **Barcode as Primary Key**: Each product variant identified by unique barcode
2. **Auto-generated SKU**: `{first10digits}-{A/B/C}` pattern eliminates manual coding
3. **Physical Zone Ordering**: Lists sorted by warehouse layout for 10-20min daily savings
4. **Atomic Transactions**: All operations use Dexie transactions for data consistency

## Folder Structure & Patterns

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

### Component Patterns

```typescript
// ✅ React Components
const ProductCard = ({ variant }: ProductCardProps) => {
  // Server Components by default
  // Add "use client" only for state/events/browser APIs
};

// ✅ Service Layer (no UI, no direct DB access)
class InventoryService {
  constructor(private productRepo: IProductRepository) {}
}

// ✅ Repository Pattern (CRUD only, no business logic)
class ProductRepository implements IProductRepository {
  // Files in /lib/db/repositories
  // Implement interfaces from /types
}
```

## Critical Mobile-First Considerations

### Performance Constraints

- **IndexedDB limit**: ~50-100MB on mobile devices
- **Touch targets**: Minimum 44×44px for reliable interaction
- **Haptic feedback**: Use `navigator.vibrate()` for confirmation actions only
- **Battery optimization**: Auto-pause camera after 30s, throttled barcode scanning

### Offline Resilience

```typescript
// Essential pattern for offline operations
await db.transaction('rw', [db.products, db.pendingSync], async () => {
  // All operations atomic - if any fails, all rollback
  await updateLocalStock(variantId, quantity);
  await queueForSync(movement);
});
```

### Barcode Scanner Implementation

```typescript
// Progressive enhancement: Native API first, fallback to library
const initScanner = async () => {
  if ('BarcodeDetector' in window) {
    return new BarcodeDetector({ formats: ['ean_13', 'ean_8'] });
  }
  // Fallback to @zxing/browser
  return await import('@zxing/browser');
};
```

## Business Logic Specifics

### Product Variant System

- **Base Product**: "Leche Milex" (brand + name)
- **Variants**: Different sizes/types with unique barcodes
- **Physical Zones**: "Lácteos - Estante Bajo Derecha" for warehouse optimization
- **Categories**: Fixed 3-level hierarchy (Lácteos > Leches > Entera)

### Inventory Workflows

1. **Restock Lists**: Scan → Add → Sort by zone → Swipe to complete
2. **Expiration Alerts**: Push notifications at 7AM local time
3. **Stock Calculations**: Simple factor-based (stockMinimo × 1.2) initially

## Code Style & Constraints

### Naming Conventions

- **Files**: `ProductCard.tsx`, `useProductSync.ts`, `inventory.types.ts`
- **Functions**: `camelCase` with descriptive names
- **Components**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`

### Quality Gates

- **Functions**: Max 50 lines
- **Files**: Max 500 lines
- **No business logic in UI components** - extract to services/hooks
- **No direct DB access in services** - use repository pattern

## Common Implementation Patterns

### Error Handling

```typescript
// Use Result pattern for service methods
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### Sync Queue Management

```typescript
// Queue operations offline, process when online
const queueOperation = async (operation: SyncOperation) => {
  await db.pendingSync.add({
    type: operation.type,
    data: operation.data,
    timestamp: new Date(),
    retries: 0,
  });
};
```

### Mobile UI Patterns

```typescript
// Touch-friendly lists with haptic feedback
const handleSwipeComplete = (item: RestockItem) => {
  completeItem(item);
  navigator.vibrate?.(50); // Success confirmation
};
```

## Critical "Don'ts"

1. **Don't mix data strategies** - respect the three-tier pattern
2. **Don't create API endpoints without confirmation** - ask first
3. **Don't put business logic in React components** - use services
4. **Don't access DB directly from services** - use repositories
5. **Don't ignore offline-first** - every feature must work without internet
6. **Don't assume desktop usage** - everything must work on mobile with one hand

## When Implementing New Features

### Essential Questions to Ask:

1. **How does this work offline?** (Critical requirement)
2. **Which data tier does this belong to?** (Catalog/Lists/History)
3. **Does this need haptic feedback?** (Only for confirmable actions)
4. **How does this sync when online?** (Define sync strategy)
5. **Is this mobile-optimized?** (Touch targets, one-handed use)

### Architecture Decision Template:

- **Repository layer**: Data access only, implements interface from `/types`
- **Service layer**: Business logic, receives repositories via constructor
- **Component layer**: UI only, delegates logic to hooks/services
- **Hook layer**: Stateful logic, bridges services and components

## Testing Strategy

- **Unit tests**: 70% coverage target (utilities, services)
- **Component tests**: 20% coverage (React components with Testing Library)
- **E2E tests**: 10% coverage (critical user flows with Cypress)
- **Mock offline/online states** for comprehensive sync testing

## Quick Reference: Key Files

- **Business logic specs**: `.copilot/supermarket.md`
- **Architecture details**: `.copilot/development-guidelines.md`
- **Component patterns**: `.copilot/react-component.md`
- **Repository pattern**: `.copilot/repository-pattern.md`
- **Service layer**: `.copilot/service-layer.md`
- **Style guide**: `.copilot/style-guide.md`

---

_Remember: This is a mission-critical offline-first PWA for warehouse workers. Every feature must prioritize reliability, mobile usability, and offline functionality._
