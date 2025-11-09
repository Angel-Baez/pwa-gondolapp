# 📋 Pull Request - GondolApp

## 🎯 Descripción

<!-- Breve descripción de los cambios implementados y por qué son necesarios -->

**Resumen:**

- **Motivación:**

-

## 🔄 Tipo de Cambio

- [ ] 🚀 **Nueva funcionalidad** (`feat`) - Agrega nueva funcionalidad
- [ ] 🐛 **Corrección de bug** (`fix`) - Corrige un problema existente
- [ ] 💥 **Breaking change** - Cambio que rompe funcionalidad existente
- [ ] 📚 **Documentación** (`docs`) - Solo cambios en documentación
- [ ] 🎨 **Refactoring** (`refactor`) - Cambios de código sin afectar funcionalidad
- [ ] ⚡ **Performance** (`perf`) - Mejoras de rendimiento
- [ ] 🧪 **Tests** (`test`) - Agregar o corregir tests
- [ ] 🔧 **Configuración** (`chore`) - Dependencias, build tools, etc.
- [ ] 📱 **PWA/Mobile** - Mejoras específicas para PWA o móvil

## ✅ Checklist de Calidad Obligatorio

### 🔧 Código

- [ ] **Convenciones de nomenclatura**: PascalCase, camelCase, SCREAMING_SNAKE_CASE
- [ ] **Self-review completo**: He revisado cada línea de mi código
- [ ] **Comentarios JSDoc**: Funciones públicas documentadas
- [ ] **Sin console.log**: No hay logs de debug olvidados
- [ ] **Límites de código**: Funciones ≤ 50 líneas, archivos ≤ 500 líneas
- [ ] **DRY principle**: No hay duplicación innecesaria de código

### 🏗️ Arquitectura PWA (CRÍTICO)

- [ ] **✅ Funciona offline**: Probado desconectando WiFi/datos
- [ ] **Estrategia de datos**: Respeta las 3 capas (Catalog/Lists/History)
- [ ] **Repository pattern**: Acceso a datos solo por repositories
- [ ] **Service layer**: Lógica de negocio en services, no en componentes
- [ ] **Transacciones atómicas**: IndexedDB operations en transacciones
- [ ] **Error handling**: Manejo graceful de fallos de red/DB

### 📱 Mobile-First (CRÍTICO)

- [ ] **Touch targets**: Elementos interactivos ≥ 44×44px
- [ ] **One-handed use**: Funciona con pulgar de una mano
- [ ] **Haptic feedback**: Vibraciones en acciones confirmables solamente
- [ ] **Performance móvil**: Probado en DevTools con throttling
- [ ] **Battery optimization**: Sin loops infinitos o listeners sin cleanup

### 🧪 Testing

- [ ] **Tests unitarios**: Agregados para nueva lógica de negocio
- [ ] **Cobertura ≥ 80%**: Para archivos modificados
- [ ] **Tests de componentes**: Si hay cambios en UI
- [ ] **Tests pasan localmente**: `npm run test` exitoso
- [ ] **Edge cases**: Casos límite considerados y probados

### 📖 Documentación

- [ ] **JSDoc actualizado**: Para funciones públicas nuevas/modificadas
- [ ] **README actualizado**: Si cambió funcionalidad principal
- [ ] **Arquitectura documentada**: Decisiones importantes explicadas
- [ ] **Migration guide**: Para breaking changes

## 🧪 Testing Realizado

### Manual Testing

- [ ] **Desktop**: Probado en Chrome/Firefox/Safari
- [ ] **Mobile**: Probado en dispositivo real o DevTools mobile
- [ ] **Offline**: Funcionalidad probada sin conexión
- [ ] **Online sync**: Sincronización probada al reconectar
- [ ] **Edge cases**: Casos límite y errores manejados

### Automated Testing

- [ ] **Unit tests**: `npm run test` - ✅ Passing
- [ ] **E2E tests**: `npm run test:e2e` - ✅ Passing
- [ ] **Type check**: `npm run type-check` - ✅ Passing
- [ ] **Linting**: `npm run lint` - ✅ Passing
- [ ] **Build**: `npm run build` - ✅ Passing

## 📱 Screenshots/Videos

<!--
OBLIGATORIO para cambios de UI
Incluir capturas de pantalla o videos, especialmente para móvil
Usar formato: ![Descripción](url) o arrastra archivos aquí
-->

### Desktop

<!-- Screenshots de desktop si aplica -->

### Mobile

<!-- Screenshots de móvil OBLIGATORIO para cambios de UI -->

### Offline Functionality

<!-- Demo de funcionalidad offline si aplica -->

