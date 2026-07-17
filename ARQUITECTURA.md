# 🏗️ ARQUITECTURA TÉCNICA DEL SISTEMA

## Visión General

El sistema está diseñado con una **arquitectura en capas** que separa las responsabilidades y permite una fácil migración a PostgreSQL sin cambios en el frontend ni la lógica de negocio.

```
┌─────────────────────────────────────────────────────┐
│           CLIENTE (HTML/CSS/JS Vanilla)             │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │  Dashboard  │ │ Inventario  │ │ Movimientos  │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP/REST
                     ↓
┌─────────────────────────────────────────────────────┐
│          SERVIDOR EXPRESS (Node.js)                 │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │         API REST (Rutas Express)            │   │
│  │  /api/productos, /api/movimientos, etc     │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │    CONTROLADORES (API Logic)                │   │
│  │  ProductoController, MovimientoController   │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │    SERVICIOS (Business Logic)               │   │
│  │  ProductoService, MovimientoService         │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │  PERSISTENCIA (Abstracción de Datos)        │   │
│  │  DatabaseService (interfaz)                 │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
    ┌─────────────┐         ┌──────────────┐
    │ JSON Files  │         │ PostgreSQL   │
    │ (Actual)    │         │ (Futuro)     │
    └─────────────┘         └──────────────┘
```

---

## 📁 Estructura de Directorios

```
invent/
├── backend/
│   ├── controllers/
│   │   ├── ProductoController.js      # Maneja peticiones GET/POST/PUT/DELETE
│   │   ├── MovimientoController.js    # Endpoints de movimientos
│   │   └── CategoriaController.js     # Endpoints de categorías
│   │
│   ├── routes/
│   │   ├── productosRoutes.js         # Rutas Express para productos
│   │   ├── movimientosRoutes.js       # Rutas Express para movimientos
│   │   └── categoriasRoutes.js        # Rutas Express para categorías
│   │
│   ├── services/
│   │   ├── ProductoService.js         # Lógica de negocio de productos
│   │   ├── MovimientoService.js       # Lógica de movimientos y stock
│   │   └── CategoriaService.js        # Lógica de categorías
│   │
│   ├── middlewares/
│   │   └── index.js                   # Middleware global (logging, errores)
│   │
│   ├── database/
│   │   ├── DatabaseService.js         # INTERFAZ de persistencia
│   │   ├── productos.json             # Datos de productos
│   │   ├── movimientos.json           # Datos de movimientos
│   │   └── categorias.json            # Datos de categorías
│   │
│   └── app.js                         # Servidor principal Express
│
├── frontend/
│   ├── index.html                     # Dashboard
│   ├── style.css                      # Estilos (tema oscuro)
│   ├── app.js                         # Lógica del dashboard
│   │
│   └── pages/
│       ├── inventario.html            # Tabla de productos
│       ├── inventario.js              # Lógica de inventario
│       ├── producto.html              # Ficha de producto
│       ├── producto.js                # Lógica de ficha
│       ├── movimientos.html           # Historial de movimientos
│       └── movimientos.js             # Lógica de movimientos
│
├── package.json                       # Dependencias npm
├── README.md                          # Documentación
└── .gitignore
```

---

## 🔄 Flujo de una Petición

### Ejemplo: Crear un Producto

```
Cliente (Frontend)
    ↓
[Click en "Nuevo Producto"]
    ↓
app.js: formProducto.addEventListener('submit', async (e) => {...})
    ↓
POST http://localhost:3000/api/productos
Datos: {nombre, codigo_barras, precio_compra, ...}
    ↓
backend/app.js
    ↓ (Rutas)
backend/routes/productosRoutes.js
    ↓ (POST /)
router.post('/', ProductoController.crear)
    ↓
backend/controllers/ProductoController.js
    ProductoController.crear(req, res)
      ├─ Validar datos
      └─ Llamar servicio
    ↓
backend/services/ProductoService.js
    productoService.crear(datosProducto)
      ├─ Validar código de barras
      ├─ Agregar metadatos (activo, fecha_creacion)
      └─ Llamar persistencia
    ↓
backend/database/DatabaseService.js
    this.db.create(nuevoProducto)
      ├─ Leer productos.json
      ├─ Agregar nuevo producto con ID
      ├─ Incrementar nextId
      └─ Guardar productos.json
    ↓
Archivo: backend/database/productos.json ✅
    ↓
Response: {id: 1, nombre: "...", ...}
    ↓
app.js: mostrarToast("✅ Producto creado")
    ↓
    ✅ Cliente ve notificación
```

