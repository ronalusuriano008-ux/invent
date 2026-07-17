# 📚 CASOS DE USO Y EJEMPLOS PRÁCTICOS

## 🎬 Caso 1: Inicio de Día - Recibir Mercancía

### Escenario
Tu proveedor te envía 50 protectores de pantalla Samsung A50.

### Pasos

**1. Registrar el producto (primera vez)**
```
Dashboard → ➕ Nuevo Producto

Código de barras:  1234567890
SKU:               SKU-001
Nombre:            Protector Pantalla Samsung A50
Categoría:         Protectores
Marca:             Samsung
Modelo:            A50
Precio compra:     50.00 MXN
Precio venta:      99.99 MXN
Stock inicial:     0
Stock mínimo:      5
Ubicación:         Estante A1

Guardar → ✅ Producto creado
```

**2. Registrar la entrada de stock**
```
Inventario → Buscar producto → Click 📥

Cantidad:  50
Motivo:    Compra a proveedor XYZ - Factura #12345
Usuario:   admin

Registrar → ✅ Stock actualizado a 50 unidades
```

**Resultado en BD:**
```json
// productos.json
{
  "id": 1,
  "codigo_barras": "1234567890",
  "nombre": "Protector Pantalla Samsung A50",
  "stock": 50,
  "precio_compra": 50.00,
  "precio_venta": 99.99
}

// movimientos.json
{
  "id": 1,
  "producto_id": 1,
  "tipo": "ENTRADA",
  "cantidad": 50,
  "motivo": "Compra a proveedor XYZ - Factura #12345",
  "fecha": "2024-01-15T09:00:00Z",
  "usuario": "admin"
}
```

---

## 🎬 Caso 2: Venta al Cliente - Registrar Salida

### Escenario
Un cliente compra 2 protectores Samsung A50.

### Pasos

**1. Buscar el producto**
```
Header → Buscador
Escribir:  1234567890
          (código de barras)
         ↓ Resultado automático
         
Click en "Protector Pantalla Samsung A50"
```

**2. Ir a inventario y registrar salida**
```
Inventario → Buscar "protector"
           → Click 📤 en el producto

Cantidad:  2
Motivo:    Venta al cliente
Usuario:   vendedor01

Registrar → ✅ Stock actualizado a 48
```

**3. Verificar cambios en Dashboard**
```
Dashboard → Recargar

Stock Total:  Disminuyó de 50 a 48
Últimos movimientos:  Nueva venta aparece

Hora:      15:30
Producto:  Protector Pantalla Samsung A50
Tipo:      📤 Salida
Cantidad:  2
```

---

## 🎬 Caso 3: Ajuste de Inventario - Producto Dañado

### Escenario
Mientras almacenabas, un producto se rompió. Necesitas restar 1 unidad.

### Pasos

**1. Ir a ficha del producto**
```
Dashboard o Inventario
          → Click 👁️ "Ver" del producto
```

**2. Registrar ajuste**
```
Ficha del producto → ⚙️ Registrar Ajuste

Cantidad:  -1
Motivo:    Producto dañado durante almacenamiento
Usuario:   admin

Registrar → ✅ Stock actualizado a 47
```

**Diferencia de ajuste vs salida:**
```
SALIDA:   Es una venta (cantidad positiva)
AJUSTE:   Es un cambio (cantidad positiva o NEGATIVA)

Negativo = Reducir stock
Positivo = Aumentar stock
```

---

## 🎬 Caso 4: Inventario Físico - Auditoría de Stock

### Escenario
Cada mes haces conteo físico. El sistema dice 47 unidades pero contaste 45.

### Pasos

**1. Registrar la diferencia**
```
Ficha del producto → ⚙️ Registrar Ajuste

Cantidad:  -2  (para bajar de 47 a 45)
Motivo:    Diferencia en conteo físico mensual
Usuario:   encargado_inventario

Registrar → ✅ Stock corregido a 45
```

**2. Ver en historial**
```
Histórico de movimientos:
- Tipo:      ⚙️ Ajuste
- Cantidad:  -2
- Motivo:    Diferencia en conteo físico mensual
- Resultado: 45
```

---

## 🎬 Caso 5: Supervisión - Dashboard Ejecutivo

### Escenario
Cada mañana necesitas ver el estado del negocio.

### Pasos

**1. Abrir Dashboard**
```
http://localhost:3000
```

**2. Leer las tarjetas**
```
┌─────────────────────────────────────────┐
│ 📦 Productos Registrados: 24            │
│ 📊 Stock Total: 1,250 unidades          │
│ ⚠️ Stock Bajo: 3 productos              │
│ ❌ Agotados: 1 producto                 │
└─────────────────────────────────────────┘
```

**3. Revisar productos críticos**
```
Stock Bajo:
- Protector A50: 4 unidades (mínimo: 5)
- Cargador USB-C: 2 unidades (mínimo: 10)
- Funda Transparente: 3 unidades (mínimo: 5)

→ Necesitas ordenar a proveedores
```

