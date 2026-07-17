// ==================== VARIABLES GLOBALES ====================
let productoId = null;
let producto = null;
let tipoMovimientoActual = null;


// ==================== ELEMENTOS DEL DOM (asignados en DOMContentLoaded) ====
let modalMovimiento = null;
let formMovimiento = null;

// ==================== FUNCIONES DE UTILIDAD ====================

async function apiCall(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('invent_token');
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    return await response.json();
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

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(valor);
}

function obtenerBadgeMovimiento(tipo) {
  const badges = {
    ENTRADA: '<span class="badge badge-entrada">📥 Entrada</span>',
    SALIDA: '<span class="badge badge-salida">📤 Salida</span>',
    AJUSTE: '<span class="badge badge-ajuste">⚙️ Ajuste</span>'
  };
  return badges[tipo] || tipo;
}

// ==================== CARGAR PRODUCTO ====================

async function cargarProducto() {
  try {
    // Obtener ID del producto de la URL
    const url = new URL(window.location);
    const id = url.pathname.split('/').pop();
    productoId = parseInt(id);

    if (!productoId) {
      mostrarToast('❌ ID de producto inválido', 'error');
      return;
    }

    // Obtener datos del producto
    const datos = await apiCall(`/productos/${productoId}/historial`);
    producto = datos.producto;
    const movimientos = datos.movimientos;

    // Actualizar UI
    actualizarUI(producto, movimientos);
  } catch (error) {
    console.error('Error cargando producto:', error);
  }
}

function actualizarUI(prod, movimientos) {
  // Información general
  document.getElementById('nombreProducto').textContent = prod.nombre;
  document.getElementById('codigo').textContent = prod.codigo_barras;
  document.getElementById('sku').textContent = prod.sku || '—';
  document.getElementById('nombre').textContent = prod.nombre;
  obtenerNombreCategoria(prod.categoria).then(nombre => {
    document.getElementById('categoria').textContent = nombre;
  });
  document.getElementById('marca').textContent = prod.marca || '—';
  document.getElementById('modelo').textContent = prod.modelo || '—';
  document.getElementById('descripcion').textContent = prod.descripcion || '—';
  document.getElementById('ubicacion').textContent = prod.ubicacion || '—';

  // Precios y stock
  document.getElementById('precioCompra').textContent = formatearMoneda(prod.precio_compra);
  document.getElementById('precioVenta').textContent = formatearMoneda(prod.precio_venta);
  
  const margen = ((prod.precio_venta - prod.precio_compra) / prod.precio_compra * 100).toFixed(1);
  document.getElementById('margen').textContent = `${margen}%`;

  document.getElementById('stock').textContent = prod.stock;
  document.getElementById('stockMinimo').textContent = prod.stock_minimo;

  // Estado del stock
  let estado = '✅ Stock Adecuado';
  let color = 'var(--success)';
  
  if (prod.stock === 0) {
    estado = '❌ Agotado';
    color = 'var(--danger)';
  } else if (prod.stock <= prod.stock_minimo) {
    estado = '⚠️ Stock Bajo';
    color = 'var(--warning)';
  }

  document.getElementById('estadoStock').innerHTML = `<p style="color: ${color};"><strong>${estado}</strong></p>`;

  llenarFormularioEdicion(prod);

  // Cargar historial
  cargarHistorial(movimientos);
}

async function obtenerNombreCategoria(id) {
  try {
    const categoria = await apiCall(`/categorias/${id}`);
    return categoria.nombre;
  } catch {
    return '—';
  }
}

