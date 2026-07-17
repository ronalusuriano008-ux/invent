/**
 * Middleware para manejo de errores global
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
}

/**
 * Middleware para logging de requests
 */
function loggerMiddleware(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}

/**
 * Middleware para validar JSON body
 */
function validateJsonBody(req, res, next) {
  if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) {
    return res.status(400).json({
      error: 'Content-Type debe ser application/json'
    });
  }
  next();
}

module.exports = {
  errorHandler,
  loggerMiddleware,
  validateJsonBody
};
