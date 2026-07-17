const test = require('node:test');
const assert = require('node:assert/strict');
const ProductoService = require('../services/ProductoService');
const MovimientoService = require('../services/MovimientoService');

test('la cola serializa ventas concurrentes para no permitir doble salida de stock', async () => {
  const productoService = new ProductoService();
  const movimientoService = new MovimientoService();

  const producto = await productoService.crear({
    codigo_barras: `QUEUE-${Date.now()}`,
    nombre: 'Producto de cola',
    categoria: 1,
    marca: 'Test',
    descripcion: 'test de cola',
    precio_compra: 10,
    precio_venta: 20,
    stock: 1,
    stock_minimo: 1,
    ubicacion: 'Z1',
    activo: true
  });

  const [primera, segunda] = await Promise.allSettled([
    movimientoService.registrarSalida(producto.id, 1, 'Venta 1', 'tester'),
    movimientoService.registrarSalida(producto.id, 1, 'Venta 2', 'tester')
  ]);

  const productoActualizado = productoService.obtenerPorId(producto.id);

  assert.equal(primera.status, 'fulfilled');
  assert.equal(segunda.status, 'rejected');
  assert.equal(productoActualizado.stock, 0);
});
