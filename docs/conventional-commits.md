# Conventional Commits - GondolApp

Esta guía establece el estándar de mensajes de commit para GondolApp siguiendo la especificación [Conventional Commits](https://www.conventionalcommits.org/).

## 📝 Formato Estándar

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Componentes

- **type**: Tipo de cambio (obligatorio)
- **scope**: Área del código afectada (opcional pero recomendado)
- **description**: Descripción breve del cambio (obligatorio)
- **body**: Descripción detallada (opcional)
- **footer**: Breaking changes o referencias a issues (opcional)

## 🏷️ Tipos de Commit

### Tipos Principales

| Tipo       | Descripción                               | Ejemplo                                                            |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `feat`     | Nueva funcionalidad                       | `feat(scanner): add barcode detection with ZXing`                  |
| `fix`      | Corrección de bug                         | `fix(sync): resolve offline queue duplicate entries`               |
| `docs`     | Documentación                             | `docs(api): add JSDoc to inventory service methods`                |
| `style`    | Formato, espacios (sin cambios de lógica) | `style(ui): fix indentation in ProductCard`                        |
| `refactor` | Refactorización                           | `refactor(services): extract prediction logic to separate service` |
| `perf`     | Mejoras de performance                    | `perf(indexeddb): optimize product queries with compound indexes`  |
| `test`     | Tests                                     | `test(inventory): add unit tests for restock calculations`         |
| `chore`    | Dependencias, configuración               | `chore(deps): update Next.js to v14.2`                             |

### Tipos Específicos para PWA

| Tipo      | Descripción            | Ejemplo                                                  |
| --------- | ---------------------- | -------------------------------------------------------- |
| `pwa`     | Configuraciones PWA    | `pwa(manifest): update theme colors and icons`           |
| `offline` | Funcionalidad offline  | `offline(sync): implement background sync for movements` |
| `mobile`  | Optimizaciones móviles | `mobile(ui): improve touch targets for small screens`    |

## 🎯 Scopes Recomendados

### Funcionalidades Core

| Scope           | Descripción                   | Ejemplos                         |
| --------------- | ----------------------------- | -------------------------------- |
| `inventory`     | Gestión de productos y stock  | productos, variantes, stock      |
| `scanner`       | Escaneo de códigos de barras  | cámara, detección, ZXing         |
| `sync`          | Sincronización offline/online | cola offline, IndexedDB, MongoDB |
| `reports`       | Reportes y análisis           | exportación, gráficos, PDF       |
| `notifications` | Sistema de alertas            | push, locales, vencimientos      |

### Componentes Técnicos

| Scope    | Descripción                | Ejemplos                          |
| -------- | -------------------------- | --------------------------------- |
| `ui`     | Componentes de interfaz    | botones, formularios, layouts     |
| `api`    | Endpoints y lógica de API  | rutas, middleware, validación     |
| `db`     | Acceso a datos y schemas   | repositories, schemas, migrations |
| `pwa`    | Configuraciones PWA        | manifest, service worker, cache   |
| `config` | Configuración del proyecto | webpack, next.config, env         |

### Testing y Herramientas

| Scope  | Descripción          | Ejemplos                      |
| ------ | -------------------- | ----------------------------- |
| `test` | Testing general      | setup, mocks, fixtures        |
| `e2e`  | Tests end-to-end     | Cypress, user flows           |
| `ci`   | Integración continua | GitHub Actions, pipeline      |
| `deps` | Dependencias         | package.json, actualizaciones |

## ✅ Ejemplos Correctos

### Nuevas Funcionalidades

```bash
feat(scanner): add barcode detection with ZXing library
feat(inventory): implement exponential smoothing prediction
feat(reports): generate PDF restock suggestions with charts
feat(notifications): add push notifications for expired products
```

### Corrección de Bugs

```bash
fix(sync): resolve offline queue duplicate entries
fix(scanner): handle camera permission denied gracefully
fix(inventory): correct stock calculation for variants
fix(api): handle malformed barcode requests properly
```

### Refactoring

```bash
refactor(services): extract prediction logic to separate service
refactor(components): split ProductForm into smaller components
refactor(db): implement Repository pattern for all entities
refactor(hooks): consolidate sync-related custom hooks
```

### Documentación

```bash
docs(api): add JSDoc to inventory service methods
docs(readme): update installation and setup instructions
docs(architecture): document offline-first data strategy
docs(testing): add component testing guidelines
```

### Performance

```bash
perf(indexeddb): optimize product queries with compound indexes
perf(components): memoize expensive calculations in ProductCard
perf(images): implement lazy loading for product photos
perf(sync): batch operations to reduce IndexedDB overhead
```

### Tests

```bash
test(inventory): add unit tests for restock calculations
test(scanner): add integration tests for barcode detection
test(sync): add offline/online state transition tests
test(e2e): add complete restock flow test
```

### Configuración

```bash
chore(deps): update Next.js to v14.2
chore(config): configure Tailwind for PWA theme
chore(ci): add E2E tests to GitHub Actions
chore(eslint): add PWA-specific linting rules
```

## 🚨 Breaking Changes

Para cambios que rompen compatibilidad, usa `BREAKING CHANGE:` en el footer:

```bash
feat(api): redesign product API with new schema

BREAKING CHANGE: Product API now returns `variants` array instead of `sizes`.
Migration guide: replace `product.sizes` with `product.variants.map(v => v.size)`
```

O usa `!` después del scope:

```bash
feat(api)!: redesign product API with new schema
```

## ❌ Ejemplos Incorrectos

```bash
# ❌ Sin tipo
"added new feature for scanner"

# ❌ Descripción no descriptiva
"fix: bug fix"

# ❌ Scope demasiado genérico
"feat(app): add stuff"

# ❌ Descripción en pasado
"feat(scanner): added barcode detection"

# ❌ Primera letra mayúscula
"feat(scanner): Add barcode detection"

# ❌ Punto al final
"feat(scanner): add barcode detection."

# ❌ Muy largo (>50 caracteres en subject)
"feat(scanner): add comprehensive barcode detection with multiple format support"
```

## 🛠️ Herramientas de Validación

### Commitlint

El proyecto usa `commitlint` para validar automáticamente los mensajes:

```bash
# Instalar commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Configurar Husky hook
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

### VS Code Extension

Recomendamos la extensión [Conventional Commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) para VS Code.

## 🎯 Mejores Prácticas

### 1. **Sé Específico en el Scope**

```bash
# ✅ Específico
feat(barcode-scanner): add QR code support
# ❌ Genérico
feat(scanner): add stuff
```

### 2. **Usa Presente Imperativo**

```bash
# ✅ Correcto
feat(inventory): add stock prediction
# ❌ Incorrecto
feat(inventory): added stock prediction
```

### 3. **Mantén el Subject ≤ 50 Caracteres**

```bash
# ✅ Conciso
feat(sync): implement background sync
# ❌ Muy largo
feat(sync): implement comprehensive background synchronization system with retry logic
```

### 4. **Usa el Body para Detalles**

```bash
feat(inventory): add exponential smoothing prediction

Implement EES algorithm for stock prediction based on historical consumption.
Uses alpha=0.3 and safety factor=1.2 optimized for supermarket inventory.

Closes #123
```

### 5. **Agrupa Commits Relacionados**

```bash
# En lugar de múltiples commits pequeños:
feat(scanner): add camera initialization
feat(scanner): add barcode detection
feat(scanner): add error handling

# Mejor un commit cohesivo:
feat(scanner): implement complete barcode scanning with camera and error handling
```

## 📋 Checklist Pre-Commit

Antes de hacer commit, verifica:

- [ ] El mensaje sigue el formato `type(scope): description`
- [ ] El tipo es uno de los permitidos
- [ ] El scope es específico y relevante
- [ ] La descripción es clara y en presente imperativo
- [ ] El subject tiene ≤ 50 caracteres
- [ ] Si hay breaking changes, están documentados
- [ ] Referencias a issues cuando corresponda

## 🔗 Referencias

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)

---

**Nota**: Esta documentación es parte de las guías de desarrollo de GondolApp. Para dudas o sugerencias, crear un issue en el repositorio.
