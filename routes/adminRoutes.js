const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middlewares/upload');

// Dashboard y menú principal
router.get('/admin/dashboard', adminController.showDashboard);

// Listados
router.get('/admin/clientes', adminController.listClientes);
router.post('/admin/clientes/toggle/:id', adminController.toggleClientStatus);
router.get('/admin/delivery', adminController.listDelivery);
router.post('/admin/delivery/toggle/:id', adminController.toggleDeliveryStatus);
router.get('/admin/comercios', adminController.listComercios);
router.post('/admin/comercios/toggle/:id', adminController.toggleComercioStatus);


// Mantenimiento de Configuración
router.get('/admin/configuracion', adminController.showConfiguracion);
router.get('/admin/configuracion/edit', adminController.editConfiguracion);
router.post('/admin/configuracion/edit', adminController.updateConfiguracion);

// Mantenimiento de Administradores
router.get('/admin/administradores', adminController.listAdministradores);
router.get('/admin/administradores/create', adminController.showCreateAdmin);
router.post('/admin/administradores/create',  upload.single('foto'), adminController.createAdmin);
router.get('/admin/administradores/edit/:id', adminController.showEditAdmin);
router.post('/admin/administradores/edit/:id', upload.single('foto'), adminController.updateAdmin);
router.post('/admin/administradores/toggle/:id', adminController.toggleAdminStatus);

// Mantenimiento de Tipos de Comercios
router.get('/admin/tipos', adminController.listTiposComercios);
router.get('/admin/tipos/create', adminController.showCreateTipo);
router.post('/admin/tipos/create', upload.single('icono'), adminController.createTipo);
router.get('/admin/tipos/edit/:id', adminController.showEditTipo);
router.post('/admin/tipos/edit/:id', upload.single('icono'), adminController.updateTipo);
router.post('/admin/tipos/delete/:id', adminController.deleteTipo);

// Cerrar sesión
router.get('/admin/logout', adminController.logout);

module.exports = router;
