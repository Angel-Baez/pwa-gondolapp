# Guías de Code Review - GondolApp

## 🎯 Objetivo

Asegurar que todo el código que llega a las ramas principales (`main` y `develop`) mantiene los estándares de calidad, arquitectura y funcionalidad offline-first de GondolApp.

## 📋 Checklist de Review Obligatorio

### ✅ Funcionalidad Core

#### Offline-First (CRÍTICO)

- [ ] **Funciona completamente offline**: Probado desconectando internet
- [ ] **Sincronización**: Datos se sincronizan correctamente al reconectar
- [ ] **Transacciones atómicas**: Operaciones IndexedDB en transacciones
- [ ] **Error handling**: Fallos de red manejados gracefully
- [ ] **Fallback strategies**: Alternativas cuando APIs no están disponibles

#### Data Strategy

- [ ] **3-Tier architecture**: Respeta Catalog/Lists/History pattern
- [ ] **Repository pattern**: Acceso a datos solo por repositories
- [ ] **Service layer**: Lógica de negocio en services, no componentes
- [ ] **Data consistency**: Sin estados inconsistentes entre capas

### 📱 Mobile-First (CRÍTICO)

#### UX Móvil

- [ ] **Touch targets**: Elementos interactivos ≥ 44×44px
- [ ] **One-handed use**: Usable con pulgar de una mano
- [ ] **Haptic feedback**: Solo en acciones confirmables
- [ ] **Performance**: Probado con throttling de CPU/red
- [ ] **Battery optimization**: Sin procesos que drenen batería

#### Responsive Design

- [ ] **Mobile-first CSS**: Media queries desde mobile hacia desktop
- [ ] **Touch gestures**: Swipe, tap, long press implementados correctamente
- [ ] **Keyboard mobile**: Tipos correctos (numeric, email, etc.)
- [ ] **Viewport**: Meta viewport configurado correctamente

### 🏗️ Arquitectura

#### SOLID Principles

- [ ] **Single Responsibility**: Cada función/clase tiene una responsabilidad
- [ ] **Open/Closed**: Extensible sin modificar código existente
- [ ] **Liskov Substitution**: Implementaciones intercambiables
- [ ] **Interface Segregation**: Interfaces específicas, no genéricas
- [ ] **Dependency Inversion**: Depende de abstracciones, no implementaciones

#### Code Quality

- [ ] **DRY**: Sin duplicación innecesaria de código
- [ ] **KISS**: Solución simple y clara
- [ ] **YAGNI**: No implementa funcionalidad innecesaria
- [ ] **Function size**: ≤ 50 líneas por función
- [ ] **File size**: ≤ 500 líneas por archivo
- [ ] **Complexity**: Complejidad ciclomática ≤ 10

### 🧪 Testing

#### Coverage

- [ ] **Unit tests**: ≥ 80% cobertura para nueva lógica
- [ ] **Integration tests**: APIs críticas probadas
- [ ] **Component tests**: UI components con RTL
- [ ] **E2E tests**: Flujos críticos cubiertos

#### Quality

- [ ] **Edge cases**: Casos límite considerados
- [ ] **Error scenarios**: Fallos simulados y manejados
- [ ] **Mocks appropriados**: Mocks realistas, no over-mocking
- [ ] **Test isolation**: Tests independientes entre sí

### 📖 Documentación

#### Code Documentation

- [ ] **JSDoc**: Funciones públicas documentadas
- [ ] **Complex logic**: Algoritmos complejos explicados
- [ ] **Business rules**: Reglas de negocio documentadas
- [ ] **API changes**: Cambios en APIs documentados

#### Architecture Documentation

- [ ] **Design decisions**: Decisiones importantes explicadas
- [ ] **Trade-offs**: Compromisos documentados
- [ ] **Migration guides**: Para breaking changes
- [ ] **README updates**: Funcionalidad nueva documentada

## 🚦 Proceso de Review

### 1. **Review Automático** (GitHub Actions)

- TypeScript compilation
- ESLint rules
- Prettier formatting
- Unit tests execution
- Build success

### 2. **Review Manual** (Human)

#### Orden de Review

1. **Descripción del PR**: ¿Es clara la motivación y scope?
2. **Arquitectura**: ¿Respeta patrones establecidos?
3. **Mobile/Offline**: ¿Funciona en escenarios críticos?
4. **Code quality**: ¿Legible, mantenible, testeable?
5. **Performance**: ¿Sin degradación significativa?
6. **Security**: ¿Sin vulnerabilidades introducidas?

#### Comentarios Constructivos

✅ **Buen comentario:**

```
🔧 Arquitectura: Esta función tiene 3 responsabilidades (validación, cálculo, persistencia).
Considera extraer cada una a funciones separadas para mejorar testabilidad y cumplir SRP.

📱 Mobile: El botón tiene 32px de altura. Necesita mínimo 44px para ser accesible en touch.

⚡ Performance: Este useEffect se ejecuta en cada render. Considera usar useMemo para el cálculo costoso.
```

❌ **Mal comentario:**

```
"Esto está mal"
"Cambia esto"
"No me gusta este approach"
```

### 3. **Testing por Reviewer**

#### Manual Testing Obligatorio

- [ ] **Pull del branch**: `git checkout <branch> && npm install`
- [ ] **Build local**: `npm run build` exitoso
- [ ] **Tests locales**: `npm run test` exitoso
- [ ] **Funcionalidad**: Probar feature manualmente
- [ ] **Offline mode**: Desconectar internet y probar
- [ ] **Mobile responsive**: DevTools mobile viewport

#### Automated Testing

- [ ] **CI status**: Todos los checks verdes
- [ ] **Coverage**: No degradación significativa
- [ ] **Performance**: Bundle size sin incremento mayor

