const test = require('node:test');
const assert = require('node:assert/strict');
const ProductoService = require('../services/ProductoService');
const MovimientoService = require('../services/MovimientoService');

test('registrarVenta conserva el precio original del producto y cuenta una venta por transacción', async () => {
  const productoService = new ProductoService();
  const movimientoService = new MovimientoService();
  const usuarioId = 900000 + Math.floor(Math.random() * 1000);

  const producto = await productoService.crear({
    codigo_barras: `POS-TEST-${Date.now()}-1`,
    nombre: 'Cargador POS Test 1',
    categoria: 2,
    marca: 'Test',
    descripcion: 'test pos 1',
    precio_compra: 10,
    precio_venta: 25,
    stock: 5,
    stock_minimo: 2,
    ubicacion: 'A1',
    activo: true
  });

  const producto2 = await productoService.crear({
    codigo_barras: `POS-TEST-${Date.now()}-2`,
    nombre: 'Cargador POS Test 2',
    categoria: 2,
    marca: 'Test',
    descripcion: 'test pos 2',
    precio_compra: 12,
    precio_venta: 30,
    stock: 6,
    stock_minimo: 2,
    ubicacion: 'A2',
    activo: true
  });

  const resultados = await movimientoService.registrarVenta([
    { productoId: producto.id, cantidad: 1, precio_vendido: 27 },
    { productoId: producto2.id, cantidad: 2, precio_vendido: 35 }
  ], 'Venta prueba', { id: usuarioId, nombre: 'Vendedor Test', rol: 2 }, 'observaciones');

  const productoActualizado = productoService.obtenerPorId(producto.id);
  const resumen = movimientoService.obtenerResumenDia(usuarioId, new Date());

  assert.equal(resultados[0].precio_original, 25);
  assert.equal(resultados[0].precio_vendido, 27);
  assert.equal(productoActualizado.precio_venta, 25);
  assert.equal(resumen.cantidadVentas, 1);
  assert.equal(resumen.cantidadProductosVendidos, 3);
  assert.equal(resumen.importeTotal, 97);
});
