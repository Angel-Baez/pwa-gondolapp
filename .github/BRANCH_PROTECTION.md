# Configuración de Protección de Ramas para GitHub

## Protección de la rama `main`

Para configurar la protección de la rama principal una vez que subas el repositorio a GitHub:

### 1. Ir a Settings > Branches en el repositorio de GitHub

### 2. Agregar regla de protección para `main`:

```yaml
Configuración recomendada:
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1 (mínimo)
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (si tienes CODEOWNERS)

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Checks requeridos (cuando tengas CI):
    - ✅ test (unit tests)
    - ✅ build (successful build)
    - ✅ lint (code quality)
    - ✅ type-check (TypeScript validation)

- ✅ Require conversation resolution before merging

- ✅ Restrict pushes that create files over 100MB

- ✅ Do not allow bypassing the above settings
  - ⚠️  Solo administradores pueden hacer bypass en emergencias

- ❌ Allow force pushes (nunca en main)
- ❌ Allow deletions (nunca en main)
```

### 3. Configuración de la rama `develop`:

```yaml
Configuración más flexible para develop:
- ✅ Require a pull request before merging
  - Require approvals: 0 (para desarrollo ágil)
  - ✅ Dismiss stale PR approvals when new commits are pushed

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Mismo conjunto de checks que main

- ✅ Allow force pushes (solo para maintainers)
- ❌ Allow deletions
```

## Comandos Git Flow Recomendados

### Crear nueva feature:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo
```

### Finalizar feature:

```bash
git checkout develop
git pull origin develop
git merge feature/nombre-descriptivo
git push origin develop
git branch -d feature/nombre-descriptivo
```

### Crear hotfix crítico:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-bug
# ... hacer cambios ...
git checkout main
git merge hotfix/descripcion-bug
git checkout develop
git merge hotfix/descripcion-bug
git push origin main develop
git branch -d hotfix/descripcion-bug
```

### Release (main ← develop):

```bash
git checkout main
git pull origin main
git merge develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags
```

## Convenciones de Commit

Usar siempre **Conventional Commits** con los siguientes tipos:

- `feat(scope): descripción` - Nueva funcionalidad
- `fix(scope): descripción` - Corrección de bug
- `docs(scope): descripción` - Cambios en documentación
- `style(scope): descripción` - Formato, espacios (no cambios de código)
- `refactor(scope): descripción` - Refactorización de código
- `perf(scope): descripción` - Mejoras de performance
- `test(scope): descripción` - Agregar o corregir tests
- `chore(scope): descripción` - Dependencias, build tools, etc

### Scopes para GondolApp:

- `inventory` - Gestión de productos y stock
- `scanner` - Escaneo de códigos de barras
- `sync` - Sincronización offline/online
- `reports` - Reportes y análisis
- `notifications` - Sistema de alertas
- `ui` - Componentes de interfaz
- `api` - Endpoints y lógica de API
- `db` - Acceso a datos y schemas
- `pwa` - Configuraciones PWA
- `config` - Archivos de configuración
