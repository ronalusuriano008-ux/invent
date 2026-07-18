let cart = [];
let scannerBuffer = '';
let scannerTimer = null;
let processing = false;
let cameraStream = null;
let cameraTimer = null;
let html5QrcodeScanner = null;
let currentUser = null;
const toast = document.getElementById('toast');

function mostrarToast(mensaje, tipo = 'success') {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function cargarResumenDia() {
  try {
    const resumen = await apiCall('/movimientos/resumen-dia');
    document.getElementById('ventasHoy').textContent = String(resumen.cantidadVentas || 0);
    document.getElementById('productosVendidosHoy').textContent = String(resumen.cantidadProductosVendidos || 0);
    document.getElementById('totalVendidoHoy').textContent = formatearMoneda(resumen.importeTotal || 0);
    document.getElementById('primeraVentaHoy').textContent = resumen.horaPrimera || '-';
    document.getElementById('ultimaVentaHoy').textContent = resumen.horaUltima || '-';
    document.getElementById('productoMasVendidoHoy').textContent = resumen.productoMasVendido ? `${resumen.productoMasVendido.producto_nombre} (${resumen.productoMasVendido.cantidad})` : '-';
    return resumen;
  } catch (error) {
    console.warn('No se pudo cargar resumen del día:', error.message);
    return null;
  }
}

function crearReporteDia(resumen) {
  const reporte = document.createElement('div');
  reporte.style.position = 'fixed';
  reporte.style.left = '-9999px';
  reporte.style.top = '0';
  reporte.style.width = '900px';
  reporte.style.background = '#1f2937';
  reporte.style.color = '#f8fafc';
  reporte.style.padding = '32px';
  reporte.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  reporte.style.border = '1px solid #334155';
  reporte.style.boxSizing = 'border-box';
  reporte.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto;">
      <h1 style="margin-bottom: 0.5rem; font-size: 2rem; color: #60a5fa;">Reporte del día</h1>
      <p style="margin: 0.25rem 0 1.5rem; color: #94a3b8;">${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: #111827; padding: 1rem; border-radius: 16px;">
          <h2 style="margin-bottom: 0.5rem; font-size: 1rem; color: #38bdf8;">Vendedor</h2>
          <p style="font-size: 1.1rem; margin: 0;">${currentUser.nombre || currentUser.usuario}</p>
        </div>
        <div style="background: #111827; padding: 1rem; border-radius: 16px;">
          <h2 style="margin-bottom: 0.5rem; font-size: 1rem; color: #38bdf8;">Fecha</h2>
          <p style="font-size: 1.1rem; margin: 0;">${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: #111827; padding: 1rem; border-radius: 16px;">
          <p style="margin: 0 0 0.5rem; color: #94a3b8;">Cantidad de ventas</p>
          <p style="font-size: 1.5rem; margin: 0;">${resumen.cantidadVentas || 0}</p>
        </div>
        <div style="background: #111827; padding: 1rem; border-radius: 16px;">
          <p style="margin: 0 0 0.5rem; color: #94a3b8;">Productos vendidos</p>
          <p style="font-size: 1.5rem; margin: 0;">${resumen.cantidadProductosVendidos || 0}</p>
        </div>
        <div style="background: #111827; padding: 1rem; border-radius: 16px;">
          <p style="margin: 0 0 0.5rem; color: #94a3b8;">Importe total</p>
          <p style="font-size: 1.5rem; margin: 0;">${formatearMoneda(resumen.importeTotal || 0)}</p>
        </div>
      </div>
      <div style="background: #111827; padding: 1rem; border-radius: 16px; margin-bottom: 1.5rem;">
        <h2 style="margin-bottom: 0.75rem; font-size: 1rem; color: #38bdf8;">Lista resumida de ventas</h2>
        <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
          <thead>
            <tr>
              <th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #334155;">Producto</th>
              <th style="text-align:right; padding: 0.5rem; border-bottom: 1px solid #334155;">Cantidad</th>
              <th style="text-align:right; padding: 0.5rem; border-bottom: 1px solid #334155;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${resumen.ventas.slice(0, 15).map(item => `
              <tr>
                <td style="padding: 0.5rem 0;">${item.producto_nombre}</td>
                <td style="padding: 0.5rem 0; text-align:right;">${item.cantidad}</td>
                <td style="padding: 0.5rem 0; text-align:right;">${formatearMoneda(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem;">
        <div>
          <p style="margin: 0 0 0.5rem; color: #94a3b8;">Hora de inicio</p>
          <p style="font-size: 1.1rem; margin: 0;">${resumen.horaPrimera || '-'}</p>
        </div>
        <div>
          <p style="margin: 0 0 0.5rem; color: #94a3b8;">Hora de cierre</p>
          <p style="font-size: 1.1rem; margin: 0;">${resumen.horaUltima || '-'}</p>
        </div>
        <div style="width: 40%;">
          <p style="margin: 0 0 0.5rem; color: #94a3b8;">Firma</p>
          <div style="height: 56px; border: 1px solid #334155; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; color: #94a3b8;">
            FIRMA DEL VENDEDOR
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(reporte);
  return reporte;
}

async function descargarReporteDia() {
  try {
    const resumen = await cargarResumenDia();
    if (!resumen) {
      mostrarToast('No se pudo generar el reporte', 'error');
      return;
    }

    const reporte = crearReporteDia(resumen);
    const canvas = await html2canvas(reporte, { backgroundColor: '#0f172a', scale: 2 });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const enlace = document.createElement('a');
    enlace.href = dataUrl;
    enlace.download = `reporte-dia-${new Date().toISOString().split('T')[0]}.jpg`;
    enlace.click();
    reporte.remove();
    mostrarToast('Reporte del día descargado', 'success');
  } catch (error) {
    console.error('Error generando reporte:', error);
    mostrarToast('No se pudo generar el reporte', 'error');
  }
}

async function apiCall(endpoint, options = {}) {
  return window.inventApi.call(endpoint, options);
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(Number(valor || 0));
}

function calcularPrecioFinal(precioBase, descuentoPorcentaje) {
  const base = Number(precioBase || 0);
  const descuento = Math.max(0, Math.min(100, Number(descuentoPorcentaje || 0)));
  const precioConDescuento = base * (1 - descuento / 100);
  return Math.max(0.01, Number(precioConDescuento.toFixed(2)));
}

function calcularDescuentoPorcentaje(precioBase, precioFinal) {
  const base = Number(precioBase || 0);
  if (!base) return 0;
  const descuento = ((base - Number(precioFinal || 0)) / base) * 100;
  return Math.max(0, Math.min(100, Number(descuento.toFixed(2))));
}

function setProcessing(isProcessing) {
  processing = isProcessing;
  const banner = document.getElementById('processingBanner');
  const confirmButton = document.getElementById('btnConfirmarVenta');
  const cameraButton = document.getElementById('btnEscanearCamara');
  const clearButton = document.getElementById('btnLimpiarCarrito');
  const addProductButton = document.getElementById('btnAgregarProducto');
  const searchInput = document.getElementById('searchInput');
  const motivoInput = document.getElementById('motivoSalida');

  if (banner) {
    banner.classList.toggle('hidden', !isProcessing);
  }

  if (confirmButton) confirmButton.disabled = isProcessing;
  if (cameraButton) cameraButton.disabled = isProcessing;
  if (clearButton) clearButton.disabled = isProcessing;
  if (addProductButton) addProductButton.disabled = isProcessing;
  if (searchInput) searchInput.disabled = isProcessing;
  if (motivoInput) motivoInput.disabled = isProcessing;
}

function actualizarEstadoResumenDia() {
  const panel = document.getElementById('resumenDiaPanel');
  const button = document.getElementById('btnToggleResumenDia');
  if (!panel || !button) return;

  const visible = !panel.classList.contains('hidden');
  button.innerHTML = visible
    ? '<i class="fa-solid fa-folder-open" aria-hidden="true"></i> Ocultar información del día'
    : '<i class="fa-solid fa-chart-column" aria-hidden="true"></i> Ver información del día';
}

function alternarResumenDia() {
  const panel = document.getElementById('resumenDiaPanel');
  if (!panel) return;
  panel.classList.toggle('hidden');
  actualizarEstadoResumenDia();
}

function renderCart() {
  const tbody = document.getElementById('cartItems');
  if (!tbody) return;

  if (!cart.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">El carrito está vacío</td></tr>';
    document.getElementById('cantidadProductos').textContent = '0';
    document.getElementById('cantidadUnidades').textContent = '0';
    document.getElementById('subtotalVenta').textContent = '$0.00';
    document.getElementById('totalVenta').textContent = '$0.00';
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.precio_vendido * item.cantidad), 0);
  const unidades = cart.reduce((sum, item) => sum + item.cantidad, 0);

  tbody.innerHTML = cart.map(item => `
    <tr>
      <td>
        <strong>${item.nombre}</strong><br>
        <small>${item.codigo_barras || item.sku || '—'}</small>
      </td>
      <td>${item.sku || '—'}</td>
      <td>
        <div class="qty-controls">
          <button class="btn btn-small btn-secondary" data-action="decrease" data-id="${item.id}">−</button>
          <input class="qty-input" type="number" min="1" max="${item.stock}" value="${item.cantidad}" data-id="${item.id}">
          <button class="btn btn-small btn-secondary" data-action="increase" data-id="${item.id}">+</button>
        </div>
      </td>
      <td>
        <div class="price-edit">
          <label class="field-label">Precio final</label>
          <input class="price-input" type="number" min="0.01" step="0.01" value="${item.precio_vendido.toFixed(2)}" data-id="${item.id}">
          <small>Base: ${formatearMoneda(item.precio_original)}</small>
        </div>
        <div class="discount-edit">
          <label class="field-label">Desc. %</label>
          <input class="discount-input" type="number" min="0" max="100" step="1" value="${Number(item.descuento_porcentaje || 0).toFixed(0)}" data-id="${item.id}">
        </div>
      </td>
      <td>${formatearMoneda(item.precio_vendido * item.cantidad)}</td>
      <td>
        <button class="btn btn-small btn-danger" data-action="remove" data-id="${item.id}" aria-label="Quitar producto"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
      </td>
    </tr>
  `).join('');

  document.getElementById('cantidadProductos').textContent = String(cart.length);
  document.getElementById('cantidadUnidades').textContent = String(unidades);
  document.getElementById('subtotalVenta').textContent = formatearMoneda(subtotal);
  document.getElementById('totalVenta').textContent = formatearMoneda(subtotal);
}

function agregarProducto(producto, cantidad = 1) {
  if (!producto) return;
  const qty = Math.max(1, Number(cantidad || 1));
  if (producto.stock < qty) {
    mostrarToast('Stock insuficiente para ese producto', 'warning');
    return;
  }

  const existe = cart.find(item => item.id === producto.id);
  if (existe) {
    const nuevaCantidad = Math.min(producto.stock, existe.cantidad + qty);
    existe.cantidad = nuevaCantidad;
  } else {
    cart.push({
      ...producto,
      cantidad: qty,
      precio_original: Number(producto.precio_venta || producto.precio_compra || 0),
      precio_vendido: Number(producto.precio_venta || producto.precio_compra || 0),
      descuento_porcentaje: 0
    });
  }

  renderCart();
  mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
}

function ajustarCantidad(productoId, delta) {
  const item = cart.find(entry => entry.id === productoId);
  if (!item) return;
  item.cantidad = Math.max(1, Math.min(item.stock, item.cantidad + delta));
  renderCart();
}

function eliminarProducto(productoId) {
  cart = cart.filter(item => item.id !== productoId);
  renderCart();
}

async function buscarProductos(query) {
  const resultsContainer = document.getElementById('searchResults');
  if (!resultsContainer) return;

  if (!query || query.trim().length < 2) {
    resultsContainer.classList.add('hidden');
    return;
  }

  try {
    const resultados = await apiCall(`/productos/buscar?q=${encodeURIComponent(query)}`);

    if (!resultados.length) {
      resultsContainer.innerHTML = '<div class="search-result-item"><p>No se encontraron resultados</p></div>';
    } else {
      resultsContainer.innerHTML = resultados.map(producto => `
        <div class="search-result-item" data-id="${producto.id}">
          <strong>${producto.nombre}</strong><br>
          <small>${producto.codigo_barras || producto.sku} · Stock ${producto.stock}</small>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = Number(item.getAttribute('data-id'));
          const producto = resultados.find(entry => entry.id === id);
          if (producto) {
            agregarProducto(producto, 1);
            resultsContainer.classList.add('hidden');
          }
        });
      });
    }

    resultsContainer.classList.remove('hidden');
  } catch (error) {
    console.error(error);
  }
}

async function buscarProductosModal(query) {
  const resultsContainer = document.getElementById('quickAddResults');
  if (!resultsContainer) return;

  if (!query || query.trim().length < 2) {
    resultsContainer.innerHTML = '';
    resultsContainer.classList.add('hidden');
    return;
  }

  try {
    const resultados = await apiCall(`/productos/buscar?q=${encodeURIComponent(query)}`);

    if (!resultados.length) {
      resultsContainer.innerHTML = '<div class="search-result-item"><p>No se encontraron resultados</p></div>';
    } else {
      resultsContainer.innerHTML = resultados.map(producto => `
        <div class="search-result-item" data-id="${producto.id}">
          <strong>${producto.nombre}</strong><br>
          <small>${producto.codigo_barras || producto.sku} · Stock ${producto.stock}</small>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = Number(item.getAttribute('data-id'));
          const producto = resultados.find(entry => entry.id === id);
          if (producto) {
            agregarProducto(producto, 1);
            cerrarModalAgregarProducto();
          }
        });
      });
    }

    resultsContainer.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    resultsContainer.innerHTML = '<div class="search-result-item"><p>No se pudo realizar la búsqueda</p></div>';
    resultsContainer.classList.remove('hidden');
  }
}

function abrirModalAgregarProducto() {
  const modal = document.getElementById('modalAgregarProducto');
  const input = document.getElementById('quickAddSearch');
  const results = document.getElementById('quickAddResults');
  if (!modal || !input || !results) return;

  modal.classList.remove('hidden');
  input.value = '';
  results.innerHTML = '';
  results.classList.add('hidden');
  setTimeout(() => input.focus(), 60);
}

function cerrarModalAgregarProducto() {
  const modal = document.getElementById('modalAgregarProducto');
  if (!modal) return;
  modal.classList.add('hidden');
}

async function procesarCodigoBarras(codigo) {
  const texto = String(codigo || '').trim();
  if (!texto) return;

  try {
    const resultados = await apiCall(`/productos/buscar?q=${encodeURIComponent(texto)}`);
    if (!resultados.length) {
      mostrarToast('Producto no encontrado', 'warning');
      return;
    }

    agregarProducto(resultados[0], 1);
    document.getElementById('scannerStatus').textContent = `Producto agregado: ${resultados[0].nombre}`;
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

function iniciarEscaneoTeclado() {
  document.addEventListener('keydown', (event) => {
    if (processing) return;

    if (event.key === 'Enter') {
      if (scannerBuffer.trim()) {
        procesarCodigoBarras(scannerBuffer.trim());
      }
      scannerBuffer = '';
      return;
    }

    if (event.key.length === 1) {
      scannerBuffer += event.key;
      clearTimeout(scannerTimer);
      scannerTimer = setTimeout(() => {
        scannerBuffer = '';
      }, 150);
    }
  });
}

async function cargarLibreriaEscaner() {
  if (window.BarcodeDetector || window.Html5Qrcode) {
    return true;
  }

  const urls = [
    'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
    'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js'
  ];

  for (const url of urls) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
        document.head.appendChild(script);
      });
      if (window.BarcodeDetector || window.Html5Qrcode) {
        return true;
      }
    } catch (error) {
      console.warn(error.message);
    }
  }

  return Boolean(window.BarcodeDetector || window.Html5Qrcode);
}

