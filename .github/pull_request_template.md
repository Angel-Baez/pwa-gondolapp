## 📋 Descripción

Breve descripción de los cambios implementados y por qué son necesarios.

## 🔄 Tipo de Cambio

- [ ] 🚀 Nueva funcionalidad (feat)
- [ ] 🐛 Corrección de bug (fix)
- [ ] 💥 Breaking change (cambio que rompe funcionalidad existente)
- [ ] 📚 Documentación (docs)
- [ ] 🎨 Refactoring (refactor)
- [ ] ⚡ Mejora de performance (perf)
- [ ] 🧪 Tests (test)
- [ ] 🔧 Configuración/herramientas (chore)

## ✅ Checklist de Calidad

### Código

- [ ] Mi código sigue las convenciones del proyecto (PascalCase, camelCase, etc.)
- [ ] He realizado self-review de mi código
- [ ] He comentado áreas complejas con JSDoc
- [ ] No hay console.log() o debugger olvidados
- [ ] Funciones ≤ 50 líneas, archivos ≤ 500 líneas

### Arquitectura PWA

- [ ] ✅ **Funciona offline** (crítico para PWA)
- [ ] Respeta la estrategia de 3 capas de datos
- [ ] Usa Repository pattern para acceso a datos
- [ ] Lógica de negocio en services, no en componentes
- [ ] Transacciones IndexedDB son atómicas

### Mobile-First

- [ ] Touch targets ≥ 44×44px
- [ ] Funciona con una sola mano
- [ ] Feedback háptico en acciones confirmables
- [ ] Optimizado para móvil (performance, batería)

### Testing

- [ ] He agregado tests que validan mis cambios
- [ ] Tests unitarios para lógica de negocio (≥80% cobertura)
- [ ] Tests de componentes si aplica
- [ ] Todos los tests pasan localmente (`npm run test`)

### Documentación

- [ ] He actualizado documentación si es necesario
- [ ] README.md actualizado si cambió funcionalidad
- [ ] Cambios documentados en comentarios de commit

## 🧪 Testing Realizado

Describe las pruebas realizadas para validar los cambios:

- [ ] Testing manual en móvil (Chrome DevTools o dispositivo real)
- [ ] Testing offline/online (desconectar WiFi)
- [ ] Testing con datos reales (IndexedDB poblada)
- [ ] Tests automatizados pasando

## 📱 Screenshots/Videos (si aplica)

Agregar capturas de pantalla o videos para cambios de UI, especialmente móvil.

## 🔗 Issues Relacionados

Fixes #(número_de_issue)
Closes #(número_de_issue)
Related to #(número_de_issue)

## 🚨 Breaking Changes

Si hay breaking changes, describir qué se rompe y cómo migrar:

- Cambio A: ...
- Migración: ...

## 📝 Notas Adicionales

Cualquier información adicional para los revisores:

- Decisiones de diseño tomadas
- Trade-offs considerados
- Áreas que necesitan atención especial
- TODOs para futuras iteraciones

---

### Para Reviewers:

**Puntos críticos a validar:**

1. **Offline-first**: ¿Funciona sin internet?
2. **Mobile UX**: ¿Usable con una mano?
3. **Data consistency**: ¿Transacciones atómicas?
4. **Performance**: ¿No degrada en móvil?
5. **Architecture**: ¿Respeta Repository + Service pattern?
