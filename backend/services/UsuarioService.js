const crypto = require('crypto');
const DatabaseService = require('../database/DatabaseService');

class UsuarioService {
  constructor() {
    this.db = new DatabaseService('usuarios');
    this.asegurarUsuarioBase();
  }

  asegurarUsuarioBase() {
    const usuarios = this.db.getAll();
    if (usuarios.length > 0) {
      return;
    }

    const passwordHash = this.hashPasswordSync('admin123');
    const administrador = {
      usuario: 'admin',
      nombre: 'Administrador',
      correo: 'admin@invent.com',
      password: passwordHash,
      rol: 1,
      activo: true,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    this.db.create(administrador);
  }

  hashPasswordSync(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  obtenerTodos() {
    return this.db.getAll();
  }

  obtenerPorId(id) {
    return this.db.getById(id);
  }

  obtenerPorUsuario(usuario) {
    const resultado = this.db.findBy('usuario', usuario);
    return resultado.length > 0 ? resultado[0] : null;
  }

  obtenerPorCorreo(correo) {
    const resultado = this.db.findBy('correo', correo);
    return resultado.length > 0 ? resultado[0] : null;
  }

  obtenerPorToken(token) {
    const resultado = this.db.findBy('token', token);
    return resultado.length > 0 ? resultado[0] : null;
  }

  async hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  async validarPassword(password, passwordHash) {
    if (!password || !passwordHash) return false;

    const [salt, hash] = String(passwordHash).split(':');
    if (!salt || !hash) return false;

    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return computedHash === hash;
  }

  generarToken(usuario) {
    return crypto.createHash('sha256').update(`${usuario.id}:${usuario.usuario}:${Date.now()}`).digest('hex');
  }

  async crear(datosUsuario) {
    if (!datosUsuario.usuario || !datosUsuario.password || !datosUsuario.nombre) {
      throw new Error('Usuario, nombre y contraseña son requeridos');
    }

    const existenteUsuario = this.obtenerPorUsuario(datosUsuario.usuario);
    if (existenteUsuario) {
      throw new Error('El nombre de usuario ya existe');
    }

    const existenteCorreo = this.obtenerPorCorreo(datosUsuario.correo);
    if (existenteCorreo) {
      throw new Error('El correo ya existe');
    }

    const passwordHash = await this.hashPassword(datosUsuario.password);
    const nuevoUsuario = {
      ...datosUsuario,
      password: passwordHash,
      rol: parseInt(datosUsuario.rol || 2),
      activo: datosUsuario.activo !== false,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    return this.db.create(nuevoUsuario);
  }

  async actualizar(id, datosActualizacion) {
    const usuario = this.obtenerPorId(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const datosActualizados = { ...datosActualizacion };

    if (datosActualizados.usuario) {
      const existente = this.obtenerPorUsuario(datosActualizados.usuario);
      if (existente && existente.id !== parseInt(id)) {
        throw new Error('El nombre de usuario ya existe');
      }
    }

    if (datosActualizados.correo) {
      const existente = this.obtenerPorCorreo(datosActualizados.correo);
      if (existente && existente.id !== parseInt(id)) {
        throw new Error('El correo ya existe');
      }
    }

    if (datosActualizados.password) {
      datosActualizados.password = await this.hashPassword(datosActualizados.password);
    }

    if (datosActualizados.rol !== undefined) {
      datosActualizados.rol = parseInt(datosActualizados.rol);
    }

    datosActualizados.fecha_actualizacion = new Date().toISOString();

    return this.db.update(id, datosActualizados);
  }

  async login(usuarioInput, password) {
    const usuario = this.obtenerPorUsuario(usuarioInput) || this.obtenerPorCorreo(usuarioInput);
    if (!usuario || usuario.activo === false) {
      throw new Error('Credenciales inválidas');
    }

    const valido = await this.validarPassword(password, usuario.password);
    if (!valido) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generarToken(usuario);
    const usuarioActualizado = await this.actualizar(usuario.id, { token });
    return { ...usuarioActualizado, token };
  }
}

module.exports = UsuarioService;
