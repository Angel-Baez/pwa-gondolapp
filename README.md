# GondolApp PWA

Una aplicación móvil progresiva (PWA) offline-first para gestión de inventario de supermercados, optimizada para trabajadores de almacén.

## 🚀 Características Principales

- **Offline-first**: Funciona completamente sin conexión a internet
- **Mobile-optimized**: Diseñado para uso con una sola mano
- **Escaneo de códigos**: Barcode Detector API + fallback a @zxing/browser
- **Feedback háptico**: Confirmaciones táctiles para uso intensivo
- **Sincronización inteligente**: Sync automático cuando hay conexión

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + React 18
- **UI**: Tailwind CSS + shadcn/ui (modo claro/oscuro)
- **PWA**: next-pwa + Workbox
- **Base de datos**: MongoDB + IndexedDB (Dexie.js)
- **Testing**: Vitest + Testing Library + Cypress
- **Deployment**: Vercel

## 📁 Estructura del Proyecto

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

## 🎯 Arquitectura de Datos

| Tipo de Dato              | Almacenamiento      | Patrón        | Razón                    |
| ------------------------- | ------------------- | ------------- | ------------------------ |
| **Catálogo de productos** | MongoDB + IndexedDB | Bidireccional | Persistencia + velocidad |
| **Listas diarias**        | Solo IndexedDB      | Local         | Velocidad máxima         |
| **Historial movimientos** | MongoDB             | Append-only   | Auditoría permanente     |

## 🚦 Flujo de Desarrollo

Utilizamos **Git Flow simplificado** con **Conventional Commits**:

```
main                    # Producción estable
├── develop            # Integración de features
├── feature/scanner    # Nueva funcionalidad
└── hotfix/sync-bug    # Corrección crítica
```

### Conventional Commits

```bash
# Nuevas funcionalidades
git commit -m "feat(scanner): add barcode detection with ZXing"

# Corrección de bugs
git commit -m "fix(sync): resolve offline queue duplicate entries"

# Refactoring
git commit -m "refactor(services): extract prediction logic to separate service"
```

## 📋 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Testing
npm run test              # Unit tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report

# Build
npm run build
npm run start

# Linting
npm run lint
npm run type-check
```

## 🎯 Principios de Desarrollo

1. **Offline-first**: Toda funcionalidad debe trabajar sin internet
2. **Mobile-first**: Optimizado para uso con una mano
3. **Repository Pattern**: Separación clara entre acceso a datos y lógica
4. **Service Layer**: Lógica de negocio centralizada
5. **Atomic Transactions**: Operaciones IndexedDB siempre atómicas

## 📚 Documentación Adicional

- [Guías de desarrollo](.copilot/development-guidelines.md)
- [Especificaciones de negocio](.copilot/supermarket.md)
- [Patrones arquitectónicos](.copilot/)

## 🏃‍♂️ Quick Start

1. Clonar el repositorio
2. `npm install`
3. Configurar variables de entorno (`.env.local`)
4. `npm run dev`
5. Abrir http://localhost:3000

---

**Versión**: v1.0  
**Fecha**: Noviembre 2025  
**Equipo**: GondolApp Development Team
