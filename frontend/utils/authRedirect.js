(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.authRedirect = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function getRedirectTarget(rol, pathname = '') {
    const normalizedPathname = String(pathname || '').trim();

    if (parseInt(rol, 10) === 1) {
      return null;
    }

    return normalizedPathname === '/pos' ? null : '/pos';
  }

  return {
    getRedirectTarget
  };
});
