import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

// Limpiar después de cada test
afterEach(() => {
  cleanup();
});

// Mock para APIs del navegador que no están disponibles en jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock para IntersectionObserver (usado en componentes lazy loading)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para ResizeObserver (usado en componentes responsive)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para APIs de PWA
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      unregister: vi.fn().mockResolvedValue(true),
    }),
  },
});

// Mock para Barcode Detection API (específico para GondolApp)
Object.defineProperty(window, 'BarcodeDetector', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    detect: vi.fn().mockResolvedValue([
      {
        rawValue: '1234567890123',
        format: 'ean_13',
      },
    ]),
  })),
});

// Mock para Vibration API (feedback táctil en móvil)
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
});

// Mock para localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock para sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock para IndexedDB (usado para almacenamiento offline)
const indexedDBMock = {
  open: vi.fn().mockResolvedValue({
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        add: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      }),
    }),
    close: vi.fn(),
  }),
  deleteDatabase: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Mock para geolocation (si se usa en el futuro)
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation(success => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
    }),
    watchPosition: vi.fn(),
  },
});

// Configuración global para tests
expect.extend({
  // Custom matchers específicos para GondolApp si son necesarios
});

// Configurar timezone para tests consistentes
process.env.TZ = 'UTC';