---

## 🎯 Responsabilidades de Cada Capa

### 1️⃣ FRONTEND (HTML/CSS/JS)
- **Presentación**: Mostrar datos al usuario
- **Interacción**: Capturar eventos y entrada del usuario
- **Validación básica**: Campos requeridos, formatos
- **Estado local**: No almacena datos persistentes

**Archivos:**
- `index.html` - Estructura HTML
- `style.css` - Estilos visuales
- `app.js` - Lógica de formularios y búsqueda
- `pages/*.js` - Lógica específica de cada página

### 2️⃣ RUTAS (Express Routes)
- **Mapeo**: Asociar URLs con controladores
- **Métodos HTTP**: GET, POST, PUT, DELETE
- **Validación básica**: Presencia de parámetros
- **No contienen lógica de negocio**

**Archivos:**
- `routes/productosRoutes.js`
- `routes/movimientosRoutes.js`
- `routes/categoriasRoutes.js`

**Ejemplo:**
```javascript
router.post('/', ProductoController.crear);
// Esto dice: "POST /api/productos" → llama ProductoController.crear()
```

### 3️⃣ CONTROLADORES (Controllers)
- **Entrada de datos**: Reciben req/res
- **Validación**: Verifican datos de entrada
- **Orquestación**: Llaman servicios
- **Respuestas HTTP**: JSON con estado y datos

**Responsabilidades:**
```javascript
static crear(req, res) {
  // 1. Validar entrada
  if (!datosProducto.nombre) {
    return res.status(400).json({error: 'Nombre requerido'});
  }
  
  // 2. Llamar servicio
  const nuevoProducto = productoService.crear(datosProducto);
  
  // 3. Enviar respuesta
  res.status(201).json(nuevoProducto);
}
```

### 4️⃣ SERVICIOS (Services)
- **Lógica de negocio**: Reglas de negocio
- **Validaciones complejas**: Verificaciones de base de datos
- **Orquestación**: Coordinan múltiples operaciones
- **Independientes de BD**: Usan solo la interfaz

**Ejemplos:**
```javascript
// Validar código de barras único
existeCodigoBarras(codigoBarras, excepto_id = null) {
  const producto = this.obtenerPorCodigoBarras(codigoBarras);
  if (!producto) return false;
  if (excepto_id && producto.id === excepto_id) return false;
  return true;
}

// Registrar movimiento Y actualizar stock
registrarEntrada(productoId, cantidad, motivo) {
  const movimiento = this.db.create({...});
  const nuevoStock = producto.stock + cantidad;
  this.productoService.actualizar(productoId, {stock: nuevoStock});
}
```

### 5️⃣ PERSISTENCIA (Database Service)
- **Abstracción**: Interface única para acceso a datos
- **Operaciones CRUD**: Create, Read, Update, Delete
- **Búsqueda**: Filtros y búsqueda de texto
- **Agnóstica**: No sabe cómo se almacenan realmente los datos

**Interface:**
```javascript
class DatabaseService {
  read()                              // Lee archivo JSON
  write(data)                         // Escribe archivo JSON
  getAll()                            // Obtiene todos
  getById(id)                         // Obtiene por ID
  create(item)                        // Crea nuevo
  update(id, data)                    // Actualiza
  delete(id)                          // Elimina
  findBy(field, value)                // Busca por campo
  search(field, searchText)           // Busca por texto
}
```

---

## 🔐 Reglas de Negocio Implementadas

### ✅ Validaciones Implementadas

#### Productos
```javascript
// 1. Código de barras único
existeCodigoBarras(codigoBarras) → No permite duplicados

// 2. Stock nunca negativo
registrarSalida(cantidad) → if (stock < cantidad) throw Error

// 3. Eliminar es lógico
marcarInactivo(id) → activo = false (no se elimina realmente)

// 4. Datos requeridos
crear(producto) → nombre, codigo_barras obligatorios
```

#### Movimientos
```javascript
// 1. Registro automático
registrarEntrada/Salida/Ajuste() → Crea movimiento + actualiza stock

// 2. Integridad referencial
registrarMovimiento(productoId) → Valida que producto exista

// 3. Auditoría
Cada movimiento guarda: usuario, fecha, motivo

// 4. Tipos válidos
TIPOS = {ENTRADA, SALIDA, AJUSTE}
```

---

## 🔄 MIGRACIÓN A POSTGRESQL

Para migrar a PostgreSQL **SIN cambiar Frontend ni Servicios**:

### Paso 1: Crear PostgresService

