/// <reference types="cypress" />

// Importar comandos personalizados
import './commands';

// Configuraciones globales para todos los tests E2E
beforeEach(() => {
  // Configurar viewport móvil por defecto
  cy.viewport(390, 844);

  // Configurar interceptores para APIs si es necesario
  // cy.intercept('GET', '/api/**', { fixture: 'api-response.json' })
});

// Configuración global de Cypress
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);

// Helper function for error checking
const isPWARelatedError = (message: string): boolean => {
  const pwaErrorPatterns = ['ServiceWorker', 'workbox', 'sw.js'];
  return pwaErrorPatterns.some(pattern => message.includes(pattern));
};

// Helper function for service worker cleanup
const cleanupServiceWorkers = (win: Window): void => {
  if ('serviceWorker' in win.navigator) {
    win.navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
};

// Manejo de errores no capturados (común en PWAs)
Cypress.on('uncaught:exception', err => {
  // Ignorar errores específicos de service workers y PWA
  return !isPWARelatedError(err.message);
});

// Configuración adicional para PWA testing
before(() => {
  // Limpiar service workers antes de comenzar los tests
  cy.window().then(win => {
    cleanupServiceWorkers(win);
  });

  // Limpiar localStorage y sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
});
