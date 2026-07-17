const test = require('node:test');
const assert = require('node:assert/strict');
const ProductoService = require('../services/ProductoService');
const UsuarioService = require('../services/UsuarioService');

test('ProductoService genera SKU automáticamente y actualiza fecha de modificación', async () => {
  const service = new ProductoService();
  const producto = await service.crear({
    codigo_barras: `TEST-${Date.now()}`,
    nombre: 'Cargador Test',
    categoria: 2,
    marca: 'Test',
    descripcion: 'test',
    precio_compra: 10,
    precio_venta: 20,
    stock: 5,
    stock_minimo: 2,
    ubicacion: 'A1',
    activo: true
  });

  assert.ok(producto.sku);
  assert.ok(producto.fecha_creacion);
  const actualizado = await service.actualizar(producto.id, { nombre: 'Cargador Test 2' });
  assert.equal(actualizado.nombre, 'Cargador Test 2');
  assert.ok(actualizado.fecha_actualizacion);
});

test('UsuarioService crea contraseña hasheada y valida credenciales', async () => {
  const service = new UsuarioService();
  const suffix = Date.now();
  const usuario = await service.crear({
    usuario: `seller-${suffix}`,
    nombre: 'Vendedor',
    correo: `seller-${suffix}@test.com`,
    password: 'clave123',
    rol: 2,
    activo: true
  });

  assert.notEqual(usuario.password, 'clave123');
  const valido = await service.validarPassword('clave123', usuario.password);
  assert.equal(valido, true);
});
