const express = require('express');
const ProductoController = require('../controllers/ProductoController');
const { authenticateUser, requireRole, requireAnyRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

// Obtener todos los productos
router.get('/', ProductoController.obtenerTodos);

// Obtener estadísticas
router.get('/stats/estadisticas', ProductoController.obtenerEstadisticas);

// Obtener stock bajo
router.get('/stats/stock-bajo', ProductoController.obtenerStockBajo);

// Obtener agotados
router.get('/stats/agotados', ProductoController.obtenerAgotados);

// Buscar productos
router.get('/buscar', ProductoController.buscar);

// Obtener por categoría
router.get('/categoria/:categoriaId', ProductoController.obtenerPorCategoria);

// Obtener historial de un producto
router.get('/:id/historial', ProductoController.obtenerHistorial);

// Obtener un producto específico
router.get('/:id', ProductoController.obtenerPorId);

// Crear nuevo producto
router.post('/', requireRole(1), ProductoController.crear);

// Actualizar producto
router.put('/:id', requireRole(1), ProductoController.actualizar);

// Eliminar (marcar como inactivo)
router.delete('/:id', requireRole(1), ProductoController.eliminar);

module.exports = router;
