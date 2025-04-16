const { TipoComercio, Comercio, Direccion, Favorito, Pedido, Producto, Categoria, Usuario } = require('../models');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Helper para calcular totales del carrito
const calculateTotals = (carrito, itbisPercent) => {
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const itbis = subtotal * (itbisPercent / 100);
  const total = subtotal + itbis;
  return { subtotal, itbis, total };
};

module.exports = {
  // Home del cliente
  home: async (req, res) => {
    try {
      const tiposComercio = await TipoComercio.findAll({
        attributes: ['id', 'nombre', 'icono'],
        include: [{
          model: Comercio,
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
  },

  // Listar direcciones del cliente
  listarDirecciones: async (req, res) => {
    try {
      const direcciones = await Direccion.findAll({
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

  // Mostrar formulario de dirección (crear/editar)
  mostrarFormDireccion: (req, res) => {
    res.render('cliente/formDireccion', {
      title: req.params.id ? 'Editar Dirección' : 'Nueva Dirección',
      direccion: null,
      user: req.session.user
    });
  },

  // Crear nueva dirección
  crearDireccion: async (req, res) => {
    try {
      await Direccion.create({
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

  // Actualizar dirección existente
  actualizarDireccion: async (req, res) => {
    try {
      await Direccion.update(
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

  // Eliminar dirección
  eliminarDireccion: async (req, res) => {
    try {
      await Direccion.destroy({
        where: { id: req.params.id, id_cliente: req.session.user.id }
      });

      req.flash('success_msg', 'Dirección eliminada correctamente');
      res.redirect('/cliente/direcciones');
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      req.flash('error_msg', 'Error al eliminar la dirección');
      res.redirect('/cliente/direcciones');
    }
  },

  // Listar favoritos del cliente
  listarFavoritos: async (req, res) => {
    try {
      const favoritos = await Favorito.findAll({
        where: { id_cliente: req.session.user.id },
        include: [{
          model: Comercio,
          as: 'comercio',
          include: [{
            model: TipoComercio,
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

  // Agregar comercio a favoritos
  agregarFavorito: async (req, res) => {
    try {
      await Favorito.findOrCreate({
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

  // Eliminar comercio de favoritos
  eliminarFavorito: async (req, res) => {
    try {
      await Favorito.destroy({
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
  },

  // Mostrar perfil del cliente
  mostrarPerfil: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.session.user.id, {
        attributes: ['id', 'nombre', 'apellido', 'correo', 'telefono', 'foto']
      });

      res.render('cliente/perfil', {
        title: 'Mi Perfil',
        usuario,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al mostrar perfil:', error);
      res.status(500).render('error', {
        message: 'Error al cargar el perfil',
        title: 'Error'
      });
    }
  },

  // Actualizar perfil del cliente
  actualizarPerfil: async (req, res) => {
    try {
      const { nombre, apellido, telefono, password, confirmPassword } = req.body;

      // Validaciones básicas
      if (!nombre || !apellido || !telefono) {
        req.flash('error_msg', 'Nombre, apellido y teléfono son requeridos');
        return res.redirect('/cliente/perfil');
      }

      if (password && password !== confirmPassword) {
        req.flash('error_msg', 'Las contraseñas no coinciden');
        return res.redirect('/cliente/perfil');
      }

      const updateData = {
        nombre,
        apellido,
        telefono
      };

      // Manejo de la foto
      if (req.file) {
        // Eliminar foto anterior si existe
        const usuario = await Usuario.findByPk(req.session.user.id);
        if (usuario.foto) {
          const fotoPath = path.join(__dirname, '../public', usuario.foto);
          if (fs.existsSync(fotoPath)) {
            fs.unlinkSync(fotoPath);
          }
        }

        updateData.foto = `/uploads/${req.file.filename}`;
      }

      // Manejo de contraseña
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.contrasena = await bcrypt.hash(password, salt);
      }

      await Usuario.update(updateData, {
        where: { id: req.session.user.id }
      });

      // Actualizar sesión
      const updatedUser = await Usuario.findByPk(req.session.user.id);
      req.session.user = {
        ...req.session.user,
        nombre: updatedUser.nombre,
        apellido: updatedUser.apellido,
        telefono: updatedUser.telefono,
        foto: updatedUser.foto
      };

      req.flash('success_msg', 'Perfil actualizado correctamente');
      res.redirect('/cliente/perfil');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      req.flash('error_msg', 'Error al actualizar el perfil');
      res.redirect('/cliente/perfil');
    }
  },

 // Método listarPedidos actualizado
listarPedidos: async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: { id_cliente: req.session.user.id },
      include: [
        { 
          model: db.Comercio, 
          as: 'comercio', 
          attributes: ['id', 'nombre_comercio', 'logo'] 
        },
        { 
          model: db.Direccion,
          as: 'direccion',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: db.Producto,
          as: 'productos',
          through: {
            attributes: ['cantidad', 'precio_unitario'],
            as: 'detalle'
          },
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    // Convertir a objeto plano para Handlebars
    const pedidosPlain = pedidos.map(pedido => pedido.get({ plain: true }));

    res.render('cliente/pedidos', {
      title: 'Mis Pedidos',
      pedidos: pedidosPlain,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).render('error', {
      message: 'Error al cargar la lista de pedidos',
      title: 'Error'
    });
  }
},

// Método mostrarDetallePedido actualizado
mostrarDetallePedido: async (req, res) => {
  try {
    const pedido = await Pedido.findOne({
      where: {
        id: req.params.id,
        id_cliente: req.session.user.id
      },
      include: [
        { 
          model: db.Comercio, 
          as: 'comercio', 
          attributes: ['id', 'nombre_comercio', 'telefono', 'logo'] 
        },
        { 
          model: db.Direccion,
          as: 'direccion',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: db.Producto,
          as: 'productos',
          through: {
            attributes: ['cantidad', 'precio_unitario'],
            as: 'detalle'
          },
          attributes: ['id', 'nombre', 'descripcion', 'imagen']
        }
      ]
    });

    if (!pedido) {
      req.flash('error_msg', 'Pedido no encontrado');
      return res.redirect('/cliente/pedidos');
    }

    // Calcular totales
    const pedidoPlain = pedido.get({ plain: true });
    pedidoPlain.subtotal = pedidoPlain.productos.reduce((sum, producto) => {
      return sum + (producto.detalle.cantidad * producto.detalle.precio_unitario);
    }, 0);
    
    pedidoPlain.itbis = pedidoPlain.subtotal * 0.18; // 18% ITBIS
    pedidoPlain.total = pedidoPlain.subtotal + pedidoPlain.itbis;

    res.render('cliente/detallePedido', {
      title: `Pedido #${pedidoPlain.id}`,
      pedido: pedidoPlain,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al mostrar detalle del pedido:', error);
    req.flash('error_msg', 'Error al cargar el detalle del pedido');
    res.redirect('/cliente/pedidos');
  }
},

  // Controlador para el catálogo
  catalogo: async (req, res) => {
    try {
      const categorias = await Categoria.findAll({
        include: [{
          model: Producto,
          as: 'productos',
          include: [{
            model: Comercio,
            as: 'comercio',
            attributes: ['id', 'nombre']
          }]
        }]
      });

      res.render('cliente/catalogo', {
        title: 'Catálogo de Productos',
        categorias,
        user: req.session.user
        // Puedes pasar más datos al catálogo si es necesario
      });
    } catch (error) {
      console.error('Error al cargar el catálogo:', error);
      res.status(500).render('error', {
        message: 'Error al cargar el catálogo de productos',
        title: 'Error'
      });
    }
  }
};