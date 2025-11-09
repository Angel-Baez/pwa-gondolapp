# CI/CD Pipeline - GondolApp

Este documento describe la configuración del pipeline de CI/CD para GondolApp, diseñado para mantener la calidad del código y asegurar que la aplicación PWA funcione correctamente en producción.

## Arquitectura del Pipeline

El pipeline se ejecuta en **4 jobs principales** que validan diferentes aspectos de la aplicación:

### 1. 🧪 **Test y Calidad de Código** (`test`)

- **Verificación de tipos TypeScript**: `npm run type-check`
- **Linting**: `npm run lint` (ESLint con reglas estrictas)
- **Formato**: `npm run format:check` (Prettier)
- **Tests unitarios**: `npm run test:run` (Vitest)
- **Cobertura**: `npm run test:coverage` (mínimo 70%)
- **Build**: `npm run build` (Next.js en modo producción)

### 2. 🎭 **Tests End-to-End** (`e2e`)

- **Cuándo se ejecuta**: Solo en push a `main` o `develop`
- **Herramienta**: Cypress con navegador headless
- **Casos**: Navegación básica, funcionalidad offline, PWA
- **Artefactos**: Screenshots/videos automáticos en fallos

### 3. 🔒 **Análisis de Seguridad** (`security`)

- **npm audit**: Vulnerabilidades en dependencias
- **Snyk**: Análisis profundo de seguridad (opcional)
- **Threshold**: Solo vulnerabilidades de severidad alta fallan el pipeline

### 4. 🚀 **Deploy Preview** (`deploy-preview`)

- **Cuándo**: Solo en Pull Requests
- **Plataforma**: Vercel con comentario automático
- **URL**: Preview único por PR para testing manual

## Triggers del Pipeline

```yaml
on:
  push:
    branches: [main, develop] # CI completo
  pull_request:
    branches: [main, develop] # CI + Preview deploy
```

## Configuración de Secrets

Ve a **Settings > Secrets and variables > Actions** en GitHub y configura:

### 🔐 Secrets Requeridos

| Secret          | Descripción               | Requerido         |
| --------------- | ------------------------- | ----------------- |
| `VERCEL_TOKEN`  | Token de API de Vercel    | ✅ (para deploys) |
| `ORG_ID`        | ID de organización Vercel | ✅ (para deploys) |
| `PROJECT_ID`    | ID del proyecto Vercel    | ✅ (para deploys) |
| `VERCEL_ORG_ID` | ID de org Vercel (backup) | ✅ (para deploys) |
| `SNYK_TOKEN`    | Token de Snyk             | ⚪ (opcional)     |

### 🔧 Cómo obtener los tokens:

#### Vercel Tokens:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings > Tokens** → Crear nuevo token
3. **Project Settings** → Copiar Project ID
4. **Team Settings** → Copiar Team/Org ID

#### Snyk Token (opcional):

1. Regístrate en [Snyk](https://snyk.io)
2. **Account Settings > API Token**

## Optimizaciones de Performance

### ⚡ Cache Inteligente

- **Node modules**: Cache automático por `package-lock.json`
- **Build artifacts**: Reutilización entre jobs
- **Cypress binaries**: Cache persistente

### 🎯 Ejecución Selectiva

- **E2E tests**: Solo en ramas principales (ahorra ~5min por PR)
- **Security scan**: Paralelo, no bloquea tests principales
- **Preview deploy**: Solo en PRs activos

### 📊 Reportes Optimizados

- **Cobertura**: Solo sube diff, no archivos completos
- **Artifacts**: Retención de 7 días (balance storage/debug)
- **Logs**: Agrupados por contexto para fácil debug

## Scripts del Package.json

El pipeline utiliza estos scripts (ya configurados):

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "next lint",
    "format:check": "prettier --check .",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage",
    "build": "next build",
    "start": "next start",
    "cypress:run": "cypress run"
  }
}
```

## Flujo de Trabajo Típico

### 📝 **En Pull Request**:

1. ✅ Tests + Calidad + Security
2. 🚀 Deploy preview automático
3. 💬 Comentario con URL preview
4. 👀 Review manual + tests automáticos

### 🔄 **En Push a develop**:

1. ✅ Pipeline completo (incluyendo E2E)
2. 📊 Reporte de cobertura
3. 🔍 Análisis de seguridad
4. ✨ Listo para merge a main

### 🚀 **En Push a main**:

1. ✅ Validación completa
2. 🎭 Tests E2E en ambiente real
3. 🔒 Audit de seguridad final
4. 📦 Build para producción

## Solución de Problemas

### ❌ **Test Failures**

```bash
# Ejecutar localmente los mismos comandos del CI
npm run type-check
npm run lint
npm run test:run
npm run build
```

### 🔍 **Debug E2E**

- Artefactos disponibles por 7 días
- Screenshots automáticos en fallos
- Videos completos de ejecución

### 🚨 **Security Issues**

- `npm audit fix` para vulnerabilidades automáticas
- Review manual para vulnerabilidades críticas
- Update dependencias con versiones seguras

## Métricas de Performance

### ⏱️ **Tiempos Objetivo**:

- **PR básico**: ~3-4 minutos
- **Push develop**: ~6-8 minutos
- **Push main**: ~8-10 minutos

### 📈 **Indicadores de Calidad**:

- **Test coverage**: Mínimo 70%
- **Build time**: Máximo 2 minutos
- **E2E success rate**: >95%

---

## Próximos Pasos

1. **Instalar dependencia wait-on**: `npm install --save-dev wait-on`
2. **Configurar secrets** en GitHub repository settings
3. **Crear primera PR** para probar el pipeline
4. **Ajustar thresholds** según necesidades del proyecto

Este pipeline está diseñado específicamente para las necesidades de **GondolApp** como PWA offline-first, priorizando la estabilidad y performance en dispositivos móviles.
