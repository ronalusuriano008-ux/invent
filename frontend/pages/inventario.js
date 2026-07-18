(() => {
  // ==================== UTILIDADES GLOBALES ====================
  let productos = [];
  let categorias = [];
  let selectedIds = new Set();
  let searchField = null;
  let filtroCategoria = null;
  let filtroActivo = null;
  let tablaProductos = null;
  let btnNuevoProducto = null;
  let btnRecargar = null;
  let btnDescargarInventario = null;
  let btnExportarExcel = null;
  let btnImportarPega = null;
  let pasteArea = null;
  let categoryList = null;
  let selectAll = null;
  let toast = null;

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
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(valor || 0);
}

function parseNumber(value) {
  const normalized = String(value || '').trim().replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function obtenerNombreCategoria(id) {
  const cat = categorias.find(c => c.id === id);
  return cat ? cat.nombre : 'Sin categoría';
}

function buildCategoryOptions() {
  return '<option value="">Todas las categorías</option>' +
    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
}

function renderCategoryPanel() {
  if (!categoryList) return;

  const totals = categorias.map(cat => {
    const items = productos.filter(p => p.categoria === cat.id);
    const activos = items.filter(p => p.activo !== false);
    const stockTotal = activos.reduce((sum, p) => sum + p.stock, 0);
    return {
      ...cat,
      total: activos.length,
      stockTotal
    };
  });

  categoryList.innerHTML = totals.map(cat => `
    <button class="category-card" type="button" data-category-id="${cat.id}">
      <strong>${cat.nombre}</strong>
      <span>${cat.total} productos</span>
      <span>${cat.stockTotal} unidades</span>
    </button>
  `).join('') || '<p>No hay categorías registradas.</p>';

  categoryList.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      filtroCategoria.value = card.dataset.categoryId;
      renderTable();
    });
  });
}

function getVisibleProducts() {
  const query = searchField.value.trim().toLowerCase();
  const categoriaId = filtroCategoria.value;
  const estado = filtroActivo.value;

  return productos.filter(producto => {
    if (categoriaId && String(producto.categoria) !== categoriaId) return false;
    if (estado === 'activo' && producto.activo === false) return false;
    if (estado === 'inactivo' && producto.activo !== false) return false;

    if (!query) return true;

    const texto = [
      producto.nombre,
      producto.sku,
      producto.codigo_barras,
      producto.marca,
      producto.descripcion,
      obtenerNombreCategoria(producto.categoria)
    ].join(' ').toLowerCase();

    return texto.includes(query);
  });
}

function buildProductRow(producto, isNew = false) {
  const rowId = isNew ? 'new' : producto.id;
  const activeChecked = producto.activo !== false ? 'checked' : '';
  const categoryOptions = categorias.map(cat => `
      <option value="${cat.id}" ${cat.id === producto.categoria ? 'selected' : ''}>${cat.nombre}</option>
    `).join('');

  return `
    <tr data-producto-id="${rowId}" class="${isNew ? 'new-row' : ''}">
      <td class="text-center">
        ${isNew ? '' : `<input type="checkbox" class="row-selector" data-id="${producto.id}" ${selectedIds.has(producto.id) ? 'checked' : ''}>`}
      </td>
      <td>
        <input class="inline-input" data-field="nombre" data-id="${rowId}" value="${producto.nombre || ''}" placeholder="Nombre" />
      </td>
      <td>
        <input class="inline-input" data-field="sku" data-id="${rowId}" value="${producto.sku || ''}" placeholder="SKU" />
      </td>
      <td>
        <input class="inline-input" data-field="codigo_barras" data-id="${rowId}" value="${producto.codigo_barras || ''}" placeholder="Código" />
      </td>
      <td>
        <select class="inline-input" data-field="categoria" data-id="${rowId}">
          <option value="">Sin categoría</option>
          ${categoryOptions}
        </select>
      </td>
      <td>
        <input class="inline-input" data-field="marca" data-id="${rowId}" value="${producto.marca || ''}" placeholder="Marca" />
      </td>
      <td>
        <input class="inline-input" data-field="precio_compra" data-id="${rowId}" value="${producto.precio_compra || 0}" type="number" step="0.01" min="0" />
      </td>
      <td>
        <input class="inline-input" data-field="precio_venta" data-id="${rowId}" value="${producto.precio_venta || 0}" type="number" step="0.01" min="0" />
      </td>
      <td>
        <input class="inline-input" data-field="stock" data-id="${rowId}" value="${producto.stock || 0}" type="number" step="1" min="0" />
      </td>
      <td>
        <input class="inline-input" data-field="stock_minimo" data-id="${rowId}" value="${producto.stock_minimo || 5}" type="number" step="1" min="0" />
      </td>
      <td>
        <input class="inline-input" data-field="ubicacion" data-id="${rowId}" value="${producto.ubicacion || ''}" placeholder="Ubicación" />
      </td>
      <td class="text-center">
        <input type="checkbox" class="inline-input" data-field="activo" data-id="${rowId}" ${activeChecked} ${isNew ? 'checked' : ''} />
      </td>
    </tr>
  `;
}

