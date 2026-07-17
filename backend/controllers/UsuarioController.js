const UsuarioService = require('../services/UsuarioService');

const usuarioService = new UsuarioService();

class UsuarioController {
  static async obtenerTodos(req, res) {
    try {
      const usuarios = usuarioService.obtenerTodos();
      res.json(usuarios.map(({ password, token, ...rest }) => rest));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = usuarioService.obtenerPorId(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { password, token, ...rest } = usuario;
      res.json(rest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async perfil(req, res) {
    try {
      const { password, token, ...rest } = req.user;
      res.json(rest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      }

      const resultado = await usuarioService.login(usuario, password);
      const { password: _password, token, ...rest } = resultado;
      res.json({ usuario: rest, token });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async crear(req, res) {
    try {
      const nuevoUsuario = await usuarioService.crear(req.body);
      const { password, token, ...rest } = nuevoUsuario;
      res.status(201).json(rest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const usuarioActualizado = await usuarioService.actualizar(id, req.body);
      const { password, token, ...rest } = usuarioActualizado;
      res.json(rest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const usuarioActualizado = await usuarioService.actualizar(id, { activo: false });
      const { password, token, ...rest } = usuarioActualizado;
      res.json(rest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UsuarioController;
