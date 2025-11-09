/// <reference types="cypress" />

// Helper functions to reduce nesting
const checkPageLoad = () => {
  cy.get('h1').should('contain.text', 'GondolApp');
  cy.get('p').should('contain.text', 'Gestión de inventario offline-first');
};

const testViewport = (width: number, height: number) => {
  cy.viewport(width, height);
  cy.get('h1').should('be.visible');
  cy.get('p').should('be.visible');
};

const checkPWAMetadata = () => {
  cy.get('head link[rel="manifest"]').should('exist');
  cy.get('head meta[name="mobile-web-app-capable"]').should(
    'have.attr',
    'content',
    'yes'
  );
  cy.get('head meta[name="apple-mobile-web-app-capable"]').should(
    'have.attr',
    'content',
    'yes'
  );
};

const validateManifest = () => {
  cy.request('/manifest.json').its('status').should('eq', 200);
  cy.request('/manifest.json').its('body').should('have.property', 'name');
  cy.request('/manifest.json')
    .its('body')
    .should('have.property', 'short_name');
  cy.request('/manifest.json').its('body').should('have.property', 'icons');
};

const simulateOfflineOnline = () => {
  cy.window()
    .its('dispatchEvent')
    .then(dispatch => {
      dispatch(new Event('offline'));
    });
  cy.get('h1').should('be.visible');

  cy.window()
    .its('dispatchEvent')
    .then(dispatch => {
      dispatch(new Event('online'));
    });
  cy.get('h1').should('be.visible');
};

describe('GondolApp PWA - Basic Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should load the main page successfully', () => {
    checkPageLoad();
  });

  it('should be responsive and mobile-friendly', () => {
    const viewports: [number, number][] = [
      [390, 844], // iPhone 12 Pro
      [375, 667], // iPhone SE
      [768, 1024], // iPad
    ];

    viewports.forEach(([width, height]) => {
      testViewport(width, height);
    });
  });

  it('should have proper PWA metadata', () => {
    checkPWAMetadata();
    validateManifest();
  });

  it('should handle offline state gracefully', () => {
    simulateOfflineOnline();
  });

  it('should have basic accessibility features', () => {
    cy.get('body').focus().type('{tab}');

    // Check interactive elements have proper labels
    cy.get('button, a').each($el => {
      cy.wrap($el).should('satisfy', $btn => {
        return (
          $btn.text().trim() !== '' || $btn.attr('aria-label') !== undefined
        );
      });
    });

    // Check images have alt text
    cy.get('img').should('have.attr', 'alt');
  });
});
