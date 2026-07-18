const toast = document.getElementById('toast');
let vendedoresList = [];

function mostrarToast(mensaje, tipo = 'success') {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(Number(valor || 0));
}

async function apiCall(endpoint, options = {}) {
  return window.inventApi.call(endpoint, options);
}

function calcularRango(periodo) {
  const hoy = new Date();
  const desde = new Date(hoy);
  const hasta = new Date(hoy);

  switch (periodo) {
    case 'yesterday':
      desde.setDate(hoy.getDate() - 1);
      hasta.setDate(hoy.getDate() - 1);
      break;
    case 'week':
      desde.setDate(hoy.getDate() - hoy.getDay());
      break;
    case 'month':
      desde.setDate(1);
      break;
    default:
      break;
  }

  return {
    desde: desde.toISOString().split('T')[0],
    hasta: hasta.toISOString().split('T')[0]
  };
}

function actualizarFiltros() {
  const preset = document.getElementById('presetPeriodo').value;
  const fechas = calcularRango(preset);
  const desdeInput = document.getElementById('fechaDesde');
  const hastaInput = document.getElementById('fechaHasta');

  if (preset === 'range') {
    desdeInput.disabled = false;
    hastaInput.disabled = false;
    return;
  }

  desdeInput.disabled = true;
  hastaInput.disabled = true;
  desdeInput.value = fechas.desde;
  hastaInput.value = fechas.hasta;
}

async function cargarVendedores() {
  try {
    const usuarios = await apiCall('/usuarios');
    const select = document.getElementById('selectVendedor');
    if (!select) return;

    select.innerHTML = '<option value="">Todos</option>' + usuarios
      .filter(u => parseInt(u.rol, 10) === 2)
      .map(usuario => `<option value="${usuario.id}">${usuario.nombre || usuario.usuario}</option>`)
      .join('');
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

function renderEstadisticas(data) {
  document.getElementById('totalVendido').textContent = formatearMoneda(data.resumen.totalVendido || 0);
  document.getElementById('cantidadVentas').textContent = String(data.resumen.cantidadVentas || 0);
  document.getElementById('productosVendidos').textContent = String(data.resumen.productosVendidos || 0);
  document.getElementById('promedioVenta').textContent = formatearMoneda(data.resumen.promedioVenta || 0);

  const vendedoresBody = document.getElementById('tablaVendedores');
  if (vendedoresBody) {
    vendedoresBody.innerHTML = data.vendedores.length > 0
      ? data.vendedores.map(v => `
        <tr>
          <td>${v.nombre_usuario || 'N/D'}</td>
          <td>${formatearMoneda(v.totalVendido)}</td>
          <td>${v.cantidadVentas}</td>
          <td>${v.productosVendidos}</td>
          <td>${formatearMoneda(v.promedioPorVenta)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="5" class="text-center">No hay datos</td></tr>';
  }

  const topProductos = document.getElementById('listaTopProductos');
  const topCategorias = document.getElementById('listaTopCategorias');
  const topUtilidad = document.getElementById('listaTopUtilidad');

  if (topProductos) {
    topProductos.innerHTML = data.topProductos.map(item => `<li>${item.producto_nombre} (${item.cantidad})</li>`).join('') || '<li>No hay datos</li>';
  }
  if (topCategorias) {
    topCategorias.innerHTML = data.topCategorias.map(item => `<li>${item.categoria_nombre} (${item.cantidad})</li>`).join('') || '<li>No hay datos</li>';
  }
  if (topUtilidad) {
    topUtilidad.innerHTML = data.topUtilidad.map(item => `<li>${item.producto_nombre} (${formatearMoneda(item.utilidad)})</li>`).join('') || '<li>No hay datos</li>';
  }

  vendedoresList = data.vendedores;
}

async function cargarEstadisticas() {
  try {
    const usuarioId = document.getElementById('selectVendedor').value;
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const params = new URLSearchParams();

    if (usuarioId) params.append('usuarioId', usuarioId);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const data = await apiCall(`/movimientos/estadisticas?${params.toString()}`);
    renderEstadisticas(data);
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

function crearReporteAdmin(titulo) {
  const area = document.getElementById('adminReportArea');
  if (!area) return null;

  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.left = '-9999px';
  panel.style.top = '0';
  panel.style.background = '#1f2937';
  panel.style.color = '#f8fafc';
  panel.style.padding = '32px';
  panel.style.width = '1200px';
  panel.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  panel.style.boxSizing = 'border-box';
  panel.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h1 style="margin-bottom: 0.5rem; font-size: 2rem; color: #60a5fa;">${titulo}</h1>
      <p style="margin: 0 0 1.5rem; color: #94a3b8;">${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${area.innerHTML}
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

async function exportarReporteAdmin(titulo) {
  try {
    const panel = crearReporteAdmin(titulo);
    if (!panel) return;
    const canvas = await html2canvas(panel, { backgroundColor: '#0f172a', scale: 2 });
    const enlace = document.createElement('a');
    enlace.href = canvas.toDataURL('image/jpeg', 0.92);
    enlace.download = `${titulo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.jpg`;
    enlace.click();
    panel.remove();
    mostrarToast('Reporte descargado', 'success');
  } catch (error) {
    console.error(error);
    mostrarToast('No se pudo generar el reporte', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  if (parseInt(currentUser.rol, 10) !== 1) {
    window.location.href = '/pos';
    return;
  }

  const menuButton = document.getElementById('btnAdminMenu');
  const menuOverlay = document.getElementById('adminSidebarOverlay');
  const setMenuOpen = (isOpen) => {
    document.body.classList.toggle('admin-menu-open', isOpen);
    menuButton?.setAttribute('aria-expanded', String(isOpen));
    menuOverlay?.setAttribute('aria-hidden', String(!isOpen));
  };

  menuButton?.addEventListener('click', () => setMenuOpen(!document.body.classList.contains('admin-menu-open')));
  menuOverlay?.addEventListener('click', () => setMenuOpen(false));
  document.querySelectorAll('.admin-nav-link, .admin-pos-link').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  document.getElementById('presetPeriodo')?.addEventListener('change', () => {
    actualizarFiltros();
  });

  document.getElementById('btnAplicarFiltros')?.addEventListener('click', async () => {
    await cargarEstadisticas();
  });

  document.getElementById('btnExportarGeneral')?.addEventListener('click', async () => {
    await exportarReporteAdmin('Reporte general de ventas');
  });

  document.getElementById('btnExportarVendedor')?.addEventListener('click', async () => {
    const vendedor = document.getElementById('selectVendedor').selectedOptions[0]?.text || 'Reporte vendedor';
    await exportarReporteAdmin(`Reporte ${vendedor}`);
  });

  document.getElementById('btnExportarFechas')?.addEventListener('click', async () => {
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;
    const fechaLabel = desde && hasta ? `${desde} a ${hasta}` : 'rango actual';
    await exportarReporteAdmin(`Reporte por fechas ${fechaLabel}`);
  });

  await cargarVendedores();
  actualizarFiltros();
  await cargarEstadisticas();
});
