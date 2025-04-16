const { Pedido, Comercio, Usuario, Direccion, Producto, DetallePedido } = require('../models');

module.exports = {
  // Home del delivery - lista de pedidos asignados
  homeDelivery: async (req, res) => {
    try {
      const pedidos = await Pedido.findAll({
        where: { id_delivery: req.session.user.id },
        include: [
          { model: Comercio, as: 'comercio', attributes: ['id', 'nombre_comercio', 'logo'] },
          { model: Usuario, as: 'cliente', attributes: ['id', 'nombre', 'apellido'] }
        ],
        order: [['fecha_hora', 'DESC']]
      });
      
      res.render('delivery/home', { 
        user: req.session.user,
        pedidos,
        title: 'Home - Delivery'
      });
    } catch (error) {
      console.error('Error en homeDelivery:', error);
      res.status(500).render('error', { 
        message: 'Error al cargar la página del delivery',
        title: 'Error'
      });
    }
  },

  // Detalle de un pedido específico
  detallePedido: async (req, res) => {
    try {
      const pedido = await Pedido.findOne({
        where: { 
          id: req.params.id, 
          id_delivery: req.session.user.id 
        },
        include: [
          { 
            model: Comercio, 
            as: 'comercio',
            attributes: ['id', 'nombre_comercio', 'logo', 'telefono']
          },
          { 
            model: Usuario, 
            as: 'cliente',
            attributes: ['id', 'nombre', 'apellido', 'telefono'],
            include: [{ 
              model: Direccion, 
              as: 'direcciones',
              attributes: ['id', 'nombre', 'descripcion']
            }] 
          },
          { 
            model: Producto,
            through: { 
              attributes: ['cantidad'],
              as: 'pedido_producto'
            }
          }
        ]
      });

      if (!pedido) {
        return res.status(404).render('error', { 
          message: 'Pedido no encontrado',
          title: 'Error'
        });
      }

      const direccion = pedido.cliente.direcciones.find(d => d.id === pedido.id_direccion);

      res.render('delivery/detallePedido', { 
        user: req.session.user,
        pedido,
        direccion,
        title: `Pedido #${pedido.id}`
      });
    } catch (error) {
      console.error('Error en detallePedido:', error);
      res.status(500).render('error', { 
        message: 'Error al cargar el detalle del pedido',
        title: 'Error'
      });
    }
  },

  // Completar un pedido
  completarPedido: async (req, res) => {
    try {
      const pedido = await Pedido.findOne({
        where: { 
          id: req.params.id, 
          id_delivery: req.session.user.id,
          estado: 'en proceso'
        }
      });

      if (!pedido) {
        return res.status(404).render('error', { 
          message: 'Pedido no encontrado o no se puede completar',
          title: 'Error'
        });
      }

      await db.sequelize.transaction(async (t) => {
        await pedido.update({ estado: 'completado' }, { transaction: t });
        await Usuario.update(
          { estado: 'activo' }, 
          { 
            where: { id: req.session.user.id },
            transaction: t 
          }
        );
      });

      req.flash('success', 'Pedido marcado como completado');
      res.redirect('/delivery');
    } catch (error) {
      console.error('Error en completarPedido:', error);
      res.status(500).render('error', { 
        message: 'Error al completar el pedido',
        title: 'Error'
      });
    }
  },

  // Mostrar perfil del delivery
  mostrarPerfil: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.session.user.id, {
        attributes: ['id', 'nombre', 'apellido', 'correo', 'telefono', 'foto', 'usuario']
      });

      res.render('delivery/perfil', { 
        user: req.session.user,
        usuario,
        title: 'Mi Perfil'
      });
    } catch (error) {
      console.error('Error en mostrarPerfil:', error);
      res.status(500).render('error', { 
        message: 'Error al cargar el perfil',
        title: 'Error'
      });
    }
  },

  // Actualizar perfil del delivery
  actualizarPerfil: async (req, res) => {
    try {
      const { nombre, apellido, telefono, password, confirmPassword } = req.body;
      
      if (!nombre || !apellido || !telefono) {
        req.flash('error', 'Nombre, apellido y teléfono son requeridos');
        return res.redirect('/delivery/perfil');
      }

      if (password && password !== confirmPassword) {
        req.flash('error', 'Las contraseñas no coinciden');
        return res.redirect('/delivery/perfil');
      }

      const updateData = {
        nombre,
        apellido,
        telefono
      };

      if (req.file) {
        updateData.foto = `/uploads/${req.file.filename}`;
      }

      if (password) {
        updateData.contrasena = await bcrypt.hash(password, 10);
      }

      await Usuario.update(updateData, { 
        where: { id: req.session.user.id } 
      });

      req.session.user.nombre = nombre;
      req.session.user.apellido = apellido;
      req.session.user.telefono = telefono;
      if (req.file) {
        req.session.user.foto = updateData.foto;
      }

      req.flash('success', 'Perfil actualizado correctamente');
      res.redirect('/delivery/perfil');
    } catch (error) {
      console.error('Error en actualizarPerfil:', error);
      res.status(500).render('error', { 
        message: 'Error al actualizar el perfil',
        title: 'Error'
      });
    }
  }
};