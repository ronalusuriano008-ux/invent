const DatabaseService = require('../database/DatabaseService');

class ProductoService {
  constructor() {
    this.db = new DatabaseService('productos');
  }

  obtenerTodos() {
    return this.db.getAll();
  }

  obtenerPorId(id) {
    return this.db.getById(id);
  }

  limpiarTexto(valor) {
    return typeof valor === 'string' ? valor.trim() : valor;
  }

  generarSku() {
    const productos = this.obtenerTodos();
    const skusUsados = productos.map(p => p.sku).filter(Boolean);
    let index = 1;
    let sku = '';

    do {
      sku = `SKU-${String(index).padStart(4, '0')}`;
      index += 1;
    } while (skusUsados.includes(sku));

    return sku;
  }

  obtenerPorCodigoBarras(codigoBarras) {
    const codigo = String(codigoBarras || '').trim().toLowerCase();
    const resultado = this.db.getAll().filter(item => String(item.codigo_barras || '').trim().toLowerCase() === codigo);
    return resultado.length > 0 ? resultado[0] : null;
  }

  obtenerPorSku(sku) {
    const skuBusqueda = String(sku || '').trim().toLowerCase();
    const resultado = this.db.getAll().filter(item => String(item.sku || '').trim().toLowerCase() === skuBusqueda);
    return resultado.length > 0 ? resultado[0] : null;
  }

  existeCodigoBarras(codigoBarras, excepto_id = null) {
    const producto = this.obtenerPorCodigoBarras(codigoBarras);
    if (!producto) return false;
    if (excepto_id && producto.id === excepto_id) return false;
    return true;
  }

  existeSku(sku, excepto_id = null) {
    const producto = this.obtenerPorSku(sku);
    if (!producto) return false;
    if (excepto_id && producto.id === excepto_id) return false;
    return true;
  }

  existeDuplicado(datosProducto, excepto_id = null) {
    const codigo = String(datosProducto.codigo_barras || '').trim();
    const sku = String(datosProducto.sku || '').trim();

    if (codigo && this.existeCodigoBarras(codigo, excepto_id)) return true;
    if (sku && this.existeSku(sku, excepto_id)) return true;

    return false;
  }

  prepararDatos(datosProducto, esEdicion = false) {
    const producto = { ...datosProducto };

    producto.codigo_barras = producto.codigo_barras !== undefined ? this.limpiarTexto(producto.codigo_barras) : '';
    producto.sku = producto.sku !== undefined ? this.limpiarTexto(producto.sku) : '';
    producto.nombre = producto.nombre !== undefined ? this.limpiarTexto(producto.nombre) : '';
    producto.categoria = producto.categoria !== undefined && producto.categoria !== '' ? parseInt(producto.categoria) : '';
    producto.marca = producto.marca !== undefined ? this.limpiarTexto(producto.marca) : '';
    producto.descripcion = producto.descripcion !== undefined ? this.limpiarTexto(producto.descripcion) : '';
    producto.ubicacion = producto.ubicacion !== undefined ? this.limpiarTexto(producto.ubicacion) : '';
    producto.stock = Number(producto.stock || 0);
    producto.stock_minimo = Number(producto.stock_minimo || 5);
    producto.precio_compra = Number(producto.precio_compra || 0);
    producto.precio_venta = Number(producto.precio_venta || 0);
    producto.activo = producto.activo !== false;

    if (!producto.sku && !esEdicion) {
      producto.sku = this.generarSku();
    }

    if (!esEdicion) {
      producto.fecha_creacion = new Date().toISOString();
      producto.fecha_actualizacion = new Date().toISOString();
    } else {
      producto.fecha_actualizacion = new Date().toISOString();
    }

    return producto;
  }

  async crear(datosProducto) {
    if (!datosProducto.nombre) {
      throw new Error('El nombre es requerido');
    }

    const productoNormalizado = this.prepararDatos(datosProducto);

    if (!productoNormalizado.sku) {
      productoNormalizado.sku = this.generarSku();
    }

    if (this.existeDuplicado(productoNormalizado)) {
      throw new Error('El producto ya existe');
    }

    return this.db.create(productoNormalizado);
  }

  async actualizar(id, datosActualizacion) {
    const producto = this.obtenerPorId(id);
    if (!producto) throw new Error('Producto no encontrado');

    const productoActualizado = this.prepararDatos({ ...producto, ...datosActualizacion }, true);

    if (this.existeDuplicado(productoActualizado, id)) {
      throw new Error('El producto ya existe');
    }

    productoActualizado.fecha_creacion = producto.fecha_creacion;
    productoActualizado.fecha_actualizacion = new Date().toISOString();

    return this.db.update(id, productoActualizado);
  }

  async marcarInactivo(id) {
    return this.actualizar(id, { activo: false });
  }

  async marcarActivo(id) {
    return this.actualizar(id, { activo: true });
  }

  buscar(query) {
    const texto = String(query || '').trim().toLowerCase();
    if (!texto) {
      return this.obtenerTodos();
    }

    return this.obtenerTodos().filter(producto =>
      [producto.codigo_barras, producto.sku, producto.nombre, producto.descripcion]
        .some(valor => String(valor || '').toLowerCase().includes(texto))
    );
  }

  obtenerStockBajo() {
    return this.obtenerTodos().filter(p =>
      p.activo && p.stock <= p.stock_minimo && p.stock > 0
    );
  }

  obtenerAgotados() {
    return this.obtenerTodos().filter(p =>
      p.activo && p.stock === 0
    );
  }

  obtenerEstadisticas() {
    const todosProductos = this.obtenerTodos();
    const activos = todosProductos.filter(p => p.activo);

    return {
      totalProductos: activos.length,
      stockTotal: activos.reduce((sum, p) => sum + p.stock, 0),
      productosBajo: this.obtenerStockBajo().length,
      productosAgotados: this.obtenerAgotados().length,
      valorInventario: activos.reduce((sum, p) =>
        sum + (p.stock * p.precio_compra), 0
      )
    };
  }

  obtenerPorCategoria(categoriaId) {
    return this.obtenerTodos().filter(p =>
      p.activo && p.categoria === categoriaId
    );
  }
}

module.exports = ProductoService;
