const { Pedido, Comercio, Usuario, Direccion, Producto, DetallePedido, Configuracion } = require('../models');
const { DBError, AppError } = require('../utils/AppError');
const bcrypt = require('bcrypt');

module.exports = {
  // Home del delivery
  homeDelivery: async (req, res, next) => {
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
      next(new DBError('Error al cargar la página del delivery', error));
    }
  },

  // Detalle de un pedido específico
  detallePedido: async (req, res, next) => {
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
            as: 'productos',
            through: { 
              attributes: ['cantidad'],
              as: 'pedido_producto'
            }
          }
        ]
      });

      if (!pedido) {
        throw new AppError('Pedido no encontrado', 404);
      }

      const direccion = pedido.cliente.direcciones.find(d => d.id === pedido.id_direccion);
      const configuracion = await Configuracion.findOne({ where: { id: 1 } });
      const itbisPct = parseFloat(configuracion.itbis);

      const subtotal = parseFloat(pedido.subtotal);
      const itbisAmount = parseFloat((subtotal * (itbisPct / 100)).toFixed(2));
      const totalConItbis = parseFloat((subtotal + itbisAmount).toFixed(2));

      res.render('delivery/detallePedido', { 
        user: req.session.user,
        pedido,
        direccion,
        configuracion,
        itbisAmount,
        totalConItbis,
        title: `Pedido #${pedido.id}`
      });
    } catch (error) {
      next(new DBError('Error al cargar el detalle del pedido', error));
    }
  },

  // Completar un pedido
  completarPedido: async (req, res, next) => {
    try {
      const pedido = await Pedido.findOne({
        where: {
          id: req.params.id,
          id_delivery: req.session.user.id,
          estado: 'en proceso'
        }
      });

      if (!pedido) {
        throw new AppError('Pedido no encontrado o no asignado', 404);
        return res.redirect('/delivery')
      }

      await pedido.update({ estado: 'completado' });
      
      await Usuario.update(
        { disponible: true },
        { where: { id: req.session.user.id } }
      );
      
      req.flash('success', 'Pedido marcado como entregado');
      res.redirect('/delivery');
    } catch (error) {
      next(new DBError('Error al completar el pedido', error));
    }
  },

  // Mostrar perfil del delivery
  mostrarPerfil: async (req, res, next) => {
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
      next(new DBError('Error al cargar el perfil', error));
    }
  },

  // Actualizar perfil del delivery
  actualizarPerfil: async (req, res, next) => {
    try {
      const { nombre, apellido, telefono, password, confirmPassword } = req.body;
      
      if (!nombre || !apellido || !telefono) {
        throw new AppError('Nombre, apellido y teléfono son requeridos', 400);
      }

      if (password && password !== confirmPassword) {
        throw new AppError('Las contraseñas no coinciden', 400);
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
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        req.flash('error', messages.join(', '));
        return res.redirect('/delivery/perfil');
      }
      next(new DBError('Error al actualizar el perfil', error));
    }
  }
};