async function abrirModalEscaner() {
  const modal = document.getElementById('modalScanner');
  const videoContainer = document.getElementById('scannerVideo');
  const infoLabel = document.getElementById('scannerInfo');
  if (!modal || !videoContainer) return;

  const compatible = await cargarLibreriaEscaner();
  if (!compatible || !navigator.mediaDevices?.getUserMedia) {
    mostrarToast('La cámara no está disponible en este navegador', 'warning');
    return;
  }

  modal.classList.remove('hidden');
  if (infoLabel) infoLabel.textContent = 'Solicitando acceso a la cámara...';
  document.getElementById('scannerStatus').textContent = 'Activando cámara...';

  try {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    if (cameraTimer) {
      clearInterval(cameraTimer);
      cameraTimer = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    cameraStream = stream;
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    videoContainer.innerHTML = '';
    videoContainer.appendChild(video);
    await video.play();

    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] }) : null;

    if (detector) {
      cameraTimer = setInterval(async () => {
        if (!detector || !video.readyState || processing) return;
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length) {
            const code = barcodes[0].rawValue;
            clearInterval(cameraTimer);
            cameraTimer = null;
            await cerrarModalEscaner();
            await procesarCodigoBarras(code);
          }
        } catch (error) {
          console.warn('No se pudo detectar el código:', error);
        }
      }, 800);
    } else if (window.Html5Qrcode) {
      videoContainer.innerHTML = '';
      html5QrcodeScanner = new window.Html5Qrcode('scannerVideo');
      cameraTimer = null;

      await html5QrcodeScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, formatsToSupport: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] },
        async (decodedText) => {
          if (!html5QrcodeScanner) return;
          await html5QrcodeScanner.stop();
          html5QrcodeScanner = null;
          await cerrarModalEscaner();
          await procesarCodigoBarras(decodedText);
        },
        (errorMessage) => {
          console.debug('Escaneo en progreso:', errorMessage);
        }
      );
    }

    if (infoLabel) infoLabel.textContent = 'Apunta el código al cuadro de la cámara.';
    document.getElementById('scannerStatus').textContent = 'Cámara lista para escanear';
  } catch (error) {
    console.error(error);
    mostrarToast('No se pudo abrir la cámara', 'warning');
    if (infoLabel) infoLabel.textContent = 'No se pudo acceder a la cámara';
  }
}

