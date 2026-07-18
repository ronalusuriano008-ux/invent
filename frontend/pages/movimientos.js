// ==================== VARIABLES GLOBALES ====================
let movimientos = [];
let productos = {};

// ==================== ELEMENTOS DEL DOM (asignados en DOMContentLoaded) ====
let movimientosFiltroTipo = null;
let movimientosFiltroFecha = null;
let movimientosBtnRecargar = null;
let movimientosBtnExportar = null;
let movimientosTablaMovimientos = null;

// ==================== FUNCIONES DE UTILIDAD ====================

async function apiCall(endpoint, options = {}) {
  try {
    return await window.inventApi.call(endpoint, options);
  } catch (error) {
    mostrarToast(`Error: ${error.message}`, 'error');
    throw error;
  }
}

function mostrarToast(mensaje, tipo = 'success') {
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function formatearFecha(fecha) {
  const date = new Date(fecha);
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function obtenerBadgeMovimiento(tipo) {
  const badges = {
    ENTRADA: '<span class="badge badge-entrada"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i> Entrada</span>',
    SALIDA: '<span class="badge badge-salida"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i> Salida</span>',
    AJUSTE: '<span class="badge badge-ajuste"><i class="fa-solid fa-sliders" aria-hidden="true"></i> Ajuste</span>'
  };
  return badges[tipo] || tipo;
}

// ==================== CARGAR MOVIMIENTOS ====================

async function cargarMovimientos() {
  try {
    movimientos = await apiCall('/movimientos');
    
    // Cargar datos de productos
    const productosUnicos = [...new Set(movimientos.map(m => m.producto_id))];
    for (const productoId of productosUnicos) {
      if (!productos[productoId]) {
        const producto = await apiCall(`/productos/${productoId}`);
        productos[productoId] = producto;
      }
    }

    actualizarTabla();
    calcularResumen();
  } catch (error) {
    console.error('Error cargando movimientos:', error);
  }
}

function actualizarTabla() {
  let filtrados = movimientos;

  // Filtrar por tipo
  const tipo = movimientosFiltroTipo?.value;
  if (tipo) {
    filtrados = filtrados.filter(m => m.tipo === tipo);
  }

  // Filtrar por fecha
  const fecha = movimientosFiltroFecha?.value;
  if (fecha) {
    filtrados = filtrados.filter(m => {
      const fechaMov = new Date(m.fecha).toISOString().split('T')[0];
      return fechaMov === fecha;
    });
  }

  if (filtrados.length === 0) {
    if (movimientosTablaMovimientos) {
      movimientosTablaMovimientos.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">No hay movimientos</td>
        </tr>
      `;
    }
    return;
  }

  if (movimientosTablaMovimientos) {
    movimientosTablaMovimientos.innerHTML = filtrados.reverse().map(mov => `
    <tr>
      <td>${formatearFecha(mov.fecha)}</td>
      <td>
        <strong>${productos[mov.producto_id]?.nombre || 'Producto desconocido'}</strong>
        <br>
        <small>${productos[mov.producto_id]?.codigo_barras || 'N/A'}</small>
      </td>
      <td>${obtenerBadgeMovimiento(mov.tipo)}</td>
      <td>
        ${mov.tipo === 'SALIDA' ? '-' : '+'}${mov.cantidad}
      </td>
      <td>${mov.motivo}</td>
      <td>${mov.usuario}</td>
      <td>
        <button class="btn btn-small btn-primary" onclick="irAProducto(${mov.producto_id})">
          <i class="fa-solid fa-eye" aria-hidden="true"></i> Ver
        </button>
      </td>
    </tr>
  `).join('');
  }
}

function calcularResumen() {
  const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').length;
  const salidas = movimientos.filter(m => m.tipo === 'SALIDA').length;
  const ajustes = movimientos.filter(m => m.tipo === 'AJUSTE').length;

  document.getElementById('totalEntradas').textContent = entradas;
  document.getElementById('totalSalidas').textContent = salidas;
  document.getElementById('totalAjustes').textContent = ajustes;
}

function irAProducto(id) {
  window.location.href = `/producto/${id}`;
}

// ==================== EVENTOS ====================

// Event listeners se adjuntan en DOMContentLoaded


// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  if (parseInt(currentUser.rol) !== 1) {
    window.location.href = '/pos';
    return;
  }

  movimientosFiltroTipo = document.getElementById('filtroTipo');
  movimientosFiltroFecha = document.getElementById('filtroFecha');
  movimientosBtnRecargar = document.getElementById('btnRecargar');
  movimientosBtnExportar = document.getElementById('btnExportar');
  movimientosTablaMovimientos = document.getElementById('tablaMovimientos');

  if (movimientosFiltroTipo) movimientosFiltroTipo.addEventListener('change', actualizarTabla);
  if (movimientosFiltroFecha) movimientosFiltroFecha.addEventListener('change', actualizarTabla);

  if (movimientosBtnRecargar) {
    movimientosBtnRecargar.addEventListener('click', async () => {
      movimientosBtnRecargar.disabled = true;
      movimientosBtnRecargar.innerHTML = '<i class="fa-solid fa-rotate fa-spin" aria-hidden="true"></i> Actualizando…';

      await cargarMovimientos();

      movimientosBtnRecargar.disabled = false;
      movimientosBtnRecargar.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i> Actualizar';
      mostrarToast('Datos actualizados');
    });
  }

  if (movimientosBtnExportar) {
    movimientosBtnExportar.addEventListener('click', () => {
      if (movimientos.length === 0) {
        mostrarToast('No hay movimientos para exportar', 'warning');
        return;
      }

      // Filtrar según la vista actual
      let filtrados = movimientos;
      const tipo = movimientosFiltroTipo?.value;
      if (tipo) {
        filtrados = filtrados.filter(m => m.tipo === tipo);
      }

      // Crear CSV
      const headers = ['Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Motivo', 'Usuario'];
      const rows = filtrados.map(mov => [
        new Date(mov.fecha).toLocaleString('es-MX'),
        productos[mov.producto_id]?.nombre || 'Desconocido',
        productos[mov.producto_id]?.codigo_barras || 'N/A',
        mov.tipo,
        mov.cantidad,
        mov.motivo,
        mov.usuario
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimientos-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      mostrarToast('Archivo exportado');
    });
  }

  cargarMovimientos();
});
