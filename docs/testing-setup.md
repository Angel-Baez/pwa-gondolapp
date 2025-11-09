# Stack de Testing - GondolApp

Este documento describe la configuración completa del stack de testing para GondolApp, incluyendo unit tests, integration tests y end-to-end tests.

## 🧪 Arquitectura de Testing

### Estrategia de Testing (Pirámide de Tests)

```
        /\
       /  \     E2E Tests (10%)
      /____\    - Cypress
     /      \
    /        \  Integration Tests (20%)
   /_________ \ - Testing Library + Vitest
  /            \
 /______________\ Unit Tests (70%)
                  - Vitest + jsdom
```

## 🔧 Herramientas Configuradas

### 1. **Vitest** - Unit & Integration Testing

- **Framework**: Vitest con jsdom
- **Cobertura**: v8 provider
- **Configuración**: `vitest.config.ts`
- **Setup**: `tests/setup.ts`

#### Características:

- ✅ Hot reload en modo watch
- ✅ Compatibilidad con ES modules
- ✅ Mocks para APIs de PWA
- ✅ Coverage reports en HTML/JSON
- ✅ Integración con TypeScript

### 2. **Testing Library** - Component Testing

- **React Testing Library**: Testing de componentes
- **Jest DOM**: Matchers adicionales
- **User Events**: Simulación de interacciones

#### Características:

- ✅ Testing centrado en comportamiento de usuario
- ✅ Queries accesibles por defecto
- ✅ Mocks para hooks y contextos
- ✅ Simulación de eventos táctiles

### 3. **Cypress** - E2E Testing

- **Framework**: Cypress v13+
- **Configuración**: `cypress.config.ts`
- **Comandos personalizados**: `cypress/support/commands.ts`

#### Características:

- ✅ Tests en navegador real
- ✅ Comandos personalizados para PWA
- ✅ Simulación de estados offline/online
- ✅ Testing móvil-first (viewport 390x844)
- ✅ Grabación de videos y screenshots

## 📁 Estructura de Archivos

```
pwa-gondolapp/
├── tests/
│   ├── setup.ts                 # Configuración global de Vitest
│   ├── __mocks__/              # Mocks globales
│   ├── components/             # Tests de componentes
│   ├── hooks/                  # Tests de custom hooks
│   ├── services/               # Tests de servicios
│   └── utils/                  # Tests de utilidades
├── cypress/
│   ├── e2e/                    # Tests end-to-end
│   ├── fixtures/               # Datos de prueba
│   ├── support/
│   │   ├── e2e.ts             # Setup global E2E
│   │   └── commands.ts        # Comandos personalizados
├── src/
│   └── **/*.{test,spec}.{ts,tsx}  # Tests co-ubicados
├── vitest.config.ts            # Configuración Vitest
├── cypress.config.ts           # Configuración Cypress
└── coverage/                   # Reports de cobertura
```

## 🚀 Scripts Disponibles

### Unit & Integration Tests (Vitest)

```bash
npm run test              # Ejecutar tests en modo watch
npm run test:run          # Ejecutar tests una vez
npm run test:coverage     # Ejecutar con reporte de cobertura
npm run test:ui           # Abrir interfaz web de Vitest
```

### E2E Tests (Cypress)

```bash
npm run cypress:open      # Abrir Cypress en modo interactivo
npm run cypress:run       # Ejecutar todos los tests E2E
npm run e2e              # Alias para cypress:run
npm run e2e:headed       # Ejecutar E2E con cabecera visible
```

### Scripts Combinados

```bash
npm run test:all         # Ejecutar unit + E2E tests
```

## 🎯 Configuración Específica para PWA

### Mocks para APIs del Navegador

#### Service Workers

```typescript
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      unregister: vi.fn().mockResolvedValue(true),
    }),
  },
});
```

#### IndexedDB

```typescript
const indexedDBMock = {
  open: vi.fn().mockResolvedValue({
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        add: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
};
```

#### Barcode Detection API

```typescript
Object.defineProperty(window, 'BarcodeDetector', {
  value: vi.fn().mockImplementation(() => ({
    detect: vi.fn().mockResolvedValue([
      {
        rawValue: '1234567890123',
        format: 'ean_13',
      },
    ]),
  })),
});
```

### Comandos Cypress Personalizados

#### Simulación de Estados de Conectividad

```typescript
// En tests E2E
cy.window().then(win => {
  win.dispatchEvent(new Event('offline'));
});
```

#### Limpieza de IndexedDB

```typescript
export const clearIndexedDB = () => {
  cy.window().then(win => {
    const deleteReq = win.indexedDB.deleteDatabase('GondolAppDB');
  });
};
```

## 📊 Umbrales de Cobertura

### Configuración Actual

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Archivos Excluidos de Cobertura

- Archivos de configuración
- Archivos de tipos TypeScript
- Tests y mocks
- Constantes y configuraciones
- Build artifacts

## 🧪 Patrones de Testing

### 1. Unit Tests - Componentes

```typescript
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

describe('ThemeProvider', () => {
  it('should render children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </ThemeProvider>
    )
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })
})
```

### 2. Integration Tests - Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  it('should persist data in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    // Test implementation
  });
});
```

### 3. E2E Tests - User Flows

```typescript
describe('Product Scanning Flow', () => {
  it('should scan barcode and add to inventory', () => {
    cy.visit('/scanner');
    cy.get('[data-testid="scanner-button"]').click();
    // Simulate barcode scan
    cy.window().then(win => {
      win.dispatchEvent(
        new CustomEvent('barcode-scanned', {
          detail: { barcode: '1234567890123' },
        })
      );
    });
    cy.get('[data-testid="product-added"]').should('be.visible');
  });
});
```

## 🔍 Debugging y Troubleshooting

### Common Issues

#### 1. **Tests fallan por timeout**

```typescript
// Aumentar timeout en vitest.config.ts
test: {
  testTimeout: 15000,
  hookTimeout: 15000,
}
```

#### 2. **Cypress no encuentra elementos**

```typescript
// Usar data-testid en lugar de clases CSS
cy.get('[data-testid="element-id"]');
```

#### 3. **Mocks no funcionan**

```typescript
// Verificar que los mocks están en tests/setup.ts
// y que se importan correctamente
```

### Debugging Commands

```bash
# Ver tests en modo debug
npm run test:ui

# Ejecutar test específico
npx vitest run src/components/Button.test.tsx

# Ejecutar Cypress en modo debug
npm run cypress:open
```

## 📈 CI/CD Integration

### GitHub Actions (futuro)

```yaml
- name: Run Unit Tests
  run: npm run test:run

- name: Run E2E Tests
  run: npm run e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 📋 Checklist de Testing

### Antes de hacer commit:

- [ ] Tests unitarios pasan (`npm run test:run`)
- [ ] Cobertura está por encima del 70%
- [ ] Tests E2E críticos pasan
- [ ] No hay console.errors en tests
- [ ] Mocks están actualizados

### Antes de hacer deploy:

- [ ] Todos los tests pasan en CI
- [ ] Performance tests OK
- [ ] Accessibility tests OK
- [ ] PWA functionality tests OK

---

_Esta configuración está optimizada para el desarrollo de GondolApp, cubriendo tanto funcionalidad offline como interacciones móviles específicas._
