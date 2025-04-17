const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const upload = require('../middlewares/upload');
const { checkCliente } = require('../middlewares/authMiddleware');
const { hasAddress, ownsAddress } = require('../middlewares/checkAddress');
const carritoMiddleware = require('../middlewares/carritoMiddleware');

//middleware para carrito
router.use(carritoMiddleware);

// Middleware para verificar rol de cliente
router.use(checkCliente);

// Home (ahora en la raíz)
router.get('/home', clienteController.home);

// Carrito de compras
router.post('/carrito/agregar/:id', clienteController.addToCart);
router.post('/carrito/remover/:id', clienteController.removeFromCart);
router.get('/carrito/count', clienteController.getCartCount);
router.get('/carrito', clienteController.viewCart);

// Listado de comercios
router.get('/comercios', clienteController.listarComercios);

// Catálogo
router.get('/catalogo', clienteController.catalogo);

// Pedidos
router.get('/pedidos', clienteController.listarPedidos);
router.get('/pedidos/:id', clienteController.mostrarDetallePedido);
router.post('/pedidos/confirmar', hasAddress, clienteController.confirmarPedido);

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
  .get(ownsAddress, clienteController.mostrarFormDireccion)
  .post(ownsAddress, clienteController.actualizarDireccion);
router.post('/direcciones/:id/eliminar', ownsAddress, clienteController.eliminarDireccion);

// Favoritos
router.get('/favoritos', clienteController.listarFavoritos);
router.post('/favoritos/:id_comercio/agregar', clienteController.agregarFavorito);
router.post('/favoritos/:id/eliminar', clienteController.eliminarFavorito);

//cierre de seccion
router.post('/logout', clienteController.cerrarSesion);

module.exports = router;
