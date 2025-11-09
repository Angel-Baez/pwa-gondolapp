Cuando te pida un endpoint API:

**Catálogo (sincronizado):**

- `GET /api/products` - Listar todos los productos
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear nuevo producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/barcode/:barcode` - Buscar por código de barras
- `GET /api/products/sync/:timestamp` - Cambios desde timestamp

**Movimientos (solo escritura con validación):**

- `POST /api/movements` - Registrar movimiento (reposición/descarte)
- `POST /api/movements/batch` - Registrar múltiples movimientos
- `GET /api/movements` - Historial con filtros (solo para reportes)

**Validación de Schema (Backend):**

```typescript
// Validación antes de escribir a MongoDB
const MovementSchema = z.object({
  type: z.enum(['restock', 'discard']),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  timestamp: z.date(),
});

// En el endpoint POST /api/movements
app.post('/api/movements', async (req, res) => {
  try {
    // Validar datos de la cola offline
    const validatedData = MovementSchema.parse(req.body);

    // Solo entonces escribir a MongoDB
    const movement = await Movement.create(validatedData);
    res.json(movement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos de cola offline',
        details: error.errors,
      });
    }
    // Manejar otros errores...
  }
});
```

**Listas (no hay API - solo local)**

- Las listas viven solo en IndexedDB
- Más rápido, sin dependencia de red
- Se crean, modifican y eliminan localmente

**Reportes:**

- `GET /api/reports/expiring` - Productos próximos a vencer
- `GET /api/reports/top-restocked` - Más repuestos
- `GET /api/reports/low-movement` - Menos movimiento
- `GET /api/reports/low-stock` - Bajo stock mínimo
- `GET /api/reports/restock-suggestions` - Sugerencias de pedido

**Sincronización:**

- `POST /api/sync/batch` - Sincronizar múltiples operaciones
- `GET /api/sync/status` - Estado de sincronización

**Push Notifications:**

- `POST /api/push/subscribe` - Registrar suscripción
- `PUT /api/push/subscribe/:id` - Actualizar configuración
- `DELETE /api/push/subscribe/:id` - Eliminar suscripción

**Backup:**

- `GET /api/backup/export` - Exportar backup completo (JSON)
- `POST /api/backup/import` - Importar backup

**Testing (Solo en desarrollo):**

- `POST /api/test/seed` - Poblar BD con datos de prueba
- `DELETE /api/test/reset` - Limpiar datos de prueba
- `GET /api/test/health` - Verificar estado de servicios
