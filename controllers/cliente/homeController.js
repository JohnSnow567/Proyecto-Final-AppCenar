const db = require('../../models');

module.exports = {
  home: async (req, res) => {
    try {
      const tiposComercio = await db.TipoComercio.findAll({
        attributes: ['id', 'nombre', 'icono'],
        include: [{
          model: db.Comercio,
          as: 'comercios',
          attributes: []
        }],
        group: ['TipoComercio.id']
      });

      res.render('cliente/home', {
        title: 'Inicio - Cliente',
        tiposComercio,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error en home cliente:', error);
      res.status(500).render('error', {
        message: 'Error al cargar la página de inicio',
        title: 'Error'
      });
    }
  }
};