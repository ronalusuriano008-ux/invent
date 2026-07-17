const crypto = require('crypto');
const UsuarioService = require('../services/UsuarioService');

const usuarioService = new UsuarioService();

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const usuario = usuarioService.obtenerPorToken(token);
    if (!usuario || usuario.activo === false) {
      return res.status(401).json({ error: 'Token inválido o usuario inactivo' });
    }

    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

function requireRole(rolPermitido) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (parseInt(req.user.rol) !== parseInt(rolPermitido)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    next();
  };
}

function requireAnyRole(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    const tienePermiso = roles.some(rol => parseInt(req.user.rol) === parseInt(rol));

    if (!tienePermiso) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    next();
  };
}

module.exports = {
  authenticateUser,
  requireRole,
  requireAnyRole
};