**4. Ver últimos movimientos**
```
✅ 100% transparencia del negocio
- Qué se vendió ayer
- Qué se compró
- Quién hizo las operaciones
- Horarios exactos
```

---

## 🎬 Caso 6: Análisis - Exportar Movimientos

### Escenario
Tu contador necesita datos de movimientos para el balance.

### Pasos

**1. Ir a Movimientos**
```
Click en "📊 Movimientos"
```

**2. Filtrar periodo**
```
Filtro por fecha:  01/01/2024 a 31/01/2024
Filtro por tipo:   (dejar en blanco para todos)
```

**3. Exportar**
```
Click "📥 Exportar CSV"
       ↓
Se descarga: movimientos-2024-01-31.csv
```

**4. Abrir en Excel**
```
Archivo CSV se abre en Excel/Sheets
Contiene:
- Fecha
- Producto
- Código
- Tipo (Entrada/Salida/Ajuste)
- Cantidad
- Motivo
- Usuario
```

---

## 🎯 Lógica de Validaciones

### ✅ Esto SÍ se permite
```
Crear producto sin stock → ✅ (stock inicial = 0)
Registrar entrada de 1,000 → ✅
Registrar salida de 1 → ✅ (si hay stock)
Ajuste negativo → ✅
Buscar por código parcial → ❌ (debe ser exacto)
Código de barras duplicado → ❌ (no permite)
```

### ❌ Esto NO se permite
```
Vender 50 cuando hay 30 → ❌ "Stock insuficiente"
Crear sin código de barras → ❌ "Requerido"
Crear con código duplicado → ❌ "Ya existe"
Crear sin nombre → ❌ "Requerido"
Stock negativo → ❌ "No permitido"
```

---

## 📊 Ejemplo: Reporte Manual

### Crear reporte semanal

**1. Exportar datos**
```
Movimientos → Filtro: últimos 7 días
           → Exportar CSV
           → Guardar como "semana-01.csv"
```

**2. Abrir en Excel y agregar fórmulas**
```
SUMA de todas las ENTRADAS
SUMA de todas las SALIDAS
DIFERENCIA = Cambio neto del stock
```

**3. Ejemplo de reporte**
```
Semana 1 (1-7 Enero 2024)

Entradas:    500 unidades
Salidas:     320 unidades
Ajustes:     -5 unidades
─────────────────────────
Cambio neto: +175 unidades

Productos con mayor venta:
  1. Protector A50: 80 unidades
  2. Cargador USB-C: 65 unidades
  3. Funda Transparente: 45 unidades
```

---

## 🔄 Flujo Completo de un Día

### Mañana (09:00)
```
1. Abrir Dashboard
2. Revisar stock bajo
3. Ver últimos movimientos
4. Si hay bajo stock → Ordenar a proveedor
```

### Durante el día (10:00 - 18:00)
```
1. Cliente compra → Buscar producto → Registrar salida
2. Se recibe compra → Buscar o crear producto → Registrar entrada
3. Control de calidad → Encontrar defectos → Registrar ajuste
```

### Tarde (18:00)
```
1. Inventario → Revisar todos los productos
2. Buscar cualquier inconsistencia
3. Si hay problema → Registrar ajuste
```

### Noche (20:00)
```
1. Dashboard → Captura de estado final
2. Movimientos → Exportar CSV para contador
3. Hacer backup de archivos JSON
```

---

## 💡 Tips Avanzados

### 🔍 Búsqueda Eficiente
```
Para encontrar rápido:
- Por CÓDIGO exacto → Más rápido
- Por SKU → Si tienes SKU único
- Por NOMBRE → Busca parcial (lento si muchos)

Ej: Buscar "pro" encontrará todos con esas letras
```

### 💾 Gestión de Datos
```
Archivo: backend/database/productos.json

Editar manualmente:
1. Abrir con editor de texto
2. Cambiar valores
3. Mantener formato JSON válido
4. Guardar
5. Reiniciar servidor
```

### 📈 Performance
```
Si tienes 1,000+ productos:
- Búsqueda en JSON es lenta
- Considera migrar a PostgreSQL
- (Cambiar solo DatabaseService)
```

---

## 🎓 Ejercicios de Práctica

### Ejercicio 1: Crear 5 productos
```
1. Protector Samsung A50
2. Protector iPhone 15
3. Cargador USB-C 30W
4. Funda Transparente
5. Cable Lightning
```

### Ejercicio 2: Simular mes completo
```
Día 1: Entradas de 100 unidades de cada
Día 5: Ventas varias (50 unidades totales)
Día 10: Más entradas (100 unidades)
Día 20: Auditoría (ajustes menores)
Día 28: Exportar datos
```

### Ejercicio 3: Validaciones
```
1. Intentar crear código duplicado → ❌ Error
2. Intentar vender 1,000 sin stock → ❌ Error
3. Intentar crear sin nombre → ❌ Error
4. Todo correcto → ✅ Éxito
```

---

**¡Ahora estás listo para usar el sistema profesionalmente!** 🚀
