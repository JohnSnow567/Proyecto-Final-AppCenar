const db = require('../../models');

module.exports = {
  listarFavoritos: async (req, res) => {
    try {
      const favoritos = await db.Favorito.findAll({
        where: { id_cliente: req.session.user.id },
        include: [{
          model: db.Comercio,
          as: 'comercio',
          include: [{
            model: db.TipoComercio,
            as: 'tipoComercio'
          }]
        }]
      });

      res.render('cliente/favoritos', {
        title: 'Mis Favoritos',
        favoritos,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al listar favoritos:', error);
      res.status(500).render('error', {
        message: 'Error al cargar los comercios favoritos',
        title: 'Error'
      });
    }
  },

  agregarFavorito: async (req, res) => {
    try {
      await db.Favorito.findOrCreate({
        where: {
          id_cliente: req.session.user.id,
          id_comercio: req.params.id_comercio
        }
      });

      req.flash('success_msg', 'Comercio agregado a favoritos');
      res.redirect('back');
    } catch (error) {
      console.error('Error al agregar favorito:', error);
      req.flash('error_msg', 'Error al agregar a favoritos');
      res.redirect('back');
    }
  },

  eliminarFavorito: async (req, res) => {
    try {
      await db.Favorito.destroy({
        where: {
          id: req.params.id,
          id_cliente: req.session.user.id
        }
      });

      req.flash('success_msg', 'Comercio eliminado de favoritos');
      res.redirect('/cliente/favoritos');
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      req.flash('error_msg', 'Error al eliminar de favoritos');
      res.redirect('/cliente/favoritos');
    }
  }
};