## 🔗 Issues Relacionados

<!-- Usar palabras clave para cierre automático -->

- Fixes #(número_de_issue)
- Closes #(número_de_issue)
- Related to #(número_de_issue)

## 🚨 Breaking Changes

<!-- Si hay breaking changes, describir QUÉ se rompe y CÓMO migrar -->

**¿Hay breaking changes?**

- [ ] No
- [ ] Sí - Descripción abajo

<!-- Si marcaste "Sí", completa: -->

### Cambios que rompen compatibilidad:

-

### Guía de migración:

-

### Versión afectada:

- Desde versión:
- Nueva versión:

## 📝 Notas para Reviewers

### ⚠️ Áreas que necesitan atención especial:

-

### 🤔 Decisiones de diseño tomadas:

-

### ⚖️ Trade-offs considerados:

-

### 🔄 TODOs para futuras iteraciones:

-

## ✅ CI/CD Pipeline Status

<!-- Este checklist se completa automáticamente por GitHub Actions -->

Una vez creado el PR, verifica que todos los checks pasen:

- [ ] 🧪 **Tests y Calidad**: TypeScript, ESLint, Prettier, Tests, Build
- [ ] 🔒 **Seguridad**: Auditoría de dependencias y análisis Snyk
- [ ] 🚀 **Preview Deploy**: URL de preview generada automáticamente
- [ ] 👀 **Code Review**: Aprobación de al menos un reviewer

### 🔍 Debug CI/CD

Si algún check falla, ejecuta localmente:

```bash
# Verificar todo localmente
npm run type-check    # Errores de TypeScript
npm run lint         # Errores de ESLint
npm run format:check # Errores de formato
npm run test:run     # Tests que fallan
npm run build        # Errores de build

# Corregir automáticamente donde sea posible
npm run lint:fix     # Corregir ESLint automáticamente
npm run format       # Formatear código automáticamente
```

---

## 👥 Para Reviewers

### 🎯 Puntos críticos a validar:

#### Funcionalidad Core

- [ ] **Offline-first**: ¿Funciona completamente sin internet?
- [ ] **Data consistency**: ¿Las transacciones son atómicas?
- [ ] **Error handling**: ¿Fallos de red/DB se manejan gracefully?

#### Mobile UX

- [ ] **One-handed use**: ¿Es usable con una sola mano?
- [ ] **Touch targets**: ¿Elementos ≥ 44×44px?
- [ ] **Performance**: ¿No se degrada en móvil?

#### Architecture

- [ ] **Repository pattern**: ¿Se respeta la separación de concerns?
- [ ] **Service layer**: ¿Lógica de negocio está en services?
- [ ] **Component purity**: ¿Componentes solo manejan UI?

#### Code Quality

- [ ] **SOLID principles**: ¿Se respetan los principios SOLID?
- [ ] **DRY**: ¿No hay duplicación innecesaria?
- [ ] **KISS**: ¿Solución simple y clara?
- [ ] **Function/file size**: ¿Respeta límites de líneas?

#### Testing

- [ ] **Unit tests**: ¿Cobertura adecuada para nueva lógica?
- [ ] **Integration tests**: ¿APIs críticas probadas?
- [ ] **E2E tests**: ¿Flujos principales funcionan?

### 📋 Checklist de Review

- [ ] **Funcionalidad**: Los cambios cumplen los requisitos
- [ ] **Arquitectura**: Respeta patrones establecidos del proyecto
- [ ] **Performance**: Sin degradación significativa
- [ ] **Security**: No introduce vulnerabilidades
- [ ] **Tests**: Cobertura adecuada y tests pasando
- [ ] **Documentation**: Cambios documentados apropiadamente
- [ ] **Mobile**: Optimizado para uso móvil
- [ ] **Offline**: Funciona sin conexión a internet
- [ ] **CI/CD**: Todos los checks automáticos pasan

### ⏱️ SLA de Review

- **Hotfixes críticos**: 2 horas
- **Features pequeñas**: 24 horas
- **Features grandes**: 48 horas
- **Refactoring**: 72 horas

---

### 📊 Métricas de Calidad

Este PR será evaluado en:

- **Code Coverage**: Mínimo 70% (objetivo 80%)
- **Performance**: Lighthouse score ≥ 90 en móvil
- **Accessibility**: WCAG AA compliance
- **Bundle Size**: Sin incremento significativo
- **E2E Success Rate**: ≥ 95%

---

**¿Primera vez contribuyendo?** Lee nuestras [guías de desarrollo](.copilot/development-guidelines.md) y [convenciones de commit](docs/conventional-commits.md).