async function cerrarModalEscaner() {
  const modal = document.getElementById('modalScanner');
  const videoContainer = document.getElementById('scannerVideo');
  const infoLabel = document.getElementById('scannerInfo');

  if (cameraTimer) {
    clearInterval(cameraTimer);
    cameraTimer = null;
  }

  if (html5QrcodeScanner) {
    try {
      await html5QrcodeScanner.stop();
    } catch (error) {
      console.warn('Error deteneniendo Html5Qrcode:', error);
    }
    html5QrcodeScanner = null;
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  if (videoContainer) {
    videoContainer.innerHTML = '';
  }

  if (modal) {
    modal.classList.add('hidden');
  }

  if (infoLabel) {
    infoLabel.textContent = 'Permite el acceso a la cámara para escanear.';
  }

  document.getElementById('scannerStatus').textContent = 'Listo para escanear';
}

document.addEventListener('DOMContentLoaded', () => {
  currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  if (parseInt(currentUser.rol) !== 2) {
    window.location.href = '/';
    return;
  }

  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const confirmButton = document.getElementById('btnConfirmarVenta');
  const addProductButton = document.getElementById('btnAgregarProducto');
  const cameraButton = document.getElementById('btnEscanearCamara');
  const closeButton = document.getElementById('btnCerrarScanner');
  const closeAddProductButton = document.getElementById('btnCerrarAgregarProducto');
  const clearButton = document.getElementById('btnLimpiarCarrito');
  const cartTable = document.getElementById('cartItems');
  const quickAddSearch = document.getElementById('quickAddSearch');
  const quickAddModal = document.getElementById('modalAgregarProducto');
  const toggleResumenDiaButton = document.getElementById('btnToggleResumenDia');

  searchInput.addEventListener('input', (event) => {
    buscarProductos(event.target.value);
  });

  document.addEventListener('click', (event) => {
    if (searchInput && searchResults && !searchInput.contains(event.target) && !searchResults.contains(event.target)) {
      searchResults.classList.add('hidden');
    }

    if (quickAddModal && event.target === quickAddModal) {
      cerrarModalAgregarProducto();
    }
  });

  if (cartTable) {
    cartTable.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = Number(button.getAttribute('data-id'));
      const action = button.getAttribute('data-action');

      if (action === 'increase') {
        ajustarCantidad(id, 1);
      } else if (action === 'decrease') {
        ajustarCantidad(id, -1);
      } else if (action === 'remove') {
        eliminarProducto(id);
      }
    });
  }

  if (cartTable) {
    cartTable.addEventListener('change', (event) => {
      const input = event.target.closest('input[data-id]');
      if (!input) return;
      const id = Number(input.getAttribute('data-id'));
      const item = cart.find(entry => entry.id === id);
      if (!item) return;

      if (input.classList.contains('qty-input')) {
        item.cantidad = Math.max(1, Math.min(item.stock, Number(input.value || 1)));
      }

      if (input.classList.contains('price-input')) {
        const precioBase = item.precio_original || item.precio_vendido;
        item.precio_vendido = Math.max(0.01, Number(input.value || precioBase || 0));
        item.descuento_porcentaje = calcularDescuentoPorcentaje(precioBase, item.precio_vendido);
      }

      if (input.classList.contains('discount-input')) {
        const descuento = Math.max(0, Math.min(100, Number(input.value || 0)));
        item.descuento_porcentaje = descuento;
        item.precio_vendido = calcularPrecioFinal(item.precio_original || item.precio_vendido, descuento);
      }

      renderCart();
    });
  }

  if (quickAddSearch) {
    quickAddSearch.addEventListener('input', (event) => {
      buscarProductosModal(event.target.value);
    });
  }

  if (addProductButton) {
    addProductButton.addEventListener('click', abrirModalAgregarProducto);
  }

  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      if (processing) return;
      if (!cart.length) {
        mostrarToast('El carrito está vacío', 'warning');
        return;
      }

      setProcessing(true);
      try {
        await apiCall('/movimientos/venta', {
          method: 'POST',
          body: JSON.stringify({
            items: cart.map(item => ({
              productoId: item.id,
              cantidad: item.cantidad,
              precio_vendido: item.precio_vendido
            })),
            motivo: document.getElementById('motivoSalida').value || 'Venta POS'
          })
        });

        mostrarToast('Venta registrada correctamente', 'success');
        cart = [];
        renderCart();
        await cargarResumenDia();
      } catch (error) {
        mostrarToast(error.message, 'error');
      } finally {
        setProcessing(false);
      }
    });
  }

  if (cameraButton) {
    cameraButton.addEventListener('click', abrirModalEscaner);
  }

  if (closeButton) {
    closeButton.addEventListener('click', cerrarModalEscaner);
  }

  if (closeAddProductButton) {
    closeAddProductButton.addEventListener('click', cerrarModalAgregarProducto);
  }

  if (toggleResumenDiaButton) {
    toggleResumenDiaButton.addEventListener('click', alternarResumenDia);
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      cart = [];
      renderCart();
    });
  }

  document.getElementById('btnGenerarReporteDia')?.addEventListener('click', descargarReporteDia);
  document.getElementById('btnActualizarResumen')?.addEventListener('click', cargarResumenDia);

  iniciarEscaneoTeclado();
  renderCart();
  cargarResumenDia();
  actualizarEstadoResumenDia();
  document.getElementById('scannerStatus').textContent = 'Listo para escanear con lector USB HID o cámara';
});
