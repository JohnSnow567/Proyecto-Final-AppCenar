const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/delivery/homeController'); // Corregida la ruta
const perfilController = require('../../controllers/delivery/perfilController'); // Corregida la ruta
const upload = require('../../middlewares/upload');
const { checkDelivery } = require('../../middlewares/authMiddleware');

// Rutas del home (pedidos)
router.get('/', homeController.homeDelivery);
router.get('/pedido/:id', homeController.detallePedido);
router.post('/pedido/:id/completar', homeController.completarPedido);

// Rutas de perfil
router.route('/perfil')
    .get(perfilController.mostrarPerfil)
    .post(upload.single('foto'), perfilController.actualizarPerfil);

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;