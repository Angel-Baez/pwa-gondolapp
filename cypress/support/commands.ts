/// <reference types="cypress" />

// Comandos personalizados para GondolApp PWA

// Función helper para simular escaneo de código de barras
export const scanBarcode = (barcode: string) => {
  cy.window().then(win => {
    // Simular evento de escaneo de código de barras
    win.dispatchEvent(
      new CustomEvent('barcode-scanned', {
        detail: { barcode },
      })
    );
  });
};

// Función helper para simular estado offline
export const goOffline = () => {
  cy.window().then(win => {
    cy.wrap(win).invoke('dispatchEvent', new Event('offline'));
  });
};

// Función helper para simular estado online
export const goOnline = () => {
  cy.window().then(win => {
    cy.wrap(win).invoke('dispatchEvent', new Event('online'));
  });
};

// Función helper para limpiar IndexedDB
export const clearIndexedDB = () => {
  cy.window().then(win => {
    if (win.indexedDB) {
      const databases = ['GondolAppDB']; // Nombre de la base de datos de la app
      databases.forEach(dbName => {
        const deleteReq = win.indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => {
          cy.log(`IndexedDB ${dbName} cleared`);
        };
      });
    }
  });
};

// Función helper para esperar a que la PWA esté lista
export const waitForPWA = () => {
  // Esperar a que el service worker esté registrado
  cy.window().then(win => {
    if ('serviceWorker' in win.navigator) {
      return win.navigator.serviceWorker.ready;
    }
    return Promise.resolve();
  });

  // Esperar a que la interfaz esté completamente cargada
  cy.get('body', { timeout: 15000 }).should('be.visible');
};

// Función helper para verificar accesibilidad básica
export const checkBasicA11y = () => {
  // Verificar que los botones tengan texto o aria-label
  cy.get('button').each($btn => {
    cy.wrap($btn).should('satisfy', $el => {
      return $el.text().trim() !== '' || $el.attr('aria-label') !== undefined;
    });
  });

  // Verificar que las imágenes tengan alt text
  cy.get('img').each($img => {
    cy.wrap($img).should('have.attr', 'alt');
  });
};
