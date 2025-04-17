const { TipoComercio, Comercio, Direccion, Favorito, Pedido, Producto, Categoria, Usuario, Configuracion } = require('../models');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const transporter = require('../config/mailer');
const { Op } = require('sequelize');

// Helper para calcular totales del carrito
const calculateCartTotals = async (carrito) => {
  const config = await Configuracion.findOne();
  const subtotal = carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  const itbis = subtotal * (config.itbis / 100);
  const total = subtotal + itbis;
  return { subtotal, itbis, total, itbisPercent: config.itbis };
};

// Helper para calcular totales del carrito
const calculateTotals = async (carrito) => {
  const config = await Configuracion.findOne();
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const itbis = subtotal * (config.itbis / 100);
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

  // Mostrar formulario de dirección 
  mostrarFormDireccion: async (req, res) => {
    try {
        const direccion = req.params.id 
            ? await Direccion.findOne({
                where: { 
                    id: req.params.id,
                    id_cliente: req.session.user.id 
                }
              })
            : null;

        res.render('cliente/direcciones', {
            title: req.params.id ? 'Editar Dirección' : 'Nueva Dirección',
            direccion,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error al mostrar formulario dirección:', error);
        res.status(500).render('error', {
            message: 'Error al cargar el formulario',
            title: 'Error'
        });
    }
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

  // Método eliminarDireccion 
eliminarDireccion: async (req, res) => {
  try {
      // Verificación adicional
      const direccion = await Direccion.findOne({
          where: { 
              id: req.params.id,
              id_cliente: req.session.user.id 
          }
      });

      if (!direccion) {
          req.flash('error_msg', 'Dirección no encontrada o no tienes permisos');
          return res.redirect('/cliente/direcciones');
      }

      await Direccion.destroy({
          where: { 
              id: req.params.id,
              id_cliente: req.session.user.id 
          }
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

  actualizarPerfil: async (req, res) => {
    try {
        // Verificación adicional de seguridad
        if (req.params.id && parseInt(req.params.id) !== req.session.user.id) {
            req.flash('error_msg', 'No tienes permiso para editar este perfil');
            return res.redirect('/cliente/perfil');
        }

        const { nombre, apellido, telefono, password, confirmPassword } = req.body;

        if (!nombre || !apellido || !telefono) {
            req.flash('error_msg', 'Nombre, apellido y teléfono son requeridos');
            return res.redirect('/cliente/perfil');
        }

        if (password && password !== confirmPassword) {
            req.flash('error_msg', 'Las contraseñas no coinciden');
            return res.redirect('/cliente/perfil');
        }

        // Verificar que el usuario existe y pertenece al cliente
        const usuarioExistente = await Usuario.findOne({
            where: { id: req.session.user.id },
            attributes: ['id']
        });

        if (!usuarioExistente) {
            req.flash('error_msg', 'Usuario no encontrado');
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
            if (usuario.foto && usuario.foto !== '/img/default-profile.png') {
                const fotoPath = path.join(__dirname, '../public', usuario.foto);
                if (fs.existsSync(fotoPath)) {
                    fs.unlinkSync(fotoPath);
                }
            }
            updateData.foto = `/images/uploads/perfiles/${req.file.filename}`;
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
        if (!updatedUser) {
            req.session.destroy();
            return res.redirect('/login');
        }

        req.session.user = {
            id: updatedUser.id,
            nombre: updatedUser.nombre,
            apellido: updatedUser.apellido,
            correo: updatedUser.correo,
            telefono: updatedUser.telefono,
            foto: updatedUser.foto,
            rol: updatedUser.rol
        };

        req.flash('success_msg', 'Perfil actualizado correctamente');
        res.redirect('/cliente/perfil');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        req.flash('error_msg', 'Error al actualizar el perfil');
        res.redirect('/cliente/perfil');
    }
},

// Agregar producto al carrito 
addToCart: async (req, res) => {
  try {
      const { id } = req.params; // ID del producto
      const { cantidad } = req.body || 1; 

      // Buscar producto
      const producto = await Producto.findByPk(id, {
          attributes: ['id', 'nombre', 'precio', 'imagen']
      });

      if (!producto) {
          req.flash('error_msg', 'Producto no encontrado');
          return res.redirect('back');
      }

      // Inicializar carrito si no existe
      if (!req.session.carrito) {
          req.session.carrito = [];
      }

      // Verificar si el producto ya está en el carrito
      const itemIndex = req.session.carrito.findIndex(item => item.producto.id === producto.id);
      
      if (itemIndex >= 0) {
          // Actualizar cantidad si ya existe
          req.session.carrito[itemIndex].cantidad += parseInt(cantidad);
      } else {
          // Agregar nuevo item
          req.session.carrito.push({
              producto: producto.get({ plain: true }),
              cantidad: parseInt(cantidad)
          });
      }

      req.flash('success_msg', 'Producto agregado al carrito');
      res.redirect('back');
  } catch (error) {
      console.error('Error al agregar al carrito:', error);
      req.flash('error_msg', 'Error al agregar al carrito');
      res.redirect('back');
  }
},

// Eliminar producto del carrito
removeFromCart: (req, res) => {
  try {
      const { id } = req.params; // ID del producto

      if (!req.session.carrito) {
          req.flash('error_msg', 'El carrito está vacío');
          return res.redirect('back');
      }

      // Filtrar para remover el producto
      req.session.carrito = req.session.carrito.filter(item => item.producto.id !== parseInt(id));

      req.flash('success_msg', 'Producto removido del carrito');
      res.redirect('back');
  } catch (error) {
      console.error('Error al remover del carrito:', error);
      req.flash('error_msg', 'Error al remover del carrito');
      res.redirect('back');
  }
},

// Ver carrito actual
viewCart: async (req, res) => {
  try {
    const carrito = req.session.carrito || [];
    const { subtotal, itbis, total, itbisPercent } = await calculateCartTotals(carrito);

    res.render('cliente/carrito', {
      title: 'Mi Carrito',
      carrito,
      subtotal,
      itbis,
      total,
      itbisPercent,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al ver carrito:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el carrito',
      title: 'Error'
    });
  }
},

 // listarPedidos 
listarPedidos: async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: { id_cliente: req.session.user.id },
      include: [
        { 
          model: Comercio, 
          as: 'comercio', 
          attributes: ['id', 'nombre_comercio', 'logo'] 
        },
        { 
          model: Direccion,
          as: 'direccion',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Producto,
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

// Método mostrarDetallePedido
mostrarDetallePedido: async (req, res) => {
  try {
    const pedido = await Pedido.findOne({
      where: {
        id: req.params.id,
        id_cliente: req.session.user.id
      },
      include: [
        { 
          model: Comercio, 
          as: 'comercio', 
          attributes: ['id', 'nombre_comercio', 'telefono', 'logo'] 
        },
        { 
          model: Direccion,
          as: 'direccion',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Producto,
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

// Listado de comercios por tipo
listarComercios: async (req, res) => {
  try {
    const { tipo, search } = req.query;
    
    // Validar que se proporcionó un tipo
    if (!tipo) {
      return res.redirect('/cliente/home');
    }

    // Obtener el tipo de comercio
    const tipoComercio = await TipoComercio.findByPk(tipo);
    if (!tipoComercio) {
      req.flash('error_msg', 'Tipo de comercio no encontrado');
      return res.redirect('/cliente/home');
    }

    // Configurar condiciones de búsqueda
    const whereConditions = {
      id_tipo_comercio: tipo,
      activo: true
    };

    if (search) {
      whereConditions.nombre_comercio = {
        [Op.like]: `%${search}%`
      };
    }

    // Obtener comercios
    const comercios = await Comercio.findAll({
      where: whereConditions,
      attributes: ['id', 'nombre_comercio', 'descripcion', 'logo'],
      order: [['nombre_comercio', 'ASC']]
    });

    res.render('cliente/listadoComercios', {
      title: `Comercios - ${tipoComercio.nombre}`,
      tipoComercio,
      comercios,
      search: search || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al listar comercios:', error);
    req.flash('error_msg', 'Error al cargar el listado de comercios');
    res.redirect('/cliente/home');
  }
},

  // catálogo
  catalogo: async (req, res) => {
    try {
      const { id_comercio } = req.query;
  
      if (!id_comercio) {
        req.flash('error_msg', 'Debes seleccionar un comercio');
        return res.redirect('/cliente/home');
      }
  
      const comercio = await Comercio.findByPk(id_comercio, {
        attributes: ['id', 'nombre_comercio', 'logo'],
        include: [{
          model: Categoria,
          as: 'categorias',
          include: [{
            model: Producto,
            as: 'productos',
            attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen'],
            where: { activo: true }
          }]
        }]
      });
  
      if (!comercio) {
        req.flash('error_msg', 'Comercio no encontrado');
        return res.redirect('/cliente/home');
      }
  
      res.render('cliente/catalogo', {
        title: `Catálogo - ${comercio.nombre_comercio}`,
        comercio,
        categorias: comercio.categorias,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al cargar el catálogo:', error);
      res.status(500).render('error', {
        message: 'Error al cargar el catálogo',
        title: 'Error'
      });
    }
  },

  // Método para confirmar pedido
  confirmarPedido: async (req, res) => {
    try {
      const { direccionId, notas } = req.body;
      
      if (!direccionId) {
        req.flash('error_msg', 'Selecciona una dirección de entrega');
        return res.redirect('/cliente/carrito');
      }
  
      const config = await Configuracion.findOne();
      const subtotal = req.session.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
      const itbis = subtotal * (config.itbis / 100);
      const total = subtotal + itbis;
    
    // Crear el pedido en la base de datos
    const nuevoPedido = await Pedido.create({
      id_cliente: req.session.user.id,
      id_direccion: direccionId,
      notas,
      subtotal: totals.subtotal,
      itbis: totals.itbis,
      total: totals.total,
      estado: 'pendiente'
    });

    // Enviar correo de confirmación
    const mailOptions = {
      from: 'appcenar@example.com',
      to: req.session.user.correo,
      subject: '¡Pedido Recibido!',
      html: `<p>Tu pedido #${nuevoPedido.id} está en proceso. Total: RD$ ${totals.total}</p>`
    };
    await transporter.sendMail(mailOptions);

    req.flash('success_msg', 'Pedido confirmado correctamente');
    res.redirect('/cliente/pedidos');
  } catch (error) {
    console.error('Error al confirmar pedido:', error);
    req.flash('error_msg', 'Error al confirmar el pedido');
    res.redirect('/cliente/carrito');
  }
},  

// Cerrar sesión
cerrarSesion: (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.redirect('/cliente/home');
    }
    res.clearCookie('connect.sid'); // Limpiar la cookie de sesión
    res.redirect('/login'); // Redireccionar al login
  });
}
};
