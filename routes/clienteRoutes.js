const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const upload = require('../middlewares/upload');
const { checkCliente } = require('../middlewares/authMiddleware');

// Middleware para verificar rol de cliente
router.use(checkCliente);

// Home (ahora en la raíz)
router.get('/home', clienteController.home);

// Catálogo
router.get('/catalogo', clienteController.catalogo);

// Pedidos
router.get('/pedidos', clienteController.listarPedidos);
router.get('/pedidos/:id', clienteController.mostrarDetallePedido);

// Perfil
router.route('/perfil')
  .get(clienteController.mostrarPerfil)
  .post(upload.single('foto'), clienteController.actualizarPerfil);

// Direcciones
router.get('/direcciones', clienteController.listarDirecciones);
router.route('/direcciones/nueva')
  .get(clienteController.mostrarFormDireccion)
  .post(clienteController.crearDireccion);
router.route('/direcciones/:id/editar')
  .get(clienteController.mostrarFormDireccion)
  .post(clienteController.actualizarDireccion);
router.post('/direcciones/:id/eliminar', clienteController.eliminarDireccion);

// Favoritos
router.get('/favoritos', clienteController.listarFavoritos);
router.post('/favoritos/:id_comercio/agregar', clienteController.agregarFavorito);
router.post('/favoritos/:id/eliminar', clienteController.eliminarFavorito);

module.exports = router;