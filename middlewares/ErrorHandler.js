const { AppError } = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).render('error', {
      title: 'Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
  }

  // Errores de base de datos
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).render('error', {
      title: 'Error de Validación',
      message: messages.join(', ')
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).render('error', {
      title: 'Conflicto',
      message: 'El registro ya existe o viola una restricción única'
    });
  }

  // Error genérico
  res.status(500).render('error', {
    title: 'Error',
    message: 'Algo salió mal en el servidor'
  });
};