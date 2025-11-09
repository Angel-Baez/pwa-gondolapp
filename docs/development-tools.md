# Herramientas de Desarrollo - GondolApp

Este documento describe las herramientas de desarrollo configuradas en el proyecto GondolApp para mantener la calidad del código y consistencia.

## 🎨 Prettier - Formateo de Código

### Configuración (`.prettierrc`)

- **Punto y coma**: Siempre (`;`)
- **Comillas**: Simples para strings, dobles para JSX
- **Ancho de línea**: 80 caracteres
- **Indentación**: 2 espacios
- **Comas finales**: Solo donde sea compatible con ES5
- **Plugin**: Tailwind CSS para ordenar clases automáticamente

### Comandos disponibles:

```bash
npm run format       # Formatear todos los archivos
npm run format:check # Verificar si los archivos están formateados
```

## 🔍 ESLint - Análisis de Código

### Reglas Configuradas

#### Límites de Código (según guías del proyecto):

- **Archivos**: Máximo 500 líneas
- **Funciones**: Máximo 50 líneas (100 para componentes)
- **Complejidad ciclomática**: Máximo 10
- **Profundidad de anidación**: Máximo 4 niveles
- **Parámetros por función**: Máximo 4

#### Calidad de Código:

- `prefer-const`: Usar const cuando sea posible
- `no-var`: Prohibir var, usar let/const
- `no-unused-vars`: Advertir sobre variables no utilizadas
- `no-console`: Advertir sobre console.log

#### PWA y Accesibilidad:

- Validación de atributos ARIA
- Textos alternativos obligatorios
- Roles ARIA correctos

### Comandos disponibles:

```bash
npm run lint      # Ejecutar linting
npm run lint:fix  # Corregir automáticamente los errores
```

## 🐕 Husky - Git Hooks

### Pre-commit Hook

Ejecuta automáticamente antes de cada commit:

1. **lint-staged**: Procesa solo archivos modificados
2. **ESLint**: Corrige errores automáticamente
3. **Prettier**: Formatea el código
4. **TypeScript**: Verifica tipos (sin emitir archivos)

### Configuración

- Hook configurado en `.husky/pre-commit`
- Se inicializa automáticamente con `npm run prepare`

## 🚀 lint-staged - Procesamiento Selectivo

### Archivos TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`):

1. ESLint con corrección automática
2. Prettier para formateo
3. Verificación de tipos TypeScript

### Otros archivos (`.json`, `.css`, `.md`, `.html`):

1. Solo formateo con Prettier

## 📝 Scripts de package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "pre-commit": "lint-staged",
    "prepare": "husky"
  }
}
```

## 🔧 Configuración VS Code

### Extensiones Recomendadas (`.vscode/extensions.json`):

- **esbenp.prettier-vscode**: Formateo automático
- **dbaeumer.vscode-eslint**: Linting en tiempo real
- **bradlc.vscode-tailwindcss**: IntelliSense para Tailwind
- **ms-vscode.vscode-typescript-next**: Soporte TypeScript avanzado

### Configuración del Workspace (`.vscode/settings.json`):

- **Formateo automático al guardar**
- **Corrección de ESLint automática**
- **Organización de imports**
- **Soporte para Tailwind CSS**
- **Configuración específica por tipo de archivo**

## 🚨 Archivos Ignorados

### `.prettierignore` y `.eslintignore`:

- Dependencias (`node_modules/`)
- Builds de producción (`.next/`, `out/`, `dist/`)
- Archivos de cache
- Archivos generados automáticamente
- Service Workers
- Archivos de configuración que no necesitan linting

## 🎯 Flujo de Trabajo Recomendado

1. **Desarrollo**: Código con formato automático en VS Code
2. **Antes del commit**:
   - Los hooks ejecutan automáticamente linting y formateo
   - Solo se procesan archivos modificados (lint-staged)
   - Si hay errores, el commit se bloquea
3. **Revisión**: Código consistente y sin errores básicos

## 🛠️ Comandos de Mantenimiento

```bash
# Verificar configuración completa
npm run type-check && npm run lint && npm run format:check

# Limpiar y reformatear todo el proyecto
npm run format && npm run lint:fix

# Instalar hooks de git (solo una vez)
npm run prepare
```

## 📋 Checklist de Calidad

Antes de hacer commit, asegúrate de que:

- [ ] No hay errores de TypeScript (`npm run type-check`)
- [ ] No hay errores de ESLint (`npm run lint`)
- [ ] El código está formateado (`npm run format:check`)
- [ ] Las funciones no exceden 50 líneas
- [ ] Los archivos no exceden 500 líneas
- [ ] No hay `console.log` olvidados
- [ ] Se usa `const` en lugar de `let` cuando es posible

---

_Esta configuración está optimizada para el desarrollo de GondolApp, siguiendo las mejores prácticas para PWAs mobile-first y desarrollo en equipo._
