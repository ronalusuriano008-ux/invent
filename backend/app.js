const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const productosRoutes = require('./routes/productosRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const { errorHandler, loggerMiddleware, validateJsonBody } = require('./middlewares');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARES ====================
app.use(loggerMiddleware);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(validateJsonBody);

// ==================== RUTAS ESTÁTICAS ====================
app.use(express.static(path.join(__dirname, '../frontend')));

// ==================== API ROUTES ====================
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);

// ==================== RUTAS DE PÁGINAS ====================
// Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Página de inventario
app.get('/inventario', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/inventario.html'));
});

// Página de producto
app.get('/producto/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/producto.html'));
});

// Página de movimientos
app.get('/movimientos', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/movimientos.html'));
});

// Página de usuarios
app.get('/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/usuarios.html'));
});

// Punto de venta para vendedores
app.get('/pos', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/pos.html'));
});

// Página de mantenimiento administrador
app.get('/mantenimiento', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/mantenimiento.html'));
});

// Dashboard administrativo
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/admin.html'));
});

// ==================== MANEJO DE ERRORES ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  Sistema de Inventario - Celulares y Accesorios      ║
║  Servidor ejecutándose en http://localhost:${PORT}  ║
║  Modo: Desarrollo                                     ║
║  BD: JSON (Archivos locales)                          ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