## ⏱️ SLA de Review

| Tipo de PR          | Tiempo de Response | Reviewers Requeridos |
| ------------------- | ------------------ | -------------------- |
| **Hotfix crítico**  | 2 horas            | 1 senior             |
| **Feature pequeña** | 24 horas           | 1 cualquiera         |
| **Feature grande**  | 48 horas           | 2 (1 senior)         |
| **Refactoring**     | 72 horas           | 1 senior             |
| **Breaking change** | 48 horas           | 2 seniors            |

## 🎯 Criterios de Aprobación

### ✅ Approval Requirements

#### Must Have (Bloquean merge)

- [ ] **Funciona offline**: Verificado manualmente
- [ ] **Mobile responsive**: Probado en mobile viewport
- [ ] **Tests pass**: CI verde, cobertura ≥ 70%
- [ ] **Build success**: `npm run build` exitoso
- [ ] **No breaking changes**: Sin romper funcionalidad existente
- [ ] **Architecture compliance**: Respeta Repository + Service pattern

#### Should Have (Recomendaciones fuertes)

- [ ] **Performance**: Sin degradación significativa
- [ ] **Accessibility**: WCAG AA compliance
- [ ] **Documentation**: Cambios documentados
- [ ] **Code quality**: Respeta límites de líneas y complejidad

#### Nice to Have (Sugerencias)

- [ ] **Code optimization**: Posibles mejoras de performance
- [ ] **UX improvements**: Sugerencias de experiencia de usuario
- [ ] **Future considerations**: Preparación para features futuras

## 🔄 Workflow de Feedback

### Para el Author

1. **Address feedback**: Responder a todos los comentarios
2. **Request re-review**: Marcar como "Ready for review" después de cambios
3. **Resolve conversations**: Marcar como resueltos los comentarios addressados
4. **Update description**: Si el scope cambió significativamente

### Para el Reviewer

1. **Acknowledge fixes**: Resolver conversations cuando cambios son adecuados
2. **Re-review quickly**: Priorizar re-reviews sobre nuevos PRs
3. **Approve explicitly**: Click "Approve" cuando esté listo para merge
4. **Final check**: Último vistazo antes del merge

## 📊 Métricas de Quality Gate

### Umbrales Automáticos

- **Code Coverage**: ≥ 70% (objetivo 80%)
- **Bundle Size**: Incremento ≤ 5%
- **Build Time**: ≤ 2 minutos
- **Lighthouse Score**: ≥ 90 (móvil)
- **ESLint**: 0 errors, warnings permitidos

### Umbrales Manuales

- **Complexity**: Complejidad ciclomática ≤ 10
- **Function Size**: ≤ 50 líneas
- **File Size**: ≤ 500 líneas
- **Dependencies**: Solo si son absolutamente necesarias

## 🚫 Red Flags (Bloquean Merge Inmediato)

### Arquitectura

- ❌ **Direct DB access** en componentes React
- ❌ **Business logic** en components (debe estar en services)
- ❌ **No error handling** para operaciones asíncronas
- ❌ **Broken offline functionality**
- ❌ **Memory leaks** (listeners sin cleanup)

### Code Quality

- ❌ **Functions > 100 líneas**
- ❌ **Files > 1000 líneas**
- ❌ **Complexity > 20**
- ❌ **console.log** en código de producción
- ❌ **Hardcoded values** que deberían ser constantes

### Security

- ❌ **Sensitive data** en logs o client-side
- ❌ **XSS vulnerabilities**
- ❌ **Dependency vulnerabilities** high/critical
- ❌ **Unvalidated inputs**

### Performance

- ❌ **Bundle size** incremento > 20%
- ❌ **Memory leaks** detectados
- ❌ **Infinite re-renders**
- ❌ **Expensive operations** en render path

## 📚 Recursos para Reviewers

### Herramientas

- **GitHub CLI**: `gh pr checkout <number>` para testing local
- **Lighthouse**: Audit de performance y PWA
- **Chrome DevTools**: Mobile debugging, network throttling
- **Vitest UI**: `npm run test:ui` para debugging tests

### Referencias

- [GondolApp Architecture Guidelines](.copilot/development-guidelines.md)
- [Repository Pattern](.copilot/repository-pattern.md)
- [Service Layer](.copilot/service-layer.md)
- [React Component Guidelines](.copilot/react-component.md)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

## 🎓 Formación para Reviewers

### Nuevos Reviewers

1. **Shadowing**: Observar reviews de seniors durante 1 semana
2. **Pair reviewing**: Hacer reviews en pair con senior durante 2 semanas
3. **Solo reviews**: Empezar con PRs små, senior como backup
4. **Certification**: Después de 20 reviews exitosos

### Skills Requeridos

- **TypeScript**: Nivel intermedio-avanzado
- **React patterns**: Hooks, Context, Performance optimization
- **PWA concepts**: Service workers, offline-first, sync strategies
- **Mobile UX**: Touch interactions, responsive design
- **Testing**: Unit, integration, E2E testing strategies

## 📈 Métricas de Review

### KPIs a Trackear

- **Review turnaround time**: Tiempo desde PR hasta primera review
- **Merge time**: Tiempo desde PR hasta merge
- **Defect rate**: Bugs encontrados post-merge
- **Review depth**: Número de comentarios por PR
- **Approval rate**: % de PRs aprobados en primera review

### Reportes Mensuales

- Review velocity por reviewer
- Areas más comentadas (arquitectura, tests, etc.)
- Tipos de issues más comunes
- Tiempo promedio de review por tipo de PR

---

**Recuerda**: El objetivo del code review es mantener la calidad del código y ayudar al growth del equipo. Sé constructivo, específico y educativo en tus comentarios.
