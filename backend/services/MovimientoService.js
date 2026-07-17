const DatabaseService = require('../database/DatabaseService');
const ProductoService = require('./ProductoService');
const UsuarioService = require('./UsuarioService');
const CategoriaService = require('./CategoriaService');

class MovimientoService {
  constructor() {
    this.db = new DatabaseService('movimientos');
    this.productoService = new ProductoService();
    this.usuarioService = new UsuarioService();
    this.categoriaService = new CategoriaService();
    this.operationQueue = Promise.resolve();
  }

  /**
   * Tipos de movimiento permitidos
   */
  static TIPOS = {
    ENTRADA: 'ENTRADA',
    SALIDA: 'SALIDA',
    AJUSTE: 'AJUSTE'
  };

  async _enqueue(operation) {
    const runOperation = this.operationQueue.then(operation, operation);
    this.operationQueue = runOperation.catch(() => {});
    return runOperation;
  }

  _normalizeUsuarioInfo(usuario) {
    if (!usuario) {
      return {
        usuario: 'admin',
        usuario_id: null,
        nombre_usuario: 'Administrador',
        rol: 1
      };
    }

    if (typeof usuario === 'string') {
      return {
        usuario,
        usuario_id: null,
        nombre_usuario: usuario,
        rol: 1
      };
    }

    return {
      usuario: usuario.usuario || usuario.nombre || 'admin',
      usuario_id: usuario.id || null,
      nombre_usuario: usuario.nombre || usuario.usuario || 'Administrador',
      rol: usuario.rol !== undefined ? parseInt(usuario.rol) : 1
    };
  }

  _buildMovimiento({ producto, tipo, cantidad, motivo, usuario, observaciones = '', detalle = '', precio_vendido = null, esVenta = false, ventaId = null }) {
    const usuarioInfo = this._normalizeUsuarioInfo(usuario);
    const fechaObjeto = new Date();
    const fecha = fechaObjeto.toISOString();
    const hora = fechaObjeto.toLocaleTimeString('es-MX', { hour12: false });
    const precioOriginal = Number(producto.precio_venta || producto.precio_compra || 0);
    const precioVendido = precio_vendido !== null ? Number(precio_vendido) : precioOriginal;
    const subtotal = Number(cantidad) * precioVendido;

    return {
      producto_id: producto.id,
      tipo,
      cantidad,
      motivo: motivo || (tipo === MovimientoService.TIPOS.ENTRADA ? 'Entrada de stock' : tipo === MovimientoService.TIPOS.SALIDA ? 'Salida de stock' : 'Ajuste de stock'),
      detalle: detalle || producto.nombre,
      fecha,
      hora,
      usuario: usuarioInfo.usuario,
      usuario_id: usuarioInfo.usuario_id,
      nombre_usuario: usuarioInfo.nombre_usuario,
      rol: usuarioInfo.rol,
      precio_original: precioOriginal,
      precio_vendido: precioVendido,
      precio_unitario: precioVendido,
      subtotal,
      total: subtotal,
      observaciones,
      producto_nombre: producto.nombre,
      categoria_id: producto.categoria,
      es_venta: Boolean(esVenta),
      venta_id: ventaId || null
    };
  }

  /**
   * Obtiene todos los movimientos
   */
  obtenerTodos() {
    return this.db.getAll();
  }

  /**
   * Obtiene un movimiento por ID
   */
  obtenerPorId(id) {
    return this.db.getById(id);
  }

  /**
   * Obtiene movimientos de un producto
   */
  obtenerPorProducto(productoId) {
    return this.db.findBy('producto_id', productoId);
  }

  /**
   * Obtiene los últimos N movimientos
   */
  obtenerUltimos(cantidad = 10) {
    const todos = this.obtenerTodos();
    return todos.reverse().slice(0, cantidad);
  }

  /**
   * Obtiene movimientos por tipo
   */
  obtenerPorTipo(tipo) {
    return this.db.findBy('tipo', tipo);
  }

  /**
   * Valida el tipo de movimiento
   */
  _validarTipo(tipo) {
    if (!Object.values(MovimientoService.TIPOS).includes(tipo)) {
      throw new Error(`Tipo de movimiento inválido: ${tipo}`);
    }
  }

