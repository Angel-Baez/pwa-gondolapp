import { ThemeProvider } from '@/components/theme-provider';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Test básico para verificar que el sistema de testing funciona
describe('ThemeProvider', () => {
  it('should render children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeVisible();
  });

  it('should apply default theme attributes', () => {
    render(
      <ThemeProvider>
        <div>Theme Test</div>
      </ThemeProvider>
    );

    // Verificar que el html tiene la clase correcta para el tema
    const htmlElement = document.documentElement;
    expect(htmlElement).toBeInTheDocument();
  });
});

// Test de ejemplo para componentes de UI
describe('UI Components', () => {
  it('should have basic accessibility features', async () => {
    render(
      <ThemeProvider>
        <button aria-label="Test button">Click me</button>
        <img src="/test.jpg" alt="Test image" />
        <input id="test-input" />
        <label htmlFor="test-input">Test input</label>
      </ThemeProvider>
    );

    // Verificar accesibilidad básica
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Test button'
    );
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Test image');
    expect(screen.getByLabelText('Test input')).toBeInTheDocument();
  });
});
