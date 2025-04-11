const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middlewares/upload');

// Rutas de login
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Rutas de registro para Cliente/Delivery
router.get('/registerClienteDelivery', authController.showRegisterClienteDelivery);
router.post('/registerClienteDelivery', upload.single('foto'), authController.registerClienteDelivery);

// Rutas de registro para Comercio
router.get('/registerComercio', authController.showRegisterComercio);
router.post('/registerComercio', upload.single('logo'), authController.registerComercio);

// Rutas de restablecimiento de contraseña
router.get('/resetPassword', authController.showResetPassword);
router.post('/resetPassword', authController.processResetPasswordRequest);
router.get('/resetPassword/:token', authController.showNewPasswordForm);
router.post('/resetPassword/:token', authController.processNewPassword);

router.get('/activate/:token', authController.activateAccount);

module.exports = router;
