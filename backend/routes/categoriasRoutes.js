const express = require('express');
const CategoriaController = require('../controllers/CategoriaController');
const { authenticateUser, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

// Obtener todas las categorías
router.get('/', CategoriaController.obtenerTodas);

// Obtener una categoría por ID
router.get('/:id', CategoriaController.obtenerPorId);

// Crear nueva categoría
router.post('/', requireRole(1), CategoriaController.crear);

// Actualizar categoría
router.put('/:id', requireRole(1), CategoriaController.actualizar);

// Eliminar categoría
router.delete('/:id', requireRole(1), CategoriaController.eliminar);

module.exports = router;