  /**
   * Registra una entrada de stock
   */
  async registrarEntrada(productoId, cantidad, motivo = '', usuario = 'admin', observaciones = '') {
    return this._enqueue(async () => {
      const producto = this.productoService.obtenerPorId(productoId);
      if (!producto) throw new Error('Producto no encontrado');
      if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a 0');

      const movimiento = await this.db.create(this._buildMovimiento({
        producto,
        tipo: MovimientoService.TIPOS.ENTRADA,
        cantidad,
        motivo,
        usuario,
        observaciones
      }));

      const nuevoStock = producto.stock + cantidad;
      await this.productoService.actualizar(productoId, { stock: nuevoStock });

      return movimiento;
    });
  }

  /**
   * Registra una salida de stock
   */
  async registrarSalida(productoId, cantidad, motivo = '', usuario = 'admin', observaciones = '') {
    return this._enqueue(async () => {
      const producto = this.productoService.obtenerPorId(productoId);
      if (!producto) throw new Error('Producto no encontrado');
      if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a 0');
      if (producto.stock < cantidad) throw new Error('Stock insuficiente');

      const movimiento = await this.db.create(this._buildMovimiento({
        producto,
        tipo: MovimientoService.TIPOS.SALIDA,
        cantidad,
        motivo,
        usuario,
        observaciones
      }));

      const nuevoStock = producto.stock - cantidad;
      await this.productoService.actualizar(productoId, { stock: nuevoStock });

      return movimiento;
    });
  }

  /**
   * Registra un ajuste de stock
   */
  async registrarAjuste(productoId, cantidad, motivo = '', usuario = 'admin', observaciones = '') {
    return this._enqueue(async () => {
      const producto = this.productoService.obtenerPorId(productoId);
      if (!producto) throw new Error('Producto no encontrado');

      const nuevoStock = producto.stock + cantidad;
      if (nuevoStock < 0) throw new Error('El ajuste resultaría en stock negativo');

      const movimiento = await this.db.create(this._buildMovimiento({
        producto,
        tipo: MovimientoService.TIPOS.AJUSTE,
        cantidad,
        motivo,
        usuario,
        observaciones
      }));

      await this.productoService.actualizar(productoId, { stock: nuevoStock });

      return movimiento;
    });
  }

