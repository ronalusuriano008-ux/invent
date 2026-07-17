// ==================== API BASE URL ====================
const API_BASE = '/api';

// ==================== ELEMENTOS DEL DOM ====================
let searchInput = null;
let searchResults = null;
let btnNuevoProducto = null;
let btnRecargar = null;
let modalProducto = null;
let formProducto = null;
let scannerStatus = null;
let btnEscanearCamara = null;
let btnCerrarScanner = null;
let modalScanner = null;
let scannerVideo = null;
let scannerInfo = null;
const toast = document.getElementById('toast');
const { getRedirectTarget } = window.authRedirect || {};
let html5QrCodeInstance = null;
let scannerEnProceso = false;
let scannerLoopTimer = null;
let scannerStream = null;
let scannerDetector = null;

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

  return false;
}

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Realiza una petición fetch a la API
 */
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
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en API call:', error);
    mostrarToast(`Error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Muestra una notificación toast
 */
function mostrarToast(mensaje, tipo = 'success') {
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/**
 * Formatea una fecha al formato legible
 */
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

/**
 * Formatea moneda
 */
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(valor);
}

/**
 * Obtiene badge de tipo de movimiento
 */
function obtenerBadgeMovimiento(tipo) {
  const badges = {
    ENTRADA: '<span class="badge badge-entrada">📥 Entrada</span>',
    SALIDA: '<span class="badge badge-salida">📤 Salida</span>',
    AJUSTE: '<span class="badge badge-ajuste">⚙️ Ajuste</span>'
  };
  return badges[tipo] || tipo;
}

function setScannerStatus(mensaje, tipo = 'idle') {
  if (!scannerStatus) return;
  scannerStatus.textContent = mensaje;
  scannerStatus.className = `scanner-status ${tipo}`;
}

async function detenerEscanerCamara() {
  if (!scannerVideo) {
    scannerEnProceso = false;
    return;
  }

  if (scannerLoopTimer) {
    clearInterval(scannerLoopTimer);
    scannerLoopTimer = null;
  }

  if (scannerStream) {
    scannerStream.getTracks().forEach(track => track.stop());
    scannerStream = null;
  }

  if (html5QrCodeInstance) {
    try {
      await html5QrCodeInstance.stop();
    } catch (error) {
      console.warn('No fue necesario detener la cámara:', error);
    }
    html5QrCodeInstance = null;
  }

  if (scannerVideo) {
    scannerVideo.innerHTML = '';
  }

  scannerDetector = null;
  scannerEnProceso = false;
}

async function abrirModalEscaner() {
  if (!modalScanner) return;

  const libreriaLista = await cargarLibreriaEscaner();
  if (!libreriaLista) {
    if (scannerInfo) {
      scannerInfo.textContent = 'No se pudo cargar una librería compatible con la cámara.';
    }
    setScannerStatus('Librería no disponible', 'error');
    mostrarToast('No se pudo cargar una librería compatible con la cámara', 'warning');
    return;
  }

  modalScanner.classList.remove('hidden');
  if (scannerInfo) {
    scannerInfo.textContent = 'Solicitando acceso a la cámara...';
  }
  setScannerStatus('Activando cámara...', 'loading');

  try {
    if (!scannerVideo) {
      throw new Error('No existe el contenedor de la cámara');
    }

    await detenerEscanerCamara();
    scannerEnProceso = true;

    if (window.BarcodeDetector && navigator.mediaDevices?.getUserMedia) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      scannerVideo.appendChild(video);

      scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = scannerStream;
      await video.play();

      scannerDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'code_39', 'upc_a', 'upc_e']
      });

      scannerLoopTimer = setInterval(async () => {
        if (!scannerEnProceso || !scannerDetector || video.readyState < 2) return;

        try {
          const barcodes = await scannerDetector.detect(video);
          if (barcodes.length > 0) {
            const codigo = barcodes[0].rawValue;
            if (codigo) {
              scannerEnProceso = false;
              clearInterval(scannerLoopTimer);
              scannerLoopTimer = null;
              await detenerEscanerCamara();
              cerrarModalEscaner();
              await procesarCodigoBarras(codigo);
            }
          }
        } catch (error) {
          console.warn('No se pudo detectar el código:', error);
        }
      }, 600);

      if (scannerInfo) {
        scannerInfo.textContent = 'Apunta el código al cuadro de la cámara.';
      }
      setScannerStatus('Cámara lista para escanear', 'success');
      return;
    }

    if (window.Html5Qrcode) {
      html5QrCodeInstance = new window.Html5Qrcode('scannerVideo');
      await html5QrCodeInstance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          if (scannerEnProceso) {
            scannerEnProceso = false;
            await detenerEscanerCamara();
            cerrarModalEscaner();
            await procesarCodigoBarras(decodedText);
          }
        },
        () => {}
      );

      if (scannerInfo) {
        scannerInfo.textContent = 'Apunta el código al cuadro de la cámara.';
      }
      setScannerStatus('Cámara lista para escanear', 'success');
      return;
    }

    throw new Error('No hay soporte compatible para la cámara');
  } catch (error) {
    console.error('Error al iniciar cámara:', error);
    if (scannerInfo) {
      scannerInfo.textContent = 'No se pudo acceder a la cámara. Revisa permisos o usa un navegador moderno.';
    }
    setScannerStatus('No se pudo abrir la cámara', 'error');
    mostrarToast('No se pudo abrir la cámara', 'warning');
  }
}

function cerrarModalEscaner() {
  if (modalScanner) {
    modalScanner.classList.add('hidden');
  }
  if (scannerInfo) {
    scannerInfo.textContent = 'Permite el acceso a la cámara para escanear.';
  }
  setScannerStatus('Listo para escanear', 'idle');
}

let listenersAttached = false;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  searchInput = document.getElementById('searchInput');
  searchResults = document.getElementById('searchResults');
  btnNuevoProducto = document.getElementById('btnNuevoProducto');
  btnRecargar = document.getElementById('btnRecargar');
  modalProducto = document.getElementById('modalProducto');
  formProducto = document.getElementById('formProducto');
  scannerStatus = document.getElementById('scannerStatus');
  btnEscanearCamara = document.getElementById('btnEscanearCamara');
  btnCerrarScanner = document.getElementById('btnCerrarScanner');
  modalScanner = document.getElementById('modalScanner');
  scannerVideo = document.getElementById('scannerVideo');
  scannerInfo = document.getElementById('scannerInfo');

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();

      if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
      }

      try {
        const resultados = await apiCall(`/productos/buscar?q=${encodeURIComponent(query)}`);

        if (resultados.length === 0) {
          searchResults.innerHTML = `
            <div class="search-result-item">
              <p>No se encontraron resultados</p>
            </div>
          `;
        } else {
          searchResults.innerHTML = resultados.map(producto => `
            <div class="search-result-item" onclick="irAProducto(${producto.id})">
              <strong>${producto.nombre}</strong><br>
              <small>Código: ${producto.codigo_barras} | SKU: ${producto.sku || 'N/A'}</small>
            </div>
          `).join('');
        }

        searchResults.classList.remove('hidden');
      } catch (error) {
        console.error('Error en búsqueda:', error);
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && searchResults && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }

  if (btnNuevoProducto && modalProducto && formProducto) {
    btnNuevoProducto.addEventListener('click', async () => {
      await abrirModalProductoDesdeCodigo();
    });
  }

  if (formProducto) {
    formProducto.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(formProducto);
      const datosProducto = {
        codigo_barras: formData.get('codigo_barras'),
        sku: formData.get('sku'),
        nombre: formData.get('nombre'),
        categoria: parseInt(formData.get('categoria')),
        marca: formData.get('marca'),
        modelo: formData.get('modelo'),
        descripcion: formData.get('descripcion'),
        precio_compra: parseFloat(formData.get('precio_compra')),
        precio_venta: parseFloat(formData.get('precio_venta')),
        stock: parseInt(formData.get('stock')) || 0,
        stock_minimo: parseInt(formData.get('stock_minimo')) || 5,
        ubicacion: formData.get('ubicacion')
      };

      try {
        const nuevoProducto = await apiCall('/productos', {
          method: 'POST',
          body: JSON.stringify(datosProducto)
        });

        mostrarToast(`✅ Producto \"${nuevoProducto.nombre}\" creado exitosamente`);
        cerrarModalProducto();
        await cargarDatos();
      } catch (error) {
        mostrarToast('❌ Error al crear el producto', 'error');
      }
    });
  }

  if (btnRecargar) {
    btnRecargar.addEventListener('click', async () => {
      btnRecargar.disabled = true;
      btnRecargar.textContent = '🔄 Recargando...';

      await cargarDatos();

      btnRecargar.disabled = false;
      btnRecargar.textContent = '🔄 Recargar';
      mostrarToast('✅ Datos recargados');
    });
  }

  if (btnEscanearCamara) {
    btnEscanearCamara.addEventListener('click', abrirModalEscaner);
  }

  if (btnCerrarScanner) {
    btnCerrarScanner.addEventListener('click', async () => {
      await detenerEscanerCamara();
      cerrarModalEscaner();
    });
  }
}

