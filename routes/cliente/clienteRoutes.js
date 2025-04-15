const express = require('express');
const router = express.Router();
const homeController = require('../controllers/cliente/homeController');
const perfilController = require('../controllers/cliente/perfilController');
const pedidosController = require('../controllers/cliente/pedidosController');
const direccionesController = require('../controllers/cliente/direccionesController');
const favoritosController = require('../controllers/cliente/favoritosController');
const comerciosController = require('../controllers/cliente/comerciosController');
const upload = require('../middlewares/upload');
const { checkCliente } = require('../middlewares/authMiddleware');

// Middleware para verificar rol de cliente
router.use(checkCliente);

// Home
router.get('/', homeController.home);

// Perfil
router.route('/perfil')
  .get(perfilController.mostrarPerfil)
  .post(upload.single('foto'), perfilController.actualizarPerfil);

// Pedidos
router.get('/pedidos', pedidosController.listarPedidos);
router.get('/pedidos/:id', pedidosController.detallePedido);

// Direcciones
router.get('/direcciones', direccionesController.listarDirecciones);
router.route('/direcciones/nueva')
  .get(direccionesController.mostrarFormDireccion)
  .post(direccionesController.crearDireccion);
router.route('/direcciones/:id/editar')
  .get(direccionesController.mostrarFormEdicion)
  .post(direccionesController.actualizarDireccion);
router.post('/direcciones/:id/eliminar', direccionesController.eliminarDireccion);

// Favoritos
router.get('/favoritos', favoritosController.listarFavoritos);
router.post('/favoritos/:id_comercio/agregar', favoritosController.agregarFavorito);
router.post('/favoritos/:id/eliminar', favoritosController.eliminarFavorito);

// Comercios
router.get('/comercios', comerciosController.listarComercios);
router.get('/comercios/:id', comerciosController.catalogoComercio);
router.post('/comercios/:id/agregar-producto', comerciosController.agregarProductoCarrito);
router.post('/comercios/:id/eliminar-producto', comerciosController.eliminarProductoCarrito);
router.get('/comercios/:id/confirmar', comerciosController.confirmarPedido);
router.post('/comercios/:id/finalizar', comerciosController.finalizarPedido);

module.exports = router;