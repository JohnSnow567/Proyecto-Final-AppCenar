const db = require('../../models');

module.exports = {
  listarDirecciones: async (req, res) => {
    try {
      const direcciones = await db.Direccion.findAll({
        where: { id_cliente: req.session.user.id }
      });

      res.render('cliente/direcciones', {
        title: 'Mis Direcciones',
        direcciones,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al listar direcciones:', error);
      res.status(500).render('error', {
        message: 'Error al cargar las direcciones',
        title: 'Error'
      });
    }
  },

  mostrarFormDireccion: (req, res) => {
    res.render('cliente/formDireccion', {
      title: 'Nueva Dirección',
      direccion: null,
      user: req.session.user
    });
  },

  crearDireccion: async (req, res) => {
    try {
      await db.Direccion.create({
        id_cliente: req.session.user.id,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion
      });

      req.flash('success_msg', 'Dirección creada correctamente');
      res.redirect('/cliente/direcciones');
    } catch (error) {
      console.error('Error al crear dirección:', error);
      req.flash('error_msg', 'Error al crear la dirección');
      res.redirect('/cliente/direcciones/nueva');
    }
  },

  mostrarFormEdicion: async (req, res) => {
    try {
      const direccion = await db.Direccion.findOne({
        where: { id: req.params.id, id_cliente: req.session.user.id }
      });

      if (!direccion) {
        req.flash('error_msg', 'Dirección no encontrada');
        return res.redirect('/cliente/direcciones');
      }

      res.render('cliente/formDireccion', {
        title: 'Editar Dirección',
        direccion,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al buscar dirección:', error);
      res.status(500).render('error', {
        message: 'Error al cargar la dirección',
        title: 'Error'
      });
    }
  },

  actualizarDireccion: async (req, res) => {
    try {
      await db.Direccion.update(
        {
          nombre: req.body.nombre,
          descripcion: req.body.descripcion
        },
        { where: { id: req.params.id, id_cliente: req.session.user.id } }
      );

      req.flash('success_msg', 'Dirección actualizada correctamente');
      res.redirect('/cliente/direcciones');
    } catch (error) {
      console.error('Error al actualizar dirección:', error);
      req.flash('error_msg', 'Error al actualizar la dirección');
      res.redirect(`/cliente/direcciones/${req.params.id}/editar`);
    }
  },

  eliminarDireccion: async (req, res) => {
    try {
      await db.Direccion.destroy({
        where: { id: req.params.id, id_cliente: req.session.user.id }
      });

      req.flash('success_msg', 'Dirección eliminada correctamente');
      res.redirect('/cliente/direcciones');
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      req.flash('error_msg', 'Error al eliminar la dirección');
      res.redirect('/cliente/direcciones');
    }
  }
};