const { Direccion } = require('../models');

module.exports = {
  // Middleware para verificar que el cliente tiene al menos una dirección
  hasAddress: (req, res, next) => {
    if (!req.session.user) {
      req.flash('error_msg', 'Debes iniciar sesión');
      return res.redirect('/login');
    }

    Direccion.count({ 
      where: { id_cliente: req.session.user.id }
    })
    .then(count => {
      if (count === 0) {
        req.flash('error_msg', 'Debes tener al menos una dirección registrada');
        return res.redirect('/cliente/direcciones');
      }
      next();
    })
    .catch(error => {
      console.error('Error verificando direcciones:', error);
      req.flash('error_msg', 'Error al verificar direcciones');
      res.redirect('/cliente/home');
    });
  },

  // Middleware para verificar propiedad de una dirección específica
  ownsAddress: (req, res, next) => {
    if (!req.body.direccionId && !req.params.id) {
      return next(); // No aplica si no hay ID de dirección
    }

    const direccionId = req.body.direccionId || req.params.id;

    Direccion.findOne({
      where: {
        id: direccionId,
        id_cliente: req.session.user.id
      }
    })
    .then(direccion => {
      if (!direccion) {
        req.flash('error_msg', 'Dirección no encontrada o no pertenece a tu cuenta');
        return res.redirect('/cliente/direcciones');
      }
      req.direccion = direccion; // Adjuntar al request para reutilizar
      next();
    })
    .catch(error => {
      console.error('Error verificando dirección:', error);
      req.flash('error_msg', 'Error al verificar la dirección');
      res.redirect('/cliente/direcciones');
    });
  }
};