async function abrirModalProductoDesdeCodigo(codigo = '') {
  if (!modalProducto || !formProducto) return;
  await cargarCategorias();
  modalProducto.classList.remove('hidden');

  const inputCodigo = formProducto.querySelector('input[name="codigo_barras"]');
  const inputNombre = formProducto.querySelector('input[name="nombre"]');

  if (inputCodigo) {
    inputCodigo.value = codigo;
    inputCodigo.focus();
  }

  if (inputNombre && !inputNombre.value) {
    inputNombre.focus();
  }
}

async function procesarCodigoBarras(codigo) {
  const codigoLimpio = String(codigo).trim().replace(/\s+/g, '');
  if (!codigoLimpio) return;

  setScannerStatus('Buscando producto...', 'loading');

  try {
    const resultados = await apiCall(`/productos/buscar?q=${encodeURIComponent(codigoLimpio)}`);

    if (resultados.length > 0) {
      const producto = resultados[0];
      setScannerStatus(`Producto encontrado: ${producto.nombre}`, 'success');
      mostrarToast(`✅ Producto encontrado: ${producto.nombre}`, 'success');
      window.location.href = `/producto/${producto.id}`;
      return;
    }

    setScannerStatus('Producto no encontrado, abriendo alta', 'warning');
    mostrarToast('⚠️ Producto no encontrado. Se abrirá el formulario.', 'warning');

    if (modalProducto && formProducto) {
      await abrirModalProductoDesdeCodigo(codigoLimpio);
    } else {
      window.location.href = '/inventario';
    }
  } catch (error) {
    console.error('Error procesando código de barras:', error);
    setScannerStatus('Error al leer el código', 'error');
  }
}

