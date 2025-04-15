const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/delivery/homeController');
const perfilController = require('../../controllers/delivery/perfilController');
const upload = require('../../middlewares/upload');
const { checkDelivery } = require('../../middlewares/authMiddleware');

// Middleware para verificar rol de delivery
router.use(checkDelivery);

// Rutas del home (pedidos)
router.get('/', homeController.homeDelivery);
router.get('/pedido/:id', homeController.detallePedido);
router.post('/pedido/:id/completar', homeController.completarPedido);

// Rutas de perfil
router.route('/perfil')
    .get(perfilController.mostrarPerfil)
    .post(upload.single('foto'), perfilController.actualizarPerfil);

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.redirect('/delivery');
        }
        res.redirect('/login');
    });
});

module.exports = router;