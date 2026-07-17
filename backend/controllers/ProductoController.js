const ProductoService = require('../services/ProductoService');
const MovimientoService = require('../services/MovimientoService');

const productoService = new ProductoService();
const movimientoService = new MovimientoService();

class ProductoController {
  /**
   * Obtiene todos los productos activos
   */
  static obtenerTodos(req, res) {
    try {
      const includeInactive = req.query.showInactive === 'true';
      const productos = productoService.obtenerTodos();
      const resultados = includeInactive ? productos : productos.filter(p => p.activo !== false);
      res.json(resultados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene un producto por ID
   */
  static obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const producto = productoService.obtenerPorId(id);

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json(producto);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Busca por código de barras, SKU, nombre o descripción
   */
  static buscar(req, res) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Parámetro q requerido' });
      }

      const resultados = productoService.buscar(q)
        .filter(p => p.activo !== false);

      res.json(resultados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Crea un nuevo producto
   */
  static async crear(req, res) {
    try {
      const datosProducto = req.body;

      if (!datosProducto.nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const nuevoProducto = await productoService.crear(datosProducto);
      res.status(201).json(nuevoProducto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Actualiza un producto
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      const productActualizado = await productoService.actualizar(id, datosActualizacion);
      res.json(productActualizado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Marca un producto como inactivo (borrado lógico)
   */
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const productoActualizado = await productoService.marcarInactivo(id);
      res.json(productoActualizado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Obtiene productos con stock bajo
   */
  static obtenerStockBajo(req, res) {
    try {
      const productos = productoService.obtenerStockBajo();
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene productos agotados
   */
  static obtenerAgotados(req, res) {
    try {
      const productos = productoService.obtenerAgotados();
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene estadísticas del inventario
   */
  static obtenerEstadisticas(req, res) {
    try {
      const estadisticas = productoService.obtenerEstadisticas();
      res.json(estadisticas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene productos por categoría
   */
  static obtenerPorCategoria(req, res) {
    try {
      const { categoriaId } = req.params;
      const productos = productoService.obtenerPorCategoria(parseInt(categoriaId));
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene el historial de movimientos de un producto
   */
  static obtenerHistorial(req, res) {
    try {
      const { id } = req.params;
      const movimientos = movimientoService.obtenerPorProducto(parseInt(id));
      const producto = productoService.obtenerPorId(id);

      res.json({
        producto,
        movimientos: movimientos.reverse()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProductoController;
