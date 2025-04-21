module.exports = {
    checkDelivery: (req, res, next) => {
        if (req.session.user && req.session.user.rol === 'delivery') {
            return next();
        }
        req.flash('error_msg', 'No tienes permiso para acceder a esta página');
        res.redirect('/login');
    },
    
    checkAuth: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        req.flash('error_msg', 'Por favor inicia sesión primero');
        res.redirect('/login');
    }
};

module.exports = {
    checkDelivery: (req, res, next) => {
        if (req.session.user && req.session.user.rol === 'delivery') {
            return next();
        }
        req.flash('error_msg', 'No tienes permiso para acceder a esta página');
        res.redirect('/login');
    },
    
    checkCliente: (req, res, next) => {
        if (req.session.user && req.session.user.rol === 'cliente') {
            return next();
        }
        req.flash('error_msg', 'No tienes permiso para acceder a esta página');
        res.redirect('/login');
    },
    
    checkAuth: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        req.flash('error_msg', 'Por favor inicia sesión primero');
        res.redirect('/login');
    }
};
