import { defineConfig } from 'cypress';

export default defineConfig({
  // Configuración para E2E tests
  e2e: {
    // URL base de la aplicación
    baseUrl: 'http://localhost:3000',

    // Directorio de tests E2E
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // Directorio de fixtures
    fixturesFolder: 'cypress/fixtures',

    // Directorio de screenshots
    screenshotsFolder: 'cypress/screenshots',

    // Directorio de videos
    videosFolder: 'cypress/videos',

    // Directorio de support files
    supportFile: 'cypress/support/e2e.ts',

    // Configuración de viewport (mobile first)
    viewportWidth: 390,
    viewportHeight: 844,

    // Timeouts optimizados para PWA
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // Configuración de video y screenshots
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,

    // Configuración específica para PWA testing
    chromeWebSecurity: false,

    // Variables de entorno para tests
    env: {
      NODE_ENV: 'test',
    },

    // Configuración de retry para tests flaky
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Setup de eventos
    setupNodeEvents(on, config) {
      // Plugin para tasks de Node.js si es necesario
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        // Task para limpiar IndexedDB en tests
        clearIndexedDB() {
          // Implementación personalizada si es necesaria
          return null;
        },
      });

      return config;
    },
  },

  // Configuración para Component Testing
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },

    // Patrón de archivos de component tests
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',

    // Archivo de setup para component testing
    setupNodeEvents(_on, config) {
      // Configuración adicional para component tests
      return config;
    },

    // Configuración de viewport para component tests
    viewportWidth: 390,
    viewportHeight: 844,
  },

  // Configuración global
  watchForFileChanges: false,

  // Configuración de User Agent para simular móvil
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',

  // Configuración experimental
  experimentalStudio: true,
  experimentalMemoryManagement: true,
});
