(() => {
  const API_BASE = '/api';
  const DEFAULT_TIMEOUT = 15000;
  let pendingRequests = 0;

  const setLoading = (isLoading) => {
    document.documentElement.classList.toggle('api-loading', isLoading);
    document.body?.setAttribute('aria-busy', String(isLoading));
    window.dispatchEvent(new CustomEvent('invent:loading', { detail: { pending: pendingRequests } }));
  };

  const getErrorMessage = (payload, response) =>
    payload?.error || payload?.message || `No se pudo completar la solicitud (${response.status}).`;

  async function call(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);
    const token = localStorage.getItem('invent_token');
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;

    if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    pendingRequests += 1;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '');

      if (!response.ok) {
        const error = new Error(getErrorMessage(payload, response));
        error.status = response.status;
        if (response.status === 401 && !location.pathname.startsWith('/login')) {
          localStorage.removeItem('invent_token');
          localStorage.removeItem('invent_user');
          location.assign('/login');
        }
        throw error;
      }
      return payload;
    } catch (error) {
      const normalized = error.name === 'AbortError'
        ? new Error('La solicitud tardó demasiado. Verifica tu conexión e inténtalo nuevamente.')
        : error;
      window.dispatchEvent(new CustomEvent('invent:api-error', { detail: normalized }));
      throw normalized;
    } finally {
      window.clearTimeout(timeout);
      pendingRequests = Math.max(0, pendingRequests - 1);
      setLoading(pendingRequests > 0);
    }
  }

  window.inventApi = { call };
})();
