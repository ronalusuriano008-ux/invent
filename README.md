# 📱 Sistema de Inventario - Celulares y Accesorios

Un sistema de gestión de inventario moderno, rápido y responsive diseñado específicamente para tiendas de celulares y accesorios.

## ✨ Características

✅ **Dashboard completo** con estadísticas en tiempo real
✅ **Tabla de productos** con búsqueda instantánea
✅ **Gestión de movimientos** (Entrada, Salida, Ajuste)
✅ **Historial completo** de operaciones
✅ **Filtros y exportación** a CSV
✅ **Diseño responsive** y tema oscuro profesional
✅ **Arquitectura limpia** preparada para migración a PostgreSQL

## 🏗️ Arquitectura

```
invent/
├── backend/
│   ├── controllers/     # Lógica de API
│   ├── routes/          # Rutas Express
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # Middlewares Express
│   ├── database/        # Capa de persistencia
│   └── app.js          # Servidor principal
├── frontend/
│   ├── index.html      # Dashboard
│   ├── style.css       # Estilos (tema oscuro)
│   ├── app.js          # Lógica principal
│   └── pages/          # Páginas secundarias
├── package.json        # Dependencias
└── README.md          # Este archivo
```

## 🔧 Instalación

### Requisitos
- Node.js 14+ 
- npm o yarn

### Pasos

1. **Clonar/Descargar el proyecto**
```bash
cd /home/ronny/Desktop/invent
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor**
```bash
npm start
```

O con nodemon (desarrollo):
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

## 📊 Estructura de Datos

### Productos
```json
{
  "id": 1,
  "codigo_barras": "1234567890",
  "sku": "SKU-001",
  "nombre": "Protector de Pantalla Samsung",
  "categoria": 1,
  "marca": "Samsung",
  "modelo": "A50",
  "descripcion": "Protector de vidrio templado",
  "precio_compra": 50.00,
  "precio_venta": 99.99,
  "stock": 25,
  "stock_minimo": 5,
  "ubicacion": "Estante A1",
  "activo": true,
  "fecha_creacion": "2024-01-01T10:00:00Z"
}
```

### Movimientos
```json
{
  "id": 1,
  "producto_id": 1,
  "tipo": "ENTRADA",
  "cantidad": 50,
  "motivo": "Compra a proveedor",
  "fecha": "2024-01-01T10:00:00Z",
  "usuario": "admin"
}
```

## 🌐 API Endpoints

### Productos
- `GET /api/productos` - Obtener todos
- `GET /api/productos/:id` - Obtener uno
- `GET /api/productos/buscar?q=...` - Buscar
- `GET /api/productos/stats/estadisticas` - Estadísticas
- `POST /api/productos` - Crear
- `PUT /api/productos/:id` - Actualizar
- `DELETE /api/productos/:id` - Eliminar (lógico)

### Movimientos
- `GET /api/movimientos` - Obtener todos
- `GET /api/movimientos/ultimos?cantidad=10` - Últimos N
- `POST /api/movimientos/entrada` - Registrar entrada
- `POST /api/movimientos/salida` - Registrar salida
- `POST /api/movimientos/ajuste` - Registrar ajuste

### Categorías
- `GET /api/categorias` - Obtener todas
- `POST /api/categorias` - Crear
- `PUT /api/categorias/:id` - Actualizar
- `DELETE /api/categorias/:id` - Eliminar

## 💡 Uso

### 1. Crear un Producto
1. Click en "Nuevo Producto" en el Dashboard
2. Rellenar formulario
3. Guardar

### 2. Registrar Movimientos
1. Ir a Inventario
2. Click en botones 📥📤 del producto
3. Ingresar cantidad y motivo
4. Registrar

### 3. Ver Historial
1. Click en "Ver" (👁️) en la tabla
2. Se abre ficha del producto
3. Ver todos los movimientos

### 4. Exportar Datos
1. Ir a Movimientos
2. Aplicar filtros (opcional)
3. Click en "Exportar CSV"

## 🔄 Migración a PostgreSQL

Para migrar a PostgreSQL:

1. Crear nueva clase `PostgresService` en `backend/database/`
2. Implementar mismos métodos que `DatabaseService`
3. Cambiar en `backend/services/` las importaciones
4. **Frontend NO requiere cambios**

Ejemplo:
```javascript
// Cambiar en ProductoService.js
// const DatabaseService = require('../database/DatabaseService');
const DatabaseService = require('../database/PostgresService');
```

## 🎨 Tema Oscuro

El sistema utiliza variables CSS para fácil personalización:

```css
--primary: #3b82f6          /* Azul */
--success: #10b981         /* Verde */
--warning: #f59e0b         /* Amarillo */
--danger: #ef4444          /* Rojo */
--dark: #1f2937            /* Gris oscuro */
--darker: #111827          /* Fondo oscuro */
```

Editar en `frontend/style.css`

## 📋 Funcionalidades Futuras

- [ ] Autenticación y roles
- [ ] Backup automático
- [ ] Reportes avanzados
- [ ] Integración con lector de códigos de barras
- [ ] Notificaciones de stock bajo
- [ ] Múltiples ubicaciones
- [ ] Ajustes de precios dinámicos

## 📞 Soporte

Para reportar errores o sugerencias, crear un issue en el repositorio.

## 📄 Licencia

Este proyecto es de código abierto.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2026  
**Desarrollado para:** Tiendas de celulares y accesorios
