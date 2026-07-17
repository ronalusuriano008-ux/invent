const express = require('express');
const UsuarioController = require('../controllers/UsuarioController');
const { authenticateUser, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', UsuarioController.login);

router.use(authenticateUser);

router.get('/perfil', UsuarioController.perfil);
router.get('/', requireRole(1), UsuarioController.obtenerTodos);
router.get('/:id', requireRole(1), UsuarioController.obtenerPorId);
router.post('/', requireRole(1), UsuarioController.crear);
router.put('/:id', requireRole(1), UsuarioController.actualizar);
router.delete('/:id', requireRole(1), UsuarioController.eliminar);

module.exports = router;
