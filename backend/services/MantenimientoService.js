const DatabaseService = require('../database/DatabaseService');
const CategoriaService = require('./CategoriaService');
const ProductoService = require('./ProductoService');
const UsuarioService = require('./UsuarioService');

class MantenimientoService {
  constructor() {
    this.productoDb = new DatabaseService('productos');
    this.categoriaDb = new DatabaseService('categorias');
    this.movimientoDb = new DatabaseService('movimientos');
    this.usuarioDb = new DatabaseService('usuarios');
    this.productoService = new ProductoService();
    this.categoriaService = new CategoriaService();
    this.usuarioService = new UsuarioService();
  }

  resumen() {
    const productos = this.productoDb.getAll();
    const categorias = this.categoriaDb.getAll();
    const movimientos = this.movimientoDb.getAll();
    const usuarios = this.usuarioDb.getAll();

    return {
      productos: productos.length,
      categorias: categorias.length,
      movimientos: movimientos.length,
      usuarios: usuarios.length,
      usuariosEliminables: usuarios.filter(u => u.usuario !== 'admin').length,
      productosInactivos: productos.filter(p => p.activo === false).length,
      stockTotal: productos.reduce((sum, p) => sum + Number(p.stock || 0), 0)
    };
  }

  resumenCategoria(categoriaId) {
    const categoria = this.categoriaService.obtenerPorId(categoriaId);
    const productos = this.productoService.obtenerPorCategoria(categoriaId);
    const movimientos = this.movimientoDb.getAll().filter(m => productos.some(p => p.id === m.producto_id));

    return {
      categoriaId,
      categoria: categoria ? categoria.nombre : 'Sin categoría',
      productos: productos.length,
      movimientos: movimientos.length
    };
  }

  async eliminarTodosProductos() {
    return this.productoDb.write({ productos: [], nextId: 1 });
  }

  async eliminarTodosCategorias() {
    return this.categoriaDb.write({ categorias: [] });
  }

  async eliminarTodosMovimientos() {
    return this.movimientoDb.write({ movimientos: [], nextId: 1 });
  }

  async eliminarUsuariosExceptoAdmin() {
    const usuarios = this.usuarioDb.getAll();
    const admin = usuarios.find(u => u.usuario === 'admin');
    const datos = admin ? [admin] : [];
    return this.usuarioDb.write({ usuarios: datos, nextId: admin ? Math.max(...datos.map(u => u.id)) + 1 : 1 });
  }

  async reiniciarInventario() {
    await this.productoDb.write({ productos: [], nextId: 1 });
    await this.categoriaDb.write({ categorias: [] });
    await this.movimientoDb.write({ movimientos: [], nextId: 1 });
    return true;
  }

  async restaurarDatosDePrueba() {
    const seedData = this.productoDb.readSeedData();
    await this.productoDb.write({
      productos: seedData.productos || [],
      nextId: seedData.nextId || ((seedData.productos || []).length + 1)
    });
    await this.categoriaDb.write({ categorias: seedData.categorias || [] });
    await this.movimientoDb.write({ movimientos: seedData.movimientos || [], nextId: 1 });
    return true;
  }

  async vaciarStock() {
    const data = this.productoDb.read();
    const items = Array.isArray(data) ? data : data.productos || [];
    const productos = items.map(producto => ({ ...producto, stock: 0 }));
    return this.productoDb.write({ productos, nextId: data.nextId || productos.length + 1 });
  }

  async eliminarProductosInactivos() {
    const data = this.productoDb.read();
    const items = Array.isArray(data) ? data : data.productos || [];
    const productos = items.filter(producto => producto.activo !== false);
    return this.productoDb.write({ productos, nextId: data.nextId || productos.length + 1 });
  }

  async eliminarProductosSeleccionados(productoIds = []) {
    const data = this.productoDb.read();
    const items = Array.isArray(data) ? data : data.productos || [];
    const seleccionados = productoIds.map(id => Number(id));
    const productos = items.filter(producto => !seleccionados.includes(producto.id));
    return this.productoDb.write({ productos, nextId: data.nextId || productos.length + 1 });
  }

  async eliminarProductosPorCategoria(categoriaId) {
    const data = this.productoDb.read();
    const items = Array.isArray(data) ? data : data.productos || [];
    const categoria = Number(categoriaId);
    const productos = items.filter(producto => Number(producto.categoria) !== categoria);
    return this.productoDb.write({ productos, nextId: data.nextId || productos.length + 1 });
  }
}

module.exports = MantenimientoService;
