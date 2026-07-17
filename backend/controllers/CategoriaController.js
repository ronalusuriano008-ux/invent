const CategoriaService = require('../services/CategoriaService');

const categoriaService = new CategoriaService();

class CategoriaController {
  /**
   * Obtiene todas las categorías
   */
  static obtenerTodas(req, res) {
    try {
      const categorias = categoriaService.obtenerTodas();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  static obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const categoria = categoriaService.obtenerPorId(parseInt(id));
      
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Crea una nueva categoría
   */
  static crear(req, res) {
    try {
      const { nombre, descripcion = '' } = req.body;

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const nuevaCategoria = categoriaService.crear(nombre, descripcion);
      res.status(201).json(nuevaCategoria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Actualiza una categoría
   */
  static actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion = '' } = req.body;

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const categoriaActualizada = categoriaService.actualizar(
        parseInt(id),
        nombre,
        descripcion
      );
      res.json(categoriaActualizada);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Elimina una categoría
   */
  static eliminar(req, res) {
    try {
      const { id } = req.params;
      const resultado = categoriaService.eliminar(parseInt(id));
      
      if (!resultado) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json({ mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = CategoriaController;