function inicializarEscaner() {
  setScannerStatus('Listo para escanear', 'idle');
}

// ==================== BÚSQUEDA ====================

/**
 * Busca productos en tiempo real
 */
if (searchInput && searchResults) {
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }

    try {
      const resultados = await apiCall(`/productos/buscar?q=${encodeURIComponent(query)}`);

      if (resultados.length === 0) {
        searchResults.innerHTML = `
          <div class="search-result-item">
            <p>No se encontraron resultados</p>
          </div>
        `;
      } else {
        searchResults.innerHTML = resultados.map(producto => `
          <div class="search-result-item" onclick="irAProducto(${producto.id})">
            <strong>${producto.nombre}</strong><br>
            <small>Código: ${producto.codigo_barras} | SKU: ${producto.sku || 'N/A'}</small>
          </div>
        `).join('');
      }

      searchResults.classList.remove('hidden');
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  });

  /**
   * Cierra los resultados de búsqueda al hacer click fuera
   */
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add('hidden');
    }
  });
}

/**
 * Navega a la página de producto
 */
function irAProducto(id) {
  window.location.href = `/producto/${id}`;
}

// ==================== MODAL DE PRODUCTO ====================

/**
 * Abre el modal de nuevo producto
 */
if (btnNuevoProducto && modalProducto && formProducto) {
  btnNuevoProducto.addEventListener('click', async () => {
    await abrirModalProductoDesdeCodigo();
  });
}

/**
 * Cierra el modal de producto
 */
function cerrarModalProducto() {
  if (modalProducto) {
    modalProducto.classList.add('hidden');
  }
  if (formProducto) {
    formProducto.reset();
  }
  setScannerStatus('Listo para escanear', 'idle');
}

/**
 * Carga las categorías en el select
 */