  /**
   * Registra una venta completa desde el POS
   */
  async registrarVenta(items, motivo = 'Venta POS', usuario = 'admin', observaciones = '') {
    return this._enqueue(async () => {
      const resultados = [];
      const listaItems = Array.isArray(items) ? items : [];
      const ventaId = `venta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      for (const item of listaItems) {
        const productoId = Number(item.productoId || item.id);
        const cantidad = Number(item.cantidad || 1);
        const producto = this.productoService.obtenerPorId(productoId);
        const precioVendido = item.precio_vendido !== undefined && item.precio_vendido !== null
          ? Number(item.precio_vendido)
          : Number(producto.precio_venta || producto.precio_compra || 0);

        if (!producto) throw new Error('Producto no encontrado');
        if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a 0');
        if (precioVendido <= 0) throw new Error('El precio de venta debe ser mayor a 0');
        if (producto.stock < cantidad) throw new Error(`Stock insuficiente para ${producto.nombre}`);

        const movimiento = await this.db.create(this._buildMovimiento({
          producto,
          tipo: MovimientoService.TIPOS.SALIDA,
          cantidad,
          motivo,
          usuario,
          observaciones,
          detalle: producto.nombre,
          precio_vendido: precioVendido,
          esVenta: true,
          ventaId
        }));

        await this.productoService.actualizar(productoId, { stock: producto.stock - cantidad });
        resultados.push({ movimiento, productoId, cantidad, precio_vendido: precioVendido, precio_original: Number(producto.precio_venta || producto.precio_compra || 0) });
      }

      return resultados;
    });
  }

  /**
   * Obtiene resumen de movimientos por fecha
   */
  obtenerResumenPorFecha(desde, hasta) {
    const movimientos = this.obtenerTodos();

    return movimientos.filter(m => {
      const fecha = new Date(m.fecha);
      return fecha >= new Date(desde) && fecha <= new Date(hasta);
    });
  }

  obtenerMovimientosUsuario(usuarioId) {
    return this.obtenerTodos().filter(m => Number(m.usuario_id) === Number(usuarioId));
  }

  obtenerResumenDia(usuarioId, fecha = new Date()) {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);
    const movimientos = this.obtenerTodos().filter(m => {
      const movimientoFecha = new Date(m.fecha);
      const esVenta = m.es_venta === true;
      const esMismoUsuario = usuarioId ? Number(m.usuario_id) === Number(usuarioId) : true;
      return esVenta && esMismoUsuario && movimientoFecha >= fechaInicio && movimientoFecha <= fechaFin;
    });

    const ventasUnicas = new Set(movimientos.map(item => item.venta_id || item.id));
    const cantidadVentas = ventasUnicas.size;
    const cantidadProductosVendidos = movimientos.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    const importeTotal = movimientos.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const horas = movimientos.map(item => item.hora).filter(Boolean);
    const horaPrimera = horas.length ? horas.reduce((prev, curr) => prev < curr ? prev : curr) : null;
    const horaUltima = horas.length ? horas.reduce((prev, curr) => prev > curr ? prev : curr) : null;

    const productoMasVendido = movimientos.reduce((acc, item) => {
      const key = item.producto_id;
      acc[key] = acc[key] || { producto_id: key, producto_nombre: item.producto_nombre || item.detalle || 'Desconocido', cantidad: 0 };
      acc[key].cantidad += Number(item.cantidad || 0);
      return acc;
    }, {});

    const mejoresProductos = Object.values(productoMasVendido).sort((a, b) => b.cantidad - a.cantidad);

    return {
      fecha: fechaInicio.toISOString().split('T')[0],
      cantidadVentas,
      cantidadProductosVendidos,
      importeTotal,
      horaPrimera,
      horaUltima,
      productoMasVendido: mejoresProductos.length ? mejoresProductos[0] : null,
      ventas: movimientos
    };
  }

  obtenerEstadisticas({ fechaDesde, fechaHasta, usuarioId } = {}) {
    const ventas = this.obtenerTodos().filter(m => m.es_venta === true);
    let resultados = ventas;

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      resultados = resultados.filter(m => new Date(m.fecha) >= desde);
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      resultados = resultados.filter(m => new Date(m.fecha) <= hasta);
    }

    if (usuarioId) {
      resultados = resultados.filter(m => Number(m.usuario_id) === Number(usuarioId));
    }

    const vendedores = {};
    const productos = {};
    const categorias = {};
    const ventasPorVendedor = {};
    let totalVendido = 0;
    let totalProductos = 0;

    resultados.forEach(m => {
      const vendedorId = m.usuario_id || m.usuario;
      const utilidad = (Number(m.precio_vendido || 0) - Number(m.precio_original || 0)) * Number(m.cantidad || 0);
      const ventaKey = m.venta_id || m.id;

      if (!vendedores[vendedorId]) {
        vendedores[vendedorId] = {
          usuario_id: m.usuario_id,
          nombre_usuario: m.nombre_usuario,
          rol: m.rol,
          totalVendido: 0,
          productosVendidos: 0,
          cantidadVentas: 0,
          utilidad: 0
        };
      }

      if (!ventasPorVendedor[vendedorId]) {
        ventasPorVendedor[vendedorId] = new Set();
      }

      if (!ventasPorVendedor[vendedorId].has(ventaKey)) {
        ventasPorVendedor[vendedorId].add(ventaKey);
        vendedores[vendedorId].cantidadVentas += 1;
      }

      vendedores[vendedorId].totalVendido += Number(m.subtotal || 0);
      vendedores[vendedorId].productosVendidos += Number(m.cantidad || 0);
      vendedores[vendedorId].utilidad += utilidad;

      const productoKey = m.producto_id;
      if (!productos[productoKey]) {
        productos[productoKey] = {
          producto_id: m.producto_id,
          producto_nombre: m.producto_nombre,
          cantidad: 0,
          totalVendido: 0,
          utilidad: 0
        };
      }
      productos[productoKey].cantidad += Number(m.cantidad || 0);
      productos[productoKey].totalVendido += Number(m.subtotal || 0);
      productos[productoKey].utilidad += utilidad;

      const categoriaKey = m.categoria_id || 'sin-categoria';
      if (!categorias[categoriaKey]) {
        const categoria = this.categoriaService.obtenerPorId(categoriaKey);
        categorias[categoriaKey] = {
          categoria_id: categoriaKey,
          categoria_nombre: categoria ? categoria.nombre : 'Sin categoría',
          cantidad: 0,
          totalVendido: 0,
          utilidad: 0
        };
      }
      categorias[categoriaKey].cantidad += Number(m.cantidad || 0);
      categorias[categoriaKey].totalVendido += Number(m.subtotal || 0);
      categorias[categoriaKey].utilidad += utilidad;

      totalVendido += Number(m.subtotal || 0);
      totalProductos += Number(m.cantidad || 0);
    });

    const vendedorList = Object.values(vendedores).map(item => ({
      ...item,
      promedioPorVenta: item.cantidadVentas > 0 ? item.totalVendido / item.cantidadVentas : 0
    }));

    const ventasUnicas = new Set(resultados.map(m => m.venta_id || m.id));

    return {
      resumen: {
        totalVendido,
        cantidadVentas: ventasUnicas.size,
        productosVendidos: totalProductos,
        promedioVenta: ventasUnicas.size > 0 ? totalVendido / ventasUnicas.size : 0
      },
      vendedores: vendedorList.sort((a, b) => b.totalVendido - a.totalVendido),
      topVendedores: vendedorList.sort((a, b) => b.totalVendido - a.totalVendido).slice(0, 5),
      topProductos: Object.values(productos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10),
      topCategorias: Object.values(categorias).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10),
      topUtilidad: Object.values(productos).sort((a, b) => b.utilidad - a.utilidad).slice(0, 10)
    };
  }

  /**
   * Obtiene valor de movimientos (entrada vs salida)
   */
  obtenerValorMovimientos(productoId) {
    const movimientos = this.obtenerPorProducto(productoId);
    const producto = this.productoService.obtenerPorId(productoId);

    let totalEntrada = 0;
    let totalSalida = 0;

    movimientos.forEach(m => {
      const valor = m.cantidad * producto.precio_compra;
      if (m.tipo === MovimientoService.TIPOS.ENTRADA) {
        totalEntrada += valor;
      } else if (m.tipo === MovimientoService.TIPOS.SALIDA) {
        totalSalida += valor;
      }
    });

    return {
      entrada: totalEntrada,
      salida: totalSalida,
      neto: totalEntrada - totalSalida
    };
  }

  /**
   * Filtra movimientos por distintos criterios
   */
  filtrar({ usuario, usuarioId, productoId, categoriaId, tipo, motivo, fechaDesde, fechaHasta, soloVentas = false }) {
    let resultados = this.obtenerTodos();

    if (soloVentas) {
      resultados = resultados.filter(m => m.es_venta === true);
    }

    if (usuarioId) {
      resultados = resultados.filter(m => Number(m.usuario_id) === Number(usuarioId));
    }

    if (usuario) {
      const texto = String(usuario).toLowerCase();
      resultados = resultados.filter(m => String(m.usuario || m.nombre_usuario || '').toLowerCase().includes(texto));
    }

    if (productoId) {
      resultados = resultados.filter(m => Number(m.producto_id) === Number(productoId));
    }

    if (categoriaId) {
      resultados = resultados.filter(m => Number(m.categoria_id) === Number(categoriaId) || Number(m.categoria) === Number(categoriaId));
    }

    if (tipo) {
      resultados = resultados.filter(m => String(m.tipo).toUpperCase() === String(tipo).toUpperCase());
    }

    if (motivo) {
      const texto = String(motivo).toLowerCase();
      resultados = resultados.filter(m => String(m.motivo || '').toLowerCase().includes(texto));
    }

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      resultados = resultados.filter(m => new Date(m.fecha) >= desde);
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      resultados = resultados.filter(m => new Date(m.fecha) <= hasta);
    }

    return resultados;
  }
}

module.exports = MovimientoService;
