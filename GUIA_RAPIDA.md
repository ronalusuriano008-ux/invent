# ⚡ GUÍA RÁPIDA - CÓMO USAR EL SISTEMA

## 🚀 Inicio Rápido (5 minutos)

### 1. Iniciar el Servidor

```bash
cd /home/ronny/Desktop/invent
npm start
```

Deberías ver:
```
╔═══════════════════════════════════════════════════════╗
║  Sistema de Inventario - Celulares y Accesorios      ║
║  Servidor ejecutándose en http://localhost:3000  ║
║  Modo: Desarrollo                                     ║
║  BD: JSON (Archivos locales)                          ║
╚═══════════════════════════════════════════════════════╝
```

### 2. Abrir en el Navegador

```
http://localhost:3000
```

---

## 📋 Tareas Comunes

### ✅ Crear un Producto

1. **Dashboard** → Click "➕ Nuevo Producto"
2. Rellenar campos:
   - Código de barras ⭐ (obligatorio, único)
   - SKU (opcional)
   - Nombre ⭐ (obligatorio)
   - Categoría ⭐ (elegir de la lista)
   - Marca (ej: Samsung)
   - Modelo (ej: A50)
   - Precio compra ⭐ (ej: 50.00)
   - Precio venta ⭐ (ej: 99.99)
   - Stock inicial (ej: 10)
   - Stock mínimo (por defecto 5)
3. Click "Guardar Producto"
4. ✅ Notificación de éxito

### ✅ Ver Todos los Productos

1. Click en "📦 Inventario" en la navegación
2. Se abre tabla con todos los productos
3. Botones disponibles:
   - 👁️ Ver detalles
   - 📥 Registrar entrada
   - 📤 Registrar salida

### ✅ Registrar una Entrada (Compra)

1. **Inventario** → Click 📥 en el producto
2. Modal "Registrar Entrada":
   - Cantidad: 50 (unidades recibidas)
   - Motivo: "Compra a proveedor XXX"
   - Usuario: admin (por defecto)
3. Click "Registrar"
4. ✅ Stock actualizado automáticamente

### ✅ Registrar una Salida (Venta)

1. **Inventario** → Click 📤 en el producto
2. Modal "Registrar Salida":
   - Cantidad: 2 (unidades vendidas)
   - Motivo: "Venta al cliente"
   - Usuario: vendedor01
3. Click "Registrar"
4. ⚠️ Si stock insuficiente → Error
5. ✅ Stock actualizado

### ✅ Ver Detalles del Producto

1. **Inventario** → Click 👁️ en el producto
2. Se abre ficha completa:
   - Información básica (izquierda)
   - Precios y stock (derecha)
   - Botones de acción
   - Historial de movimientos abajo
3. Historial muestra:
   - Fecha y hora
   - Tipo (Entrada/Salida/Ajuste)
   - Cantidad
   - Stock resultante
   - Motivo
   - Usuario

### ✅ Ver Todos los Movimientos

1. Click "📊 Movimientos"
2. Tabla con TODOS los movimientos del sistema
3. Filtros disponibles:
   - Por tipo (Entrada/Salida/Ajuste)
   - Por fecha
4. Click en 👁️ para ir al producto
5. Botón "📥 Exportar CSV" para descargar datos

### ✅ Ver Dashboard

1. Click "🏠 Dashboard" (por defecto al abrir)
2. 4 tarjetas con estadísticas:
   - 📦 Total de productos registrados
   - 📊 Stock total en inventario
   - ⚠️ Productos con stock bajo
   - ❌ Productos agotados
3. Tabla "Últimos movimientos" (10 más recientes)
4. Tabla "Stock bajo" (productos por reponer)
5. Botón 🔄 Recargar para actualizar datos

### ✅ Buscar un Producto

1. Barra de búsqueda en el header
2. Escribir:
   - Código de barras: "1234567890"
   - SKU: "SKU-001"
   - Nombre: "Protector"
3. Resultados en tiempo real
4. Click en resultado → Va a detalle

---

## 📊 Archivos de Datos

Los datos se guardan en:

```
backend/database/
├── productos.json          # Todos los productos
├── movimientos.json        # Histórico de cambios
└── categorias.json         # Categorías disponibles
```

**Editar manualmente:** Abre con VS Code, edita y guarda.
**Reinicia servidor** para que cargue cambios.

---

## 🎨 Tema y Personalización

### Cambiar Colores

Editar `frontend/style.css`, líneas 1-9:

```css
:root {
  --primary: #3b82f6;          /* Azul (cambiar aquí) */
  --success: #10b981;          /* Verde */
  --warning: #f59e0b;          /* Amarillo */
  --danger: #ef4444;           /* Rojo */
  ...
}
```

### Respuesta Automática

- ✅ Desktop: Tabla completa
- ✅ Tablet: Tabla adaptada
- ✅ Mobile: Optimizado para toques

---

## 🔍 Validaciones

El sistema valida automáticamente:

### Productos
- ❌ Código de barras vacío → Error
- ❌ Código de barras duplicado → Error
- ❌ Nombre vacío → Error
- ❌ Precio negativo → Error

### Movimientos
- ❌ Stock negativo → Error (salida)
- ❌ Cantidad menor a 1 → Error
- ✅ Ajustes pueden ser negativos

---

## 🆘 Troubleshooting

### "Error: Address already in use"
El puerto 3000 está ocupado.
```bash
# Cambiar puerto en backend/app.js
const PORT = process.env.PORT || 3001;  // Cambiar a 3001
```

### "Error: Cannot GET /"
Servidor no está corriendo.
```bash
npm start  # Reiniciar
```

### Datos no se guardan
- Verificar permisos de carpeta `backend/database/`
- Abrir archivo JSON y verificar formato
- Reiniciar servidor

### Búsqueda no funciona
- Verificar que el código de barras sea EXACTO
- No hay búsqueda parcial en códigos (sí en nombres)

---

## 💾 Backup de Datos

Para guardar copia de seguridad:

```bash
# Linux/Mac
cp -r backend/database backup-$(date +%Y%m%d)

# Windows
xcopy backend\database backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%
```

---

## 📈 Próximos Pasos

### Fácil (Sin modificar código)
- ✅ Cambiar colores en CSS
- ✅ Agregar más categorías en `categorias.json`
- ✅ Agregar productos iniciales

### Medio (Modificar código)
- ⚙️ Agregar campo "proveedor" a productos
- ⚙️ Crear reportes de ganancia
- ⚙️ Filtro por rango de fecha

### Avanzado (Migración)
- 🚀 Cambiar a PostgreSQL
- 🚀 Agregar autenticación
- 🚀 Implementar API tokens

---

## 📞 Soporte Rápido

### Ver logs del servidor
Los errores aparecen en la terminal donde ejecutaste `npm start`

### Activar logs más detallados
Editar `backend/middlewares/index.js` y aumentar verbosidad

### Exportar datos
**Movimientos** → Click "📥 Exportar CSV" → Se descarga archivo

---

## ✨ Tips y Trucos

### 🎯 Uso eficiente
1. Mantener stock_minimo actualizado
2. Usar motivos descriptivos en movimientos
3. Revisar dashboard cada mañana
4. Exportar movimientos semanalmente

### ⚡ Atajos
- ESC para cerrar modales
- Enter para enviar formularios
- Tab para navegar entre campos

### 📱 En móvil
- La tabla se adapta automáticamente
- Botones se reorganizan
- Buscador funciona igual
- Los movimientos son más compactos

---

**¡Listo para usar! 🎉 Si tienes dudas, revisa ARQUITECTURA.md**
