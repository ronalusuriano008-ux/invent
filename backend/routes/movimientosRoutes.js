const express = require('express');
const MovimientoController = require('../controllers/MovimientoController');
const { authenticateUser, requireRole, requireAnyRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

// Obtener todos los movimientos
router.get('/', requireAnyRole([1, 2]), MovimientoController.obtenerTodos);

// Obtener mis ventas / movimientos propios
router.get('/mis', requireAnyRole([1, 2]), MovimientoController.obtenerPropios);

// Obtener resumen del día
router.get('/resumen-dia', requireAnyRole([1, 2]), MovimientoController.obtenerResumenDia);

// Estadísticas administrativas y ranking
router.get('/estadisticas', requireRole(1), MovimientoController.obtenerEstadisticas);

// Filtrar movimientos por usuario, producto, categoría, fecha, tipo o motivo
router.get('/filtrar', requireAnyRole([1, 2]), MovimientoController.filtrar);

// Obtener últimos N movimientos
router.get('/ultimos', requireAnyRole([1, 2]), MovimientoController.obtenerUltimos);

// Obtener por tipo (ENTRADA, SALIDA, AJUSTE)
router.get('/tipo/:tipo', requireRole(1), MovimientoController.obtenerPorTipo);

// Obtener movimientos de un producto
router.get('/producto/:productoId', requireAnyRole([1, 2]), MovimientoController.obtenerPorProducto);

// Obtener valor de movimientos de un producto
router.get('/producto/:productoId/valor', requireRole(1), MovimientoController.obtenerValorMovimientos);

// Registrar entrada
router.post('/entrada', requireRole(1), MovimientoController.registrarEntrada);

// Registrar salida
router.post('/salida', requireAnyRole([1, 2]), MovimientoController.registrarSalida);

// Registrar venta del POS
router.post('/venta', requireAnyRole([1, 2]), MovimientoController.registrarVenta);

// Registrar ajuste
router.post('/ajuste', requireRole(1), MovimientoController.registrarAjuste);

module.exports = router;
