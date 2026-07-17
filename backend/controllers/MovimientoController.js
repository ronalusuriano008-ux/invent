const MovimientoService = require('../services/MovimientoService');

const movimientoService = new MovimientoService();

class MovimientoController {
  /**
   * Obtiene todos los movimientos
   */
  static obtenerTodos(req, res) {
    try {
      let movimientos;
      if (parseInt(req.user.rol) === 1) {
        movimientos = movimientoService.obtenerTodos().reverse();
      } else {
        movimientos = movimientoService.filtrar({ usuarioId: req.user.id, soloVentas: true }).reverse();
      }
      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene los últimos N movimientos
   */
  static obtenerUltimos(req, res) {
    try {
      const { cantidad = 10 } = req.query;
      if (parseInt(req.user.rol) === 1) {
        const movimientos = movimientoService.obtenerUltimos(parseInt(cantidad));
        res.json(movimientos);
      } else {
        const movimientos = movimientoService.filtrar({ usuarioId: req.user.id, soloVentas: true }).reverse().slice(0, parseInt(cantidad));
        res.json(movimientos);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene movimientos de un producto
   */
  static obtenerPorProducto(req, res) {
    try {
      const { productoId } = req.params;
      let movimientos = movimientoService.obtenerPorProducto(parseInt(productoId));
      if (parseInt(req.user.rol) !== 1) {
        movimientos = movimientos.filter(m => Number(m.usuario_id) === Number(req.user.id) && m.es_venta === true);
      }
      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Registra una entrada de stock
   */
  static async registrarEntrada(req, res) {
    try {
      const { productoId, cantidad, motivo = '' } = req.body;

      if (!productoId || !cantidad) {
        return res.status(400).json({
          error: 'productoId y cantidad son requeridos'
        });
      }

      const movimiento = await movimientoService.registrarEntrada(
        parseInt(productoId),
        parseInt(cantidad),
        motivo,
        req.user,
        req.body.observaciones || ''
      );

      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Registra una salida de stock
   */
  static async registrarSalida(req, res) {
    try {
      const { productoId, cantidad, motivo = '' } = req.body;

      if (!productoId || !cantidad) {
        return res.status(400).json({
          error: 'productoId y cantidad son requeridos'
        });
      }

      const movimiento = await movimientoService.registrarSalida(
        parseInt(productoId),
        parseInt(cantidad),
        motivo,
        req.user,
        req.body.observaciones || ''
      );

      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Registra un ajuste de stock
   */
  static async registrarAjuste(req, res) {
    try {
      const { productoId, cantidad, motivo = '' } = req.body;

      if (!productoId || cantidad === undefined) {
        return res.status(400).json({
          error: 'productoId y cantidad son requeridos'
        });
      }

      const movimiento = await movimientoService.registrarAjuste(
        parseInt(productoId),
        parseInt(cantidad),
        motivo,
        req.user,
        req.body.observaciones || ''
      );

      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Registra una venta completa del POS
   */
  static async registrarVenta(req, res) {
    try {
      const { items = [], motivo = 'Venta POS' } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un producto en la venta' });
      }

      const movimientos = await movimientoService.registrarVenta(items, motivo, req.user, req.body.observaciones || '');
      res.status(201).json({ movimientos, total: movimientos.length });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Obtiene movimientos por tipo (ENTRADA, SALIDA, AJUSTE)
   */
  static obtenerPorTipo(req, res) {
    try {
      const { tipo } = req.params;

      if (!Object.values(MovimientoService.TIPOS).includes(tipo.toUpperCase())) {
        return res.status(400).json({ error: 'Tipo inválido' });
      }

      const movimientos = movimientoService.obtenerPorTipo(tipo.toUpperCase());
      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static filtrar(req, res) {
    try {
      const filtros = {
        usuario: req.query.usuario,
        usuarioId: req.user.rol === 2 ? req.user.id : req.query.usuarioId,
        productoId: req.query.productoId,
        categoriaId: req.query.categoriaId,
        tipo: req.query.tipo,
        motivo: req.query.motivo,
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta,
        soloVentas: req.query.soloVentas === 'true' || req.user.rol === 2
      };

      const movimientos = movimientoService.filtrar(filtros);
      res.json(movimientos.reverse());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static obtenerPropios(req, res) {
    try {
      const movimientos = movimientoService.filtrar({ usuarioId: req.user.id, soloVentas: true }).reverse();
      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static obtenerResumenDia(req, res) {
    try {
      const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
      const resumen = movimientoService.obtenerResumenDia(req.user.id, fecha);
      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static obtenerEstadisticas(req, res) {
    try {
      const filtros = {
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta,
        usuarioId: req.query.usuarioId
      };
      const estadisticas = movimientoService.obtenerEstadisticas(filtros);
      res.json(estadisticas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene valor de movimientos (entrada vs salida) de un producto
   */
  static obtenerValorMovimientos(req, res) {
    try {
      const { productoId } = req.params;
      const valor = movimientoService.obtenerValorMovimientos(parseInt(productoId));
      res.json(valor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MovimientoController;
