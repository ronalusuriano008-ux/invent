const MantenimientoService = require('../services/MantenimientoService');
const mantenimientoService = new MantenimientoService();

class MantenimientoController {
  static obtenerResumen(req, res) {
    try {
      const resumen = mantenimientoService.resumen();
      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static obtenerResumenCategoria(req, res) {
    try {
      const { categoriaId } = req.params;
      const resumen = mantenimientoService.resumenCategoria(parseInt(categoriaId));
      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarTodosProductos(req, res) {
    try {
      await mantenimientoService.eliminarTodosProductos();
      res.json({ message: 'Todos los productos fueron eliminados' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarTodosCategorias(req, res) {
    try {
      await mantenimientoService.eliminarTodosCategorias();
      res.json({ message: 'Todas las categorías fueron eliminadas' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarTodosMovimientos(req, res) {
    try {
      await mantenimientoService.eliminarTodosMovimientos();
      res.json({ message: 'Todo el historial de movimientos fue eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarUsuariosExceptoAdmin(req, res) {
    try {
      await mantenimientoService.eliminarUsuariosExceptoAdmin();
      res.json({ message: 'Todos los usuarios no administradores fueron eliminados' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async reiniciarInventario(req, res) {
    try {
      await mantenimientoService.reiniciarInventario();
      res.json({ message: 'Inventario reiniciado y archivos limpiados' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async restaurarDatosDePrueba(req, res) {
    try {
      await mantenimientoService.restaurarDatosDePrueba();
      res.json({ message: 'Datos de prueba restaurados desde seed-data.json' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async vaciarStock(req, res) {
    try {
      await mantenimientoService.vaciarStock();
      res.json({ message: 'Stock de todos los productos vaciado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarProductosInactivos(req, res) {
    try {
      await mantenimientoService.eliminarProductosInactivos();
      res.json({ message: 'Productos inactivos eliminados' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarProductosSeleccionados(req, res) {
    try {
      const { productoIds } = req.body;
      if (!Array.isArray(productoIds) || productoIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de productoIds' });
      }
      await mantenimientoService.eliminarProductosSeleccionados(productoIds);
      res.json({ message: 'Productos seleccionados eliminados', eliminado: productoIds.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async eliminarProductosPorCategoria(req, res) {
    try {
      const { categoriaId } = req.params;
      if (!categoriaId) {
        return res.status(400).json({ error: 'categoriaId es requerido' });
      }
      await mantenimientoService.eliminarProductosPorCategoria(parseInt(categoriaId));
      res.json({ message: 'Productos de la categoría eliminados' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MantenimientoController;
