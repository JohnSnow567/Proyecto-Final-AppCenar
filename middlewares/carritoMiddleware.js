module.exports = (req, res, next) => {
    if (!req.session.carrito) {
        req.session.carrito = [];
    }

     // Contador de items para todas las vistas
  res.locals.carritoCount = req.session.carrito.reduce((total, item) => total + item.cantidad, 0);
  next();
};