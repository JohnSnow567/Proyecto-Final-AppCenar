module.exports = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    
    Direccion.count({ where: { id_cliente: req.session.user.id } })
      .then(count => {
        if (count === 0) {
          req.flash('error_msg', 'Debes tener al menos una dirección registrada');
          return res.redirect('/cliente/direcciones');
        }
        next();
      });
  };