function getRowData(row) {
  const data = {};
  row.querySelectorAll('[data-field]').forEach(input => {
    const field = input.dataset.field;
    if (field === 'activo') {
      data[field] = input.checked;
    } else if (field === 'categoria') {
      data[field] = Number(input.value) || '';
    } else if (field === 'stock' || field === 'stock_minimo') {
      data[field] = Number(input.value) || 0;
    } else if (field === 'precio_compra' || field === 'precio_venta') {
      data[field] = parseNumber(input.value);
    } else {
      data[field] = input.value.trim();
    }
  });
  return data;
}

async function actualizarProducto(id, cambios) {
  try {
    const productActualizado = await apiCall(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cambios)
    });

    const indice = productos.findIndex(p => p.id === Number(id));
    if (indice !== -1) productos[indice] = productActualizado;
    mostrarToast('Producto actualizado', 'success');
    await sincronizarEstadisticas();
  } catch (error) {
    console.error(error);
  }
}

async function crearProducto(datos) {
  try {
    const nuevoProducto = await apiCall('/productos', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
    productos.unshift(nuevoProducto);
    mostrarToast(`Producto "${nuevoProducto.nombre}" creado`, 'success');
    await sincronizarEstadisticas();
    renderTable();
  } catch (error) {
    console.error(error);
  }
}

async function cargarEstadisticas() {
  try {
    return await apiCall('/productos/stats/estadisticas');
  } catch (error) {
    const activos = productos.filter(p => p.activo !== false);
    return {
      totalProductos: activos.length,
      stockTotal: activos.reduce((sum, p) => sum + p.stock, 0),
      productosBajo: activos.filter(p => p.stock <= (p.stock_minimo || 5) && p.stock > 0).length,
      valorInventario: activos.reduce((sum, p) => sum + (p.stock * p.precio_compra), 0)
    };
  }
}

async function sincronizarEstadisticas() {
  const estadisticas = await cargarEstadisticas();
  renderSummary(estadisticas);
}

function renderSummary(estadisticas) {
  document.getElementById('statTotalProductos').textContent = estadisticas.totalProductos;
  document.getElementById('statStockTotal').textContent = estadisticas.stockTotal;
  document.getElementById('statValorInventario').textContent = formatearMoneda(estadisticas.valorInventario);
  document.getElementById('statStockBajo').textContent = estadisticas.productosBajo;
}

async function guardarCelda(input) {
  const row = input.closest('tr');
  if (!row) return;
  const rowId = row.dataset.productoId;
  const datos = getRowData(row);

  if (rowId === 'new') {
    if (!datos.nombre) return;
    await crearProducto(datos);
    return;
  }

  if (input.dataset.field === 'categoria' && datos.categoria === '') {
    datos.categoria = null;
  }

  await actualizarProducto(rowId, { [input.dataset.field]: datos[input.dataset.field] });
}

function attachTableEvents() {
  tablaProductos.querySelectorAll('.inline-input').forEach(input => {
    const type = input.type;
    const eventType = type === 'checkbox' || input.tagName.toLowerCase() === 'select' ? 'change' : 'blur';
    input.addEventListener(eventType, () => guardarCelda(input));
    input.addEventListener('keydown', event => handleCellKeyDown(event, input));
  });

  tablaProductos.querySelectorAll('.row-selector').forEach(checkbox => {
    checkbox.addEventListener('change', event => {
      const id = event.target.dataset.id;
      updateSelectionCheckbox(id, event.target.checked);
      selectAll.checked = getVisibleProducts().every(producto => selectedIds.has(producto.id));
    });
  });
}

function handleCellKeyDown(event, input) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const row = input.closest('tr');
  const cells = Array.from(row.querySelectorAll('.inline-input'));
  const index = cells.indexOf(input);
  if (index === -1) return;
  const nextInput = cells[index + 1];
  if (nextInput) {
    nextInput.focus();
  } else if (row.dataset.productoId === 'new') {
    guardarCelda(input);
  }
}

function updateSelectionCheckbox(rowId, checked) {
  if (checked) {
    selectedIds.add(Number(rowId));
  } else {
    selectedIds.delete(Number(rowId));
  }
}

function addNewProductRow() {
  const newProduct = {
    nombre: '',
    sku: '',
    codigo_barras: '',
    categoria: '',
    marca: '',
    precio_compra: 0,
    precio_venta: 0,
    stock: 0,
    stock_minimo: 5,
    ubicacion: '',
    activo: true
  };
  tablaProductos.insertAdjacentHTML('beforeend', buildProductRow(newProduct, true));
}

function renderTable() {
  const visible = getVisibleProducts();
  tablaProductos.innerHTML = visible.length === 0 ? `
    <tr>
      <td colspan="12" class="text-center">No se encontraron productos.</td>
    </tr>
  ` : visible.map(producto => buildProductRow(producto)).join('');

  addNewProductRow();
  attachTableEvents();
  if (selectAll) {
    selectAll.checked = visible.length > 0 && visible.every(producto => selectedIds.has(producto.id));
  }
}

async function cargarTodo() {
  try {
    categorias = await apiCall('/categorias');
    productos = await apiCall('/productos?showInactive=true');
    filtroCategoria.innerHTML = buildCategoryOptions();
    renderCategoryPanel();
    renderTable();
    await sincronizarEstadisticas();
  } catch (error) {
    console.error('Error cargando inventario:', error);
  }
}

async function bulkUpdateSeleccion(action) {
  const ids = Array.from(selectedIds);
  if (ids.length === 0) {
    mostrarToast('Selecciona al menos un producto.', 'warning');
    return;
  }

  try {
    if (action === 'delete') {
      await Promise.all(ids.map(id => apiCall(`/productos/${id}`, { method: 'DELETE' })));
    } else {
      await Promise.all(ids.map(id => apiCall(`/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: action === 'activo' })
      })));
    }

    selectedIds.clear();
    selectAll.checked = false;
    await cargarTodo();
    mostrarToast('Acción masiva completada', 'success');
  } catch (error) {
    mostrarToast('No se pudo ejecutar la acción masiva', 'error');
    console.error(error);
  }
}

function parseImportLine(line) {
  const values = line.split(/\t|,/).map(item => item.trim());
  return {
    nombre: values[0] || '',
    precio_compra: parseNumber(values[1] || 0),
    precio_venta: parseNumber(values[2] || 0),
    stock: Number(values[3] || 0),
    categoria: values[4] || '',
    sku: values[5] || '',
    codigo_barras: values[6] || '',
    marca: values[7] || ''
  };
}

async function importarDesdePega() {
  const text = pasteArea.value.trim();
  if (!text) {
    mostrarToast('Pega datos antes de importar.', 'warning');
    return;
  }

  const lines = text.split(/\r?\n/).filter(Boolean);
  const categoryByName = new Map(categorias.map(cat => [cat.nombre.toLowerCase(), cat.id]));
  const results = await Promise.all(lines.map(async line => {
    const item = parseImportLine(line);
    if (!item.nombre) {
      return { success: false, reason: 'Nombre vacío' };
    }

    const payload = {
      nombre: item.nombre,
      precio_compra: item.precio_compra,
      precio_venta: item.precio_venta,
      stock: item.stock,
      sku: item.sku,
      codigo_barras: item.codigo_barras,
      marca: item.marca,
      categoria: categoryByName.get(item.categoria.toLowerCase()) || ''
    };

    try {
      await apiCall('/productos', { method: 'POST', body: JSON.stringify(payload) });
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }));

  const exitos = results.filter(r => r.success).length;
  const errores = results.filter(r => !r.success);

  if (exitos) {
    mostrarToast(`${exitos} productos importados correctamente`, 'success');
    pasteArea.value = '';
    await cargarTodo();
  }

  if (errores.length) {
    mostrarToast(`${errores.length} filas no se importaron`, 'warning');
  }
}

function handleSearchFilters() {
  renderTable();
}

function buildExcelRows() {
  return getVisibleProducts().map(producto => ({
    Nombre: producto.nombre || '',
    SKU: producto.sku || '',
    Código: producto.codigo_barras || '',
    Categoría: obtenerNombreCategoria(producto.categoria),
    Marca: producto.marca || '',
    'Precio compra': producto.precio_compra || 0,
    'Precio venta': producto.precio_venta || 0,
    Stock: producto.stock || 0,
    'Stock mínimo': producto.stock_minimo || 0,
    Ubicación: producto.ubicacion || '',
    Activo: producto.activo !== false ? 'Sí' : 'No'
  }));
}

function exportarInventarioExcel() {
  if (!window.XLSX) {
    mostrarToast('No se pudo cargar la librería de Excel', 'warning');
    return;
  }

  const rows = buildExcelRows();
  if (rows.length === 0) {
    mostrarToast('No hay productos para exportar.', 'warning');
    return;
  }

  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
  window.XLSX.writeFile(workbook, `inventario-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function descargarInventarioPDF() {
  if (!window.jspdf?.jsPDF) {
    mostrarToast('No se pudo cargar la librería de PDF', 'warning');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const margin = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 50;

    doc.setFontSize(18);
    doc.text('Reporte de Inventario', margin, y);
    y += 22;
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, margin, y);
    y += 24;

    const visible = getVisibleProducts();
    const headers = ['Nombre', 'SKU', 'Código', 'Categoría', 'Compra', 'Venta', 'Stock', 'Activo'];
    const columnWidths = [160, 60, 60, 90, 70, 70, 45, 50];

    doc.setFontSize(9);
    let x = margin;
    headers.forEach((title, index) => {
      doc.text(title, x, y);
      x += columnWidths[index];
    });

    y += 16;
    doc.setDrawColor(220);
    doc.line(margin, y - 6, pageWidth - margin, y - 6);

    visible.forEach(producto => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 40;
      }
      x = margin;
      const row = [
        producto.nombre,
        producto.sku || '—',
        producto.codigo_barras || '—',
        obtenerNombreCategoria(producto.categoria),
        formatearMoneda(producto.precio_compra),
        formatearMoneda(producto.precio_venta),
        String(producto.stock),
        producto.activo !== false ? 'Sí' : 'No'
      ];
      row.forEach((text, index) => {
        doc.text(String(text), x, y);
        x += columnWidths[index];
      });
      y += 16;
    });

    doc.save('inventario.pdf');
    mostrarToast('PDF descargado correctamente', 'success');
  } catch (error) {
    console.error('Error generando PDF:', error);
    mostrarToast('No se pudo generar el PDF', 'error');
  }
}

async function inicializarInventario() {
  toast = document.getElementById('toast');
  searchField = document.getElementById('searchField');
  filtroCategoria = document.getElementById('filtroCategoria');
  filtroActivo = document.getElementById('filtroActivo');
  tablaProductos = document.getElementById('tablaProductos');
  btnNuevoProducto = document.getElementById('btnNuevoProducto');
  btnRecargar = document.getElementById('btnRecargar');
  btnDescargarInventario = document.getElementById('btnDescargarInventario');
  btnExportarExcel = document.getElementById('btnExportarExcel');
  btnImportarPega = document.getElementById('btnImportarPega');
  pasteArea = document.getElementById('pasteArea');
  categoryList = document.getElementById('categoryList');
  selectAll = document.getElementById('selectAll');

  searchField.addEventListener('input', handleSearchFilters);
  filtroCategoria.addEventListener('change', handleSearchFilters);
  filtroActivo.addEventListener('change', handleSearchFilters);

  btnNuevoProducto.addEventListener('click', () => {
    renderTable();
    const nuevaFila = tablaProductos.querySelector('tr.new-row input');
    if (nuevaFila) nuevaFila.focus();
  });

  btnRecargar.addEventListener('click', async () => {
    btnRecargar.disabled = true;
    await cargarTodo();
    btnRecargar.disabled = false;
    mostrarToast('Datos actualizados', 'success');
  });

  btnDescargarInventario.addEventListener('click', descargarInventarioPDF);
  if (btnExportarExcel) {
    btnExportarExcel.addEventListener('click', exportarInventarioExcel);
  }
  btnImportarPega.addEventListener('click', importarDesdePega);

  selectAll.addEventListener('change', () => {
    const visible = getVisibleProducts();
    visible.forEach(producto => {
      if (selectAll.checked) selectedIds.add(producto.id);
      else selectedIds.delete(producto.id);
    });
    renderTable();
  });

  document.getElementById('btnMarcarActivo').addEventListener('click', () => bulkUpdateSeleccion('activo'));
  document.getElementById('btnMarcarInactivo').addEventListener('click', () => bulkUpdateSeleccion('inactivo'));
  document.getElementById('btnEliminarSeleccion').addEventListener('click', () => bulkUpdateSeleccion('delete'));

  await cargarTodo();
}

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

  await inicializarInventario();
});
})();
