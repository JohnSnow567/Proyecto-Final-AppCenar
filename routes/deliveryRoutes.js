const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const upload = require('../middlewares/upload');
const { checkDelivery } = require('../middlewares/authMiddleware');

// Middleware para verificar rol de delivery
router.use(checkDelivery);

// Rutas del home (pedidos)
router.get('/', deliveryController.homeDelivery);
router.get('/pedido/:id', deliveryController.detallePedido);
router.post('/pedido/:id/completar', deliveryController.completarPedido);

// Rutas de perfil
router.route('/perfil')
  .get(deliveryController.mostrarPerfil)
  .post(upload.single('foto'), deliveryController.actualizarPerfil);

// Ruta de logout
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