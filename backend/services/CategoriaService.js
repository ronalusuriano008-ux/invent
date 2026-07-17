const DatabaseService = require('../database/DatabaseService');

class CategoriaService {
  constructor() {
    this.db = new DatabaseService('categorias');
  }

  /**
   * Obtiene todas las categorías
   */
  obtenerTodas() {
    return this.db.getAll();
  }

  /**
   * Obtiene una categoría por ID
   */
  obtenerPorId(id) {
    return this.db.getById(id);
  }

  /**
   * Crea una nueva categoría
   */
  crear(nombre, descripcion = '') {
    return this.db.create({
      nombre,
      descripcion
    });
  }

  /**
   * Actualiza una categoría
   */
  actualizar(id, nombre, descripcion = '') {
    const categoria = this.obtenerPorId(id);
    if (!categoria) throw new Error('Categoría no encontrada');

    return this.db.update(id, { nombre, descripcion });
  }

  /**
   * Elimina una categoría
   */
  eliminar(id) {
    return this.db.delete(id);
  }
}

module.exports = CategoriaService;
