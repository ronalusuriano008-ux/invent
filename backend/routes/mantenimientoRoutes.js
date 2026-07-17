const express = require('express');
const MantenimientoController = require('../controllers/MantenimientoController');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(requireRole(1));

router.get('/resumen', MantenimientoController.obtenerResumen);
router.get('/resumen/categoria/:categoriaId', MantenimientoController.obtenerResumenCategoria);
router.post('/productos/eliminar/todos', MantenimientoController.eliminarTodosProductos);
router.post('/categorias/eliminar/todas', MantenimientoController.eliminarTodosCategorias);
router.post('/movimientos/eliminar/todos', MantenimientoController.eliminarTodosMovimientos);
router.post('/usuarios/eliminar/sin-admin', MantenimientoController.eliminarUsuariosExceptoAdmin);
router.post('/reiniciar-inventario', MantenimientoController.reiniciarInventario);
router.post('/restaurar-datos-prueba', MantenimientoController.restaurarDatosDePrueba);
router.post('/vaciar-stock', MantenimientoController.vaciarStock);
router.post('/productos/eliminar/inactivos', MantenimientoController.eliminarProductosInactivos);
router.post('/productos/eliminar/seleccionados', MantenimientoController.eliminarProductosSeleccionados);
router.post('/productos/eliminar/categoria/:categoriaId', MantenimientoController.eliminarProductosPorCategoria);

module.exports = router;