async function cargarCategorias() {
  try {
    const categorias = await apiCall('/categorias');
    const selectCategoria = document.getElementById('selectCategoria');
    const filtroCategoria = document.getElementById('filtroCategoria');

    if (selectCategoria) {
      selectCategoria.innerHTML = categorias.map(cat => `
        <option value="${cat.id}">${cat.nombre}</option>
      `).join('');
    }

    if (filtroCategoria) {
      filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' + categorias.map(cat => `
        <option value="${cat.id}">${cat.nombre}</option>
      `).join('');
    }
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

/**
 * Guarda un nuevo producto
 */
if (formProducto) {
  formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(formProducto);
    const datosProducto = {
      codigo_barras: formData.get('codigo_barras'),
      sku: formData.get('sku'),
      nombre: formData.get('nombre'),
      categoria: parseInt(formData.get('categoria')),
      marca: formData.get('marca'),
      modelo: formData.get('modelo'),
      descripcion: formData.get('descripcion'),
      precio_compra: parseFloat(formData.get('precio_compra')),
      precio_venta: parseFloat(formData.get('precio_venta')),
      stock: parseInt(formData.get('stock')) || 0,
      stock_minimo: parseInt(formData.get('stock_minimo')) || 5,
      ubicacion: formData.get('ubicacion')
    };

    try {
      const nuevoProducto = await apiCall('/productos', {
        method: 'POST',
        body: JSON.stringify(datosProducto)
      });

      mostrarToast(`✅ Producto "${nuevoProducto.nombre}" creado exitosamente`);
      cerrarModalProducto();
      await cargarDatos();
    } catch (error) {
      mostrarToast('❌ Error al crear el producto', 'error');
    }
  });
}

// ==================== CARGA DE DATOS ====================

/**
 * Carga todos los datos del dashboard
 */
async function cargarDatos() {
  try {
    const stats = await apiCall('/productos/stats/estadisticas');

    const totalProductos = document.getElementById('totalProductos');
    const stockTotal = document.getElementById('stockTotal');
    const stockBajo = document.getElementById('stockBajo');
    const agotados = document.getElementById('agotados');

    if (totalProductos) totalProductos.textContent = stats.totalProductos;
    if (stockTotal) stockTotal.textContent = stats.stockTotal;
    if (stockBajo) stockBajo.textContent = stats.productosBajo;
    if (agotados) agotados.textContent = stats.productosAgotados;

    await cargarUltimosMovimientos();
    await cargarStockBajo();
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

/**
 * Carga los últimos movimientos
 */
async function cargarUltimosMovimientos() {
  try {
    const movimientos = await apiCall('/movimientos/ultimos?cantidad=10');
    const tbody = document.getElementById('ultimosMovimientos');

    if (!tbody) return;

    if (movimientos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No hay movimientos registrados</td>
        </tr>
      `;
      return;
    }

    // Obtener nombres de productos
    const productos = {};
    for (const mov of movimientos) {
      if (!productos[mov.producto_id]) {
        const producto = await apiCall(`/productos/${mov.producto_id}`);
        productos[mov.producto_id] = producto;
      }
    }

    tbody.innerHTML = movimientos.map(mov => `
      <tr>
        <td>${formatearFecha(mov.fecha)}</td>
        <td>${productos[mov.producto_id]?.nombre || 'Desconocido'}</td>
        <td>${obtenerBadgeMovimiento(mov.tipo)}</td>
        <td>${mov.cantidad}</td>
        <td>${mov.motivo}</td>
        <td>${mov.usuario}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error cargando últimos movimientos:', error);
  }
}

/**
 * Carga productos con stock bajo
 */
async function cargarStockBajo() {
  try {
    const productos = await apiCall('/productos/stats/stock-bajo');
    const tbody = document.getElementById('productosStockBajo');

    if (!tbody) return;

    if (productos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">✅ Todos los productos tienen stock adecuado</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = productos.map(producto => `
      <tr>
        <td>${producto.codigo_barras}</td>
        <td>${producto.nombre}</td>
        <td><strong>${producto.stock}</strong></td>
        <td>${producto.stock_minimo}</td>
        <td>
          <button class="btn btn-small btn-success" onclick="irAProducto(${producto.id})">
            📝 Ver
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error cargando stock bajo:', error);
  }
}

// ==================== BOTÓN RECARGAR ====================
if (btnRecargar) {
  btnRecargar.addEventListener('click', async () => {
    btnRecargar.disabled = true;
    btnRecargar.textContent = '🔄 Recargando...';

    await cargarDatos();

    btnRecargar.disabled = false;
    btnRecargar.textContent = '🔄 Recargar';
    mostrarToast('✅ Datos recargados');
  });
}

if (btnEscanearCamara) {
  btnEscanearCamara.addEventListener('click', abrirModalEscaner);
}

if (btnCerrarScanner) {
  btnCerrarScanner.addEventListener('click', async () => {
    await detenerEscanerCamara();
    cerrarModalEscaner();
  });
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  const redirectTarget = typeof getRedirectTarget === 'function'
    ? getRedirectTarget(currentUser.rol, window.location.pathname)
    : (parseInt(currentUser.rol) !== 1 && window.location.pathname !== '/pos' ? '/pos' : null);

  if (redirectTarget) {
    window.location.href = redirectTarget;
    return;
  }

  attachListeners();
  inicializarEscaner();
  cargarDatos();
  cargarCategorias();
});
