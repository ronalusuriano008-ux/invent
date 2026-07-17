const test = require('node:test');
const assert = require('node:assert/strict');
const { getRedirectTarget } = require('../../frontend/utils/authRedirect');

test('no redirige al POS cuando el vendedor ya está en la página de ventas', () => {
  assert.equal(getRedirectTarget(2, '/pos'), null);
});

test('redirige a POS cuando un vendedor intenta entrar a una ruta administrativa', () => {
  assert.equal(getRedirectTarget(2, '/'), '/pos');
});
