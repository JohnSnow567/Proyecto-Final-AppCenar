module.exports = {
    checkAuth: (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        next();
    },
    
    checkDelivery: (req, res, next) => {
        if (req.session.user && req.session.user.rol === 'delivery') {
            return next();
        }
        res.redirect('/login');
    },
    
    checkRole: (role) => {
        return (req, res, next) => {
            if (req.session.user && req.session.user.rol === role) {
                return next();
            }
            res.redirect('/login');
        }
    }
};
