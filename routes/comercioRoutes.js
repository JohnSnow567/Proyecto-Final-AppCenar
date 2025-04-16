const express = require('express');
const router = express.Router();
const comercioController = require('../controllers/comercioController');
const upload = require('../middlewares/upload'); // Para subidas de archivos (logo, producto, etc.)

// Rutas para el "Home del Comercio" y detalle de pedido
router.get('/comercio/home', comercioController.home);
router.get('/comercio/order/:id', comercioController.orderDetail);

// Ruta para asignar delivery a pedido pendiente
router.post('/comercio/order/:id/assignDelivery', comercioController.assignDelivery);

// Rutas para el perfil del comercio
router.get('/comercio/perfil', comercioController.showPerfil);
router.post('/comercio/perfil', upload.single('logo'), comercioController.updatePerfil);

// Rutas para el mantenimiento de categorías
router.get('/comercio/categorias', comercioController.listCategorias);
router.get('/comercio/categorias/create', comercioController.showCreateCategoria);
router.post('/comercio/categorias/create', comercioController.createCategoria);
router.get('/comercio/categorias/edit/:id', comercioController.showEditCategoria);
router.post('/comercio/categorias/edit/:id', comercioController.updateCategoria);
router.post('/comercio/categorias/delete/:id', comercioController.deleteCategoria);

// Rutas para el mantenimiento de productos
router.get('/comercio/productos', comercioController.listProductos);
router.get('/comercio/productos/create', comercioController.showCreateProducto);
router.post('/comercio/productos/create', upload.single('producto'), comercioController.createProducto);
router.get('/comercio/productos/edit/:id', comercioController.showEditProducto);
router.post('/comercio/productos/edit/:id', upload.single('producto'), comercioController.updateProducto);
router.post('/comercio/productos/delete/:id', comercioController.deleteProducto);

// Ruta para cerrar sesión
router.get('/comercio/logout', comercioController.logout);

module.exports = router;
