# Setup de Conventional Commits y PR Templates - GondolApp

Este documento describe cómo configurar y usar el sistema de Conventional Commits y PR templates implementado en GondolApp.

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog
```

### 2. Configurar Husky (ya configurado)

Los hooks están configurados en `.husky/`:

- `commit-msg`: Valida mensajes de commit con commitlint
- `pre-commit`: Ejecuta lint-staged y type-check

### 3. Verificar Configuración

```bash
# Test commitlint
npx commitlint --from HEAD~1 --to HEAD --verbose

# Test pre-commit hook
npm run pre-commit
```

## 📝 Uso Diario

### Hacer Commits con Commitizen

En lugar de `git commit`, usa:

```bash
npm run commit
```

Esto abrirá un asistente interactivo que te guiará para crear commits que cumplan con Conventional Commits:

1. **Selecciona el tipo**: feat, fix, docs, etc.
2. **Especifica el scope**: inventory, scanner, sync, etc.
3. **Escribe la descripción**: Breve descripción del cambio
4. **Agrega body (opcional)**: Descripción detallada
5. **Menciona breaking changes**: Si los hay
6. **Referencias a issues**: Si aplica

### Ejemplo de Flujo

```bash
# Hacer cambios
git add .

# Commit con asistente
npm run commit

# El asistente te preguntará:
? Select the type of change that you're committing: feat
? What is the scope of this change: scanner
? Write a short, imperative tense description: add barcode detection with ZXing
? Provide a longer description: (opcional)
? Are there any breaking changes? No
? Does this change affect any open issues? #123

# Resultado: feat(scanner): add barcode detection with ZXing

# Push
git push
```

### Commits Manuales (Avanzado)

Si prefieres escribir commits manualmente, asegúrate de seguir el formato:

```bash
git commit -m "feat(inventory): add stock prediction algorithm"
git commit -m "fix(sync): resolve offline queue duplicate entries"
git commit -m "docs(api): add JSDoc to inventory service methods"
```

## 🎯 Scopes Específicos de GondolApp

### Core Features

- `inventory` - Gestión de productos y stock
- `scanner` - Escaneo de códigos de barras
- `sync` - Sincronización offline/online
- `reports` - Reportes y análisis
- `notifications` - Sistema de alertas

### Technical Components

- `ui` - Componentes de interfaz
- `api` - Endpoints y lógica de API
- `db` - Acceso a datos y schemas
- `pwa` - Configuraciones PWA
- `config` - Configuración del proyecto

### Testing & Tools

- `test` - Testing general
- `e2e` - Tests end-to-end
- `ci` - Integración continua
- `deps` - Dependencias

## 📋 Pull Request Template Usage

### Crear un PR

1. **Push tu branch**: `git push -u origin feature/nueva-feature`
2. **Crear PR en GitHub**: El template se cargará automáticamente
3. **Completar checklist**: Marca todos los items relevantes
4. **Agregar screenshots**: OBLIGATORIO para cambios de UI
5. **Describir testing**: Manual y automatizado realizado

### Checklist Crítico

**SIEMPRE verificar antes de crear PR:**

#### Arquitectura PWA ✅

- [ ] Funciona offline (desconectar WiFi y probar)
- [ ] Respeta 3-tier data strategy
- [ ] Usa Repository pattern
- [ ] Lógica en services, no components

#### Mobile-First ✅

- [ ] Touch targets ≥ 44×44px
- [ ] Usable con una mano
- [ ] Probado en DevTools mobile

#### Code Quality ✅

- [ ] Tests unitarios agregados
- [ ] `npm run test` pasa
- [ ] `npm run build` pasa
- [ ] Sin console.log olvidados

## 🔧 Troubleshooting

### Commitlint Falla

```bash
# Ver qué está mal
npx commitlint --from HEAD~1 --to HEAD --verbose

# Errores comunes:
# - Subject muy largo (>50 chars)
# - Tipo no válido (debe ser feat, fix, etc.)
# - Scope no válido (ver lista en commitlint.config.js)
# - Mayúscula en subject (debe ser lowercase)
```

### Pre-commit Hook Falla

```bash
# Ejecutar manualmente para debug
npm run lint:fix
npm run format
npm run type-check

# Si persiste, skip temporalmente (NO recomendado)
git commit --no-verify -m "fix: emergency hotfix"
```

### PR Template No Aparece

1. **Archivo correcto**: Debe estar en `.github/pull_request_template.md`
2. **Permisos**: Verificar que el archivo tiene permisos de lectura
3. **Caché GitHub**: Esperar 5-10 minutos o usar incógnito

### Commitizen No Funciona

```bash
# Reinstalar
npm install --save-dev commitizen cz-conventional-changelog

# Verificar config
cat package.json | grep -A5 '"config"'

# Should show:
# "config": {
#   "commitizen": {
#     "path": "./node_modules/cz-conventional-changelog"
#   }
# }
```

## 🎓 Training Team

### Para Nuevos Desarrolladores

1. **Leer documentación**: `docs/conventional-commits.md`
2. **Práctica con commits**: Hacer 5-10 commits de prueba
3. **Primer PR**: Hacer PR pequeño para familiarizarse
4. **Shadowing**: Observar review de PR senior

### Para Reviewers

1. **Leer guías**: `docs/code-review-guidelines.md`
2. **Practicar**: Hacer shadow review con senior
3. **Checklist**: Usar checklist del PR template
4. **Feedback constructivo**: Ser específico y educativo

## 📊 Métricas y Monitoreo

### GitHub Insights

Trackear mensualmente:

- Tiempo promedio de review
- % de PRs aprobados en primera review
- Tipos de commits más comunes
- Scopes más utilizados

### Quality Gates

- **Code Coverage**: ≥ 70%
- **Review Time**: ≤ 24h para features pequeñas
- **Build Success Rate**: ≥ 95%
- **Conventional Commits Compliance**: 100%

## 🔗 Referencias Rápidas

- **Conventional Commits**: https://www.conventionalcommits.org/
- **Commitlint Rules**: https://commitlint.js.org/#/reference-rules
- **GitHub PR Templates**: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository

---

**¿Dudas?** Crear issue en el repo o preguntar en el canal de desarrollo del equipo.