```javascript
// backend/database/PostgresService.js
const { Pool } = require('pg');

class PostgresService {
  constructor(table) {
    this.table = table;
    this.pool = new Pool({
      user: 'usuario',
      password: 'password',
      host: 'localhost',
      port: 5432,
      database: 'inventario'
    });
  }

  async getAll() {
    const result = await this.pool.query(`SELECT * FROM ${this.table}`);
    return result.rows;
  }

  async create(item) {
    const fields = Object.keys(item);
    const values = Object.values(item);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(',');
    
    const query = `
      INSERT INTO ${this.table} (${fields.join(',')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // ... implementar resto de métodos
}

module.exports = PostgresService;
```

### Paso 2: Cambiar en Services

```javascript
// En backend/services/ProductoService.js
// Cambiar:
// const DatabaseService = require('../database/DatabaseService');

// Por:
const DatabaseService = require('../database/PostgresService');
```

### Paso 3: Crear tablas SQL

```sql
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  codigo_barras VARCHAR(20) UNIQUE NOT NULL,
  sku VARCHAR(50),
  nombre VARCHAR(150) NOT NULL,
  categoria INTEGER REFERENCES categorias(id),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  descripcion TEXT,
  precio_compra DECIMAL(10, 2) NOT NULL,
  precio_venta DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  ubicacion VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimientos (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  tipo VARCHAR(20) NOT NULL,
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario VARCHAR(100)
);

CREATE INDEX idx_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_producto_id ON movimientos(producto_id);
CREATE INDEX idx_tipo ON movimientos(tipo);
```

### ¿Qué NO cambia?

✅ **Frontend**: Mismo HTML, CSS, JavaScript
✅ **Controllers**: Mismo código
✅ **Services**: Mismo código (mismo interfaz)
✅ **API Endpoints**: Mismos endpoints
✅ **Lógica de negocio**: Misma lógica

---

## 🧪 Testing

### Ejemplos de Pruebas Manuales

#### 1. Crear producto
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_barras": "1234567890",
    "nombre": "Protector de pantalla",
    "categoria": 1,
    "precio_compra": 50,
    "precio_venta": 99.99
  }'
```

#### 2. Registrar entrada
```bash
curl -X POST http://localhost:3000/api/movimientos/entrada \
  -H "Content-Type: application/json" \
  -d '{
    "productoId": 1,
    "cantidad": 50,
    "motivo": "Compra a proveedor",
    "usuario": "admin"
  }'
```

#### 3. Obtener estadísticas
```bash
curl http://localhost:3000/api/productos/stats/estadisticas
```

---

## 📊 Flujo de Stock

```
Cliente busca producto
    ↓
Ir a inventario
    ↓
Ver ficha (producto.html)
    ↓
Click en "Entrada"
    ↓
Modal: Ingresar cantidad
    ↓
POST /api/movimientos/entrada
    ↓
MovimientoService.registrarEntrada()
    ├─ 1. Crear movimiento
    │   └─ MovimientoService.db.create({...})
    │
    └─ 2. Actualizar stock
        └─ ProductoService.actualizar(id, {stock: nuevo})
            └─ ProductoService.db.update(id, {...})
    ↓
    ✅ Stock actualizado
    ✅ Movimiento registrado
    ↓
Notificación al cliente
```

---

## 🔒 Seguridad

### Implementado
- ✅ Validación de entrada
- ✅ Manejo de errores
- ✅ Logging de operaciones

### Recomendado (Futuro)
- 🔲 Autenticación JWT
- 🔲 Control de roles
- 🔲 Rate limiting
- 🔲 HTTPS/SSL

---

## 📈 Performance

### Optimizaciones Actuales
- ✅ Búsqueda instantánea (cliente-side filtering)
- ✅ Carga de datos bajo demanda
- ✅ Índices en JSON (búsqueda O(n))

### Para Escalabilidad
- Con PostgreSQL: Índices de BD
- Caché con Redis
- Pagination en tablas grandes
- Compresión de respuestas

---

## 📝 Convenciones de Código

### Nombres
- `Controller` → Acciones HTTP
- `Service` → Lógica de negocio
- `DatabaseService` → Operaciones de datos

### Métodos
- `get...()` → Obtener datos
- `crear()` → Crear nuevo
- `actualizar()` → Modificar existente
- `marcar...()` → Cambiar estado

### Errores
- Throw Error con mensaje claro
- Controller captura y responde HTTP
- Toast notifica al usuario

---

**Esto proporciona una base sólida, profesional y fácil de escalar. 🚀**