function cargarHistorial(movimientos) {
  const tbody = document.getElementById('historialMovimientos');

  if (movimientos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay movimientos registrados</td>
      </tr>
    `;
    return;
  }

  // Calcular stock en cada movimiento (de atrás hacia adelante)
  let stockCalc = producto.stock;
  for (let i = movimientos.length - 1; i >= 0; i--) {
    const mov = movimientos[i];
    if (mov.tipo === 'ENTRADA') {
      stockCalc -= mov.cantidad;
    } else if (mov.tipo === 'SALIDA') {
      stockCalc += mov.cantidad;
    } else {
      stockCalc -= mov.cantidad;
    }
    movimientos[i].stockResultante = stockCalc;
  }

  tbody.innerHTML = movimientos.map(mov => `
    <tr>
      <td>${formatearFecha(mov.fecha)}</td>
      <td>${obtenerBadgeMovimiento(mov.tipo)}</td>
      <td>${mov.cantidad > 0 ? '+' : ''}${mov.cantidad}</td>
      <td><strong>${mov.stockResultante}</strong></td>
      <td>${mov.motivo}</td>
      <td>${mov.usuario}</td>
    </tr>
  `).join('');
}

// ==================== MODAL MOVIMIENTO ====================

function abrirModalMovimiento(tipo) {
  tipoMovimientoActual = tipo;
  
  const titulos = {
    entrada: 'Registrar Entrada de Stock',
    salida: 'Registrar Salida de Stock',
    ajuste: 'Registrar Ajuste de Stock'
  };

  document.getElementById('tituloMovimiento').textContent = titulos[tipo];
  document.getElementById('cantidadMovimiento').value = '';
  document.getElementById('motivoMovimiento').value = '';
  document.getElementById('cantidadMovimiento').min = tipo === 'ajuste' ? '-999' : '1';

  modalMovimiento.classList.remove('hidden');
}

function cerrarModalMovimiento() {
  modalMovimiento.classList.add('hidden');
  tipoMovimientoActual = null;
}

// El listener del formulario se adjunta en DOMContentLoaded

async function cargarCategorias() {
  try {
    const categorias = await apiCall('/categorias');
    const select = document.getElementById('editCategoria');
    if (select) {
      select.innerHTML = categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
    }
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

function llenarFormularioEdicion(prod) {
  const nombreInput = document.getElementById('editNombre');
  const selectCategoria = document.getElementById('editCategoria');
  const marcaInput = document.getElementById('editMarca');
  const ubicacionInput = document.getElementById('editUbicacion');
  const descripcionInput = document.getElementById('editDescripcion');
  const precioCompraInput = document.getElementById('editPrecioCompra');
  const precioVentaInput = document.getElementById('editPrecioVenta');
  const stockMinimoInput = document.getElementById('editStockMinimo');
  const activoSelect = document.getElementById('editActivo');

  if (nombreInput) nombreInput.value = prod.nombre || '';
  if (selectCategoria) selectCategoria.value = prod.categoria;
  if (marcaInput) marcaInput.value = prod.marca || '';
  if (ubicacionInput) ubicacionInput.value = prod.ubicacion || '';
  if (descripcionInput) descripcionInput.value = prod.descripcion || '';
  if (precioCompraInput) precioCompraInput.value = prod.precio_compra || 0;
  if (precioVentaInput) precioVentaInput.value = prod.precio_venta || 0;
  if (stockMinimoInput) stockMinimoInput.value = prod.stock_minimo || 0;
  if (activoSelect) activoSelect.value = String(prod.activo !== false);
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  if (parseInt(currentUser.rol) !== 1) {
    window.location.href = '/pos';
    return;
  }

  modalMovimiento = document.getElementById('modalMovimiento');
  formMovimiento = document.getElementById('formMovimiento');
  const formEditarProducto = document.getElementById('formEditarProducto');

  if (formEditarProducto) {
    formEditarProducto.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        await apiCall(`/productos/${productoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: document.getElementById('editNombre').value,
            categoria: parseInt(document.getElementById('editCategoria').value),
            marca: document.getElementById('editMarca').value,
            descripcion: document.getElementById('editDescripcion').value,
            precio_compra: parseFloat(document.getElementById('editPrecioCompra').value),
            precio_venta: parseFloat(document.getElementById('editPrecioVenta').value),
            stock_minimo: parseInt(document.getElementById('editStockMinimo').value),
            ubicacion: document.getElementById('editUbicacion').value,
            activo: document.getElementById('editActivo').value === 'true'
          })
        });

        mostrarToast('✅ Producto actualizado');
        await cargarProducto();
      } catch (error) {
        mostrarToast('❌ Error al actualizar producto', 'error');
      }
    });
  }

  if (formMovimiento) {
    formMovimiento.addEventListener('submit', async (e) => {
      e.preventDefault();

      const cantidad = parseInt(document.getElementById('cantidadMovimiento').value);
      const motivo = document.getElementById('motivoMovimiento').value;
      const usuario = document.getElementById('usuarioMovimiento').value;

      let endpoint = '';
      if (tipoMovimientoActual === 'entrada') {
        endpoint = '/movimientos/entrada';
      } else if (tipoMovimientoActual === 'salida') {
        endpoint = '/movimientos/salida';
      } else {
        endpoint = '/movimientos/ajuste';
      }

      try {
        await apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            productoId,
            cantidad,
            motivo,
            usuario
          })
        });

        mostrarToast(`✅ Movimiento registrado exitosamente`);
        cerrarModalMovimiento();
        await cargarProducto();
      } catch (error) {
        mostrarToast('❌ Error al registrar movimiento', 'error');
      }
    });
  }

  await cargarCategorias();
  cargarProducto();
});
