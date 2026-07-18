const toast = document.getElementById('toast');

function mostrarToast(mensaje, tipo = 'success') {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

async function apiCall(endpoint, options = {}) {
  return window.inventApi.call(endpoint, options);
}

function habilitarBoton(boton, habilitado) {
  if (!boton) return;
  boton.disabled = !habilitado;
  boton.classList.toggle('btn-disabled', !habilitado);
}

async function cargarResumen() {
  try {
    const resumen = await apiCall('/mantenimiento/resumen');
    document.getElementById('resumenProductos').textContent = resumen.productos;
    document.getElementById('resumenCategorias').textContent = resumen.categorias;
    document.getElementById('resumenMovimientos').textContent = resumen.movimientos;
    document.getElementById('resumenUsuarios').textContent = resumen.usuarios;
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

async function cargarCategorias() {
  try {
    const categorias = await apiCall('/categorias');
    const select = document.getElementById('selectCategoriaMantenimiento');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar categoría</option>' + categorias.map(categoria => `
      <option value="${categoria.id}">${categoria.nombre}</option>
    `).join('');
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

async function ejecutarOperacion(botonId, endpoint, mensajeExito, confirmacion) {
  const boton = document.getElementById(botonId);
  if (!boton) return;
  if (confirmacion && !window.confirm(confirmacion)) return;

  try {
    habilitarBoton(boton, false);
    await apiCall(endpoint, { method: 'POST' });
    mostrarToast(mensajeExito);
    await cargarResumen();
  } catch (error) {
    mostrarToast(error.message, 'error');
  } finally {
    habilitarBoton(boton, true);
  }
}

async function eliminarProductosPorCategoria() {
  const select = document.getElementById('selectCategoriaMantenimiento');
  const categoriaId = select ? select.value : '';
  if (!categoriaId) {
    return mostrarToast('Seleccione una categoría válida', 'error');
  }

  try {
    const boton = document.getElementById('btnEliminarPorCategoria');
    if (!window.confirm('¿Desea eliminar todos los productos de esta categoría? Esta acción no se puede deshacer.')) {
      return;
    }
    habilitarBoton(boton, false);
    await apiCall(`/mantenimiento/productos/eliminar/categoria/${categoriaId}`, { method: 'POST' });
    mostrarToast('Productos de la categoría eliminados');
    await cargarResumen();
  } catch (error) {
    mostrarToast(error.message, 'error');
  } finally {
    const boton = document.getElementById('btnEliminarPorCategoria');
    habilitarBoton(boton, true);
  }
}

async function buscarHistorial() {
  try {
    const usuario = document.getElementById('filtroUsuario').value.trim();
    const tipo = document.getElementById('filtroTipo').value;
    const motivo = document.getElementById('filtroMotivo').value.trim();
    const fechaDesde = document.getElementById('filtroDesde').value;
    const fechaHasta = document.getElementById('filtroHasta').value;

    const params = new URLSearchParams();
    if (usuario) params.append('usuario', usuario);
    if (tipo) params.append('tipo', tipo);
    if (motivo) params.append('motivo', motivo);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const movimientos = await apiCall(`/movimientos/filtrar?${params.toString()}`);
    const tbody = document.getElementById('tablaHistorial');
    if (!tbody) return;

    if (!movimientos.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron movimientos</td></tr>';
      return;
    }

    tbody.innerHTML = movimientos.map(mov => `
      <tr>
        <td>${new Date(mov.fecha).toLocaleString()}</td>
        <td>${mov.producto_nombre || mov.producto || 'N/D'}</td>
        <td>${mov.tipo}</td>
        <td>${mov.cantidad}</td>
        <td>${mov.usuario || mov.nombre_usuario || 'N/D'}</td>
        <td>${mov.motivo || mov.observaciones || '-'}</td>
      </tr>
    `).join('');
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser || parseInt(currentUser.rol, 10) !== 1) {
    window.location.href = '/login';
    return;
  }

  cargarResumen();
  cargarCategorias();

  document.getElementById('btnEliminarTodosProductos')?.addEventListener('click', () => {
    ejecutarOperacion('btnEliminarTodosProductos', '/mantenimiento/productos/eliminar/todos', 'Todos los productos fueron eliminados', '¿Está seguro de eliminar todos los productos?');
  });

  document.getElementById('btnEliminarTodasCategorias')?.addEventListener('click', () => {
    ejecutarOperacion('btnEliminarTodasCategorias', '/mantenimiento/categorias/eliminar/todas', 'Todas las categorías fueron eliminadas', '¿Está seguro de eliminar todas las categorías?');
  });

  document.getElementById('btnEliminarMovimientos')?.addEventListener('click', () => {
    ejecutarOperacion('btnEliminarMovimientos', '/mantenimiento/movimientos/eliminar/todos', 'Historial de movimientos eliminado', '¿Está seguro de eliminar todo el historial de movimientos?');
  });

  document.getElementById('btnEliminarUsuariosSinAdmin')?.addEventListener('click', () => {
    ejecutarOperacion('btnEliminarUsuariosSinAdmin', '/mantenimiento/usuarios/eliminar/sin-admin', 'Usuarios no administradores eliminados', '¿Está seguro de eliminar todos los usuarios sin privilegios de administrador?');
  });

  document.getElementById('btnVaciarStock')?.addEventListener('click', () => {
    ejecutarOperacion('btnVaciarStock', '/mantenimiento/vaciar-stock', 'Stock vaciado para todos los productos', '¿Desea vaciar el stock de todos los productos?');
  });

  document.getElementById('btnEliminarInactivos')?.addEventListener('click', () => {
    ejecutarOperacion('btnEliminarInactivos', '/mantenimiento/productos/eliminar/inactivos', 'Productos inactivos eliminados', '¿Desea eliminar todos los productos inactivos?');
  });

  document.getElementById('btnRestaurarDatosPrueba')?.addEventListener('click', () => {
    ejecutarOperacion('btnRestaurarDatosPrueba', '/mantenimiento/restaurar-datos-prueba', 'Datos de prueba restaurados', '¿Desea restaurar los datos de prueba desde seed-data.json?');
  });

  document.getElementById('btnReiniciarInventario')?.addEventListener('click', () => {
    ejecutarOperacion('btnReiniciarInventario', '/mantenimiento/reiniciar-inventario', 'Inventario reiniciado', '¿Desea reiniciar el inventario y limpiar los archivos de datos?');
  });

  document.getElementById('btnEliminarPorCategoria')?.addEventListener('click', eliminarProductosPorCategoria);
  document.getElementById('btnBuscarHistorial')?.addEventListener('click', buscarHistorial);
});
