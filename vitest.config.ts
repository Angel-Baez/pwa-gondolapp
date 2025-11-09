import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Configuración del entorno de testing
    environment: 'jsdom',

    // Archivos de setup
    setupFiles: ['./tests/setup.ts'],

    // Patrones de archivos de test
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],

    // Patrones de archivos a excluir
    exclude: ['node_modules', '.next', 'coverage', 'cypress'],

    // Configuración de coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'cypress/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**',
        '.next/**',
        'src/types/**',
        'src/lib/constants.ts',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    // Timeouts optimizados para PWA
    testTimeout: 10000,
    hookTimeout: 10000,

    // Configuración de reporters
    reporters: ['verbose'],

    // Variables globales para testing
    globals: true,

    // Configuración de watch mode
    watch: false,

    // Pool de workers para rendimiento
    pool: 'threads',
  },

  // Resolución de paths similar a Next.js
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/app': resolve(__dirname, './src/app'),
    },
  },

  // Configuración específica para PWA testing
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
