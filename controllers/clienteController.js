const { TipoComercio, Comercio, Direccion, Favorito, Pedido, Producto, Categoria, Usuario, Configuracion, DetallePedido } = require('../models');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const transporter = require('../config/mailer');
const { Op } = require('sequelize');
const { DBError, AppError } = require('../utils/AppError');

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
  home: async (req, res, next) => {
    try {
      const userId = req.session.user.id;

      // 1) Cargar tipos de comercio (como antes)
      const tiposComercio = await TipoComercio.findAll({
        attributes: ['id', 'nombre', 'icono'],
        include: [{
          model: Comercio,
          as: 'comercios',
          attributes: []
        }],
        group: ['TipoComercio.id']
      });

      // 2) Cargar los 5 pedidos más recientes de este cliente
      const pedidos = await Pedido.findAll({
        where: { id_cliente: userId },
        include: [
          {
            model: Comercio,
            as: 'comercio',
            attributes: ['nombre_comercio']
          }
        ],
        order: [['fecha_hora', 'DESC']],
        limit: 5
      });

      // 3) Convertir a plano y renombrar campos para la vista
      const pedidosRecientes = pedidos.map(p => {
        const obj = p.get({ plain: true });
        return {
          id: obj.id,
          fecha: obj.fecha_hora,      // puedes formatearla en la vista con tu helper formatDate
          total: obj.total,
          comercio: {
            nombre_comercio: obj.comercio.nombre
          }
        };
      });

       // 3) Favoritos del cliente
       const favs = await Favorito.findAll({
        where: { id_cliente: userId },
        include: [{
          model: Comercio,
          as: 'comercio',
          attributes: ['id', 'nombre_comercio', 'logo']
        }]
      });

      const favoritos = favs.map(f => {
        const o = f.get({ plain: true });
        return {
          id: o.comercio.id,
          nombre: o.comercio.nombre_comercio,
          logo: o.comercio.logo
        };
      });

      // 4) Renderizar pasando los pedidosRecientes
      res.render('cliente/home', {
        title: 'Inicio - Cliente',
        tiposComercio,
        pedidosRecientes,
        favoritos,
        user: req.session.user
      });
    } catch (error) {
      next(new DBError('Error al cargar la página de inicio', error));
    }
  },

  // Listado de comercios por tipo
  listarComercios: async (req, res, next) => {
    try {
      const { tipo, search } = req.query;
      
      if (!tipo) {
        throw new AppError('Debes seleccionar un tipo de comercio', 400);
      }

      const tipoComercio = await TipoComercio.findByPk(tipo);
      if (!tipoComercio) {
        throw new AppError('Tipo de comercio no encontrado', 404);
      }

      const whereConditions = {
        id_tipo_comercio: tipo
      };

      if (search) {
        whereConditions.nombre_comercio = {
          [Op.like]: `%${search}%`
        };
      }

      const comercios = await Comercio.findAll({
        where: whereConditions,
        attributes: ['id', 'nombre_comercio', 'logo'],
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
      next(new DBError('Error al cargar el listado de comercios', error));
    }
  },

  // Listar direcciones del cliente
  listarDirecciones: async (req, res, next) => {
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
      next(new DBError('Error al cargar las direcciones', error));
    }
  },

  // Mostrar formulario de dirección 
  mostrarFormDireccion: async (req, res, next) => {
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
        next(new DBError('Error al cargar el formulario de dirección', error));
    }
  },

  // Crear nueva dirección
  crearDireccion: async (req, res, next) => {
    try {
      await Direccion.create({
        id_cliente: req.session.user.id,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion
      });

      req.flash('success_msg', 'Dirección creada correctamente');
      res.redirect('/cliente/direcciones');
    } catch (error) {
      next(new DBError('Error al crear la dirección', error));
    }
  },

  // Actualizar dirección existente
  actualizarDireccion: async (req, res, next) => {
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
      next(new DBError('Error al actualizar la dirección', error));
    }
  },

  // Método eliminarDireccion 
  eliminarDireccion: async (req, res, next) => {
    try {
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
      next(new DBError('Error al eliminar la dirección', error));
    }
  },

  // Listar favoritos del cliente
  listarFavoritos: async (req, res, next) => {
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
      next(new DBError('Error al cargar los comercios favoritos', error));
    }
  },

  // Agregar comercio a favoritos
  agregarFavorito: async (req, res, next) => {
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
      next(new DBError('Error al agregar a favoritos', error));
    }
  },

  // Eliminar comercio de favoritos
  eliminarFavorito: async (req, res, next) => {
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
      next(new DBError('Error al eliminar de favoritos', error));
    }
  },

  // Mostrar perfil del cliente
  mostrarPerfil: async (req, res, next) => {
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
      next(new DBError('Error al cargar el perfil', error));
    }
  },

  actualizarPerfil: async (req, res, next) => {
    try {
        if (req.params.id && parseInt(req.params.id) !== req.session.user.id) {
            throw new AppError('No tienes permiso para editar este perfil', 403);
        }

        const { nombre, apellido, telefono, password, confirmPassword } = req.body;

        if (!nombre || !apellido || !telefono) {
            throw new AppError('Nombre, apellido y teléfono son requeridos', 400);
        }

        if (password && password !== confirmPassword) {
            throw new AppError('Las contraseñas no coinciden', 400);
        }

        const usuarioExistente = await Usuario.findOne({
            where: { id: req.session.user.id },
            attributes: ['id']
        });

        if (!usuarioExistente) {
            throw new AppError('Usuario no encontrado', 404);
        }

        const updateData = {
            nombre,
            apellido,
            telefono
        };

        if (req.file) {
            const usuario = await Usuario.findByPk(req.session.user.id);
            if (usuario.foto && usuario.foto !== '/img/default-profile.png') {
                const fotoPath = path.join(__dirname, '../public', usuario.foto);
                if (fs.existsSync(fotoPath)) {
                    fs.unlinkSync(fotoPath);
                }
            }
            updateData.foto = `/images/uploads/perfiles/${req.file.filename}`;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.contrasena = await bcrypt.hash(password, salt);
        }

        await Usuario.update(updateData, {
            where: { id: req.session.user.id }
        });

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
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            req.flash('error_msg', messages.join(', '));
            return res.redirect('/cliente/perfil');
        }
        next(new DBError('Error al actualizar el perfil', error));
    }
  },

  // Agregar producto al carrito 
  addToCart: async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body || 1; 

        const producto = await Producto.findByPk(id, {
            attributes: ['id', 'nombre', 'precio', 'imagen', 'id_comercio']
        });

        if (!producto) {
            throw new AppError('El producto no esta disponible', 404);
        }

        if (!req.session.carrito) {
            req.session.carrito = [];
        }

        const itemIndex = req.session.carrito.findIndex(item => item.producto.id === producto.id);
        
        if (itemIndex >= 0) {
            req.session.carrito[itemIndex].cantidad += parseInt(cantidad);
        } else {
            req.session.carrito.push({
                producto: producto.get({ plain: true }),
                cantidad: parseInt(cantidad)
            });
        }

        req.flash('success_msg', 'Producto agregado al carrito');
        res.redirect('back');
    } catch (error) {
        next(new DBError('Error al agregar al carrito', error));
    }
  },

  // Eliminar producto del carrito
  removeFromCart: (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.session.carrito) {
            throw new AppError('El carrito está vacío', 400);
        }

        req.session.carrito = req.session.carrito.filter(item => item.producto.id !== parseInt(id));

        req.flash('success_msg', 'Producto removido del carrito');
        res.redirect('back');
    } catch (error) {
        next(new DBError('Error al remover del carrito', error));
    }
  },

  // Obtener conteo de productos en el carrito
  getCartCount: async (req, res, next) => {
    try {
      const count = req.session.carrito 
        ? req.session.carrito.reduce((total, item) => total + item.cantidad, 0)
        : 0;
      res.json({ count });
    } catch (error) {
      next(new DBError('Error al obtener conteo del carrito', error));
    }
  },

  // Ver carrito actual
  viewCart: async (req, res, next) => {
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
      next(new DBError('Error al cargar el carrito', error));
    }
  },

// listarPedidos 
listarPedidos: async (req, res) => {
  try {
    // 1) Traer la configuración
    const configuracion = await Configuracion.findOne({ where: { id: 1 } });
    const itbisPct = parseFloat(configuracion.itbis);

    // 2) Traer los pedidos y sus asociaciones
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

    // 3) Convertir a objeto plano y calcular totales
    const pedidosConTotales = pedidos.map(p => {
      const pedido = p.get({ plain: true });

      // subtotal = suma(cantidad * precio_unitario)
      pedido.subtotal = pedido.productos.reduce((sum, prod) => {
        return sum + (prod.detalle.cantidad * prod.detalle.precio_unitario);
      }, 0);

      // itbis y totalWithITBIS
      pedido.itbisAmount = parseFloat((pedido.subtotal * (itbisPct / 100)).toFixed(2));
      pedido.totalWithITBIS = parseFloat((pedido.subtotal + pedido.itbisAmount).toFixed(2));

      return pedido;
    });

    res.render('cliente/pedidos', {
      title: 'Mis Pedidos',
      pedidos: pedidosConTotales,
      configuracion,
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
    // 1) Buscar configuración
    const configuracion = await Configuracion.findOne({ where: { id: 1 } });
    const itbisPct = parseFloat(configuracion.itbis);

    // 2) Traer el pedido con sus asociaciones
    const pedidoInstance = await Pedido.findOne({
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

    if (!pedidoInstance) {
      req.flash('error_msg', 'Pedido no encontrado');
      return res.redirect('/cliente/pedidos');
    }

    // 3) Convertir y calcular totales
    const pedido = pedidoInstance.get({ plain: true });

    pedido.subtotal = pedido.productos.reduce((sum, prod) => {
      return sum + (prod.detalle.cantidad * prod.detalle.precio_unitario);
    }, 0);

    pedido.itbisAmount = parseFloat((pedido.subtotal * (itbisPct / 100)).toFixed(2));
    pedido.totalWithITBIS = parseFloat((pedido.subtotal + pedido.itbisAmount).toFixed(2));

    // 4) Encontrar la dirección seleccionada
    const direccion = pedido.cliente?.direcciones?.find(d => d.id === pedido.id_direccion);

    res.render('cliente/detallePedido', {
      title: `Pedido #${pedido.id}`,
      pedido,
      direccion,
      configuracion,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al mostrar detalle del pedido:', error);
    req.flash('error_msg', 'Error al cargar el detalle del pedido');
    res.redirect('/cliente/pedidos');
  }
},

  // catálogo
  catalogo: async (req, res, next) => {
    try { 
      const { id_comercio } = req.query;
  
      if (!id_comercio) {
        throw new AppError('Debes seleccionar un comercio', 400);
      }
  
      const comercio = await Comercio.findByPk(id_comercio, {
        attributes: ['id', 'nombre_comercio', 'logo'],
        include: [{
          model: Categoria,
          as: 'categorias',
          include: [{
            model: Producto,
            as: 'productos',
            attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen']
          }]
        }]
      });
  
      if (!comercio) {
        throw new AppError('Comercio no encontrado', 404);
      }

        // 2) Carrito en sesión
      const carrito = req.session.carrito || [];  
      const carritoCount = carrito.reduce((sum, i) => sum + i.cantidad, 0);
      const carritoIds   = carrito.map(i => i.producto.id);

      const config   = await Configuracion.findOne({ where: { id: 1 } });
      const itbisPct = parseFloat(config.itbis);
      const subtotal = carrito.reduce((sum, i) => sum + (i.producto.precio * i.cantidad), 0);
      const itbis     = parseFloat((subtotal * (itbisPct/100)).toFixed(2));
      const total     = parseFloat((subtotal + itbis).toFixed(2));
  
      res.render('cliente/catalogo', {
        title: `Catálogo - ${comercio.nombre_comercio}`,
        comercio,
        categorias: comercio.categorias,
        carrito,
        carritoCount,
        carritoIds,
        subtotal,
        itbis,
        total,
        config,
        user: req.session.user
      });
    } catch (error) {
      next(new DBError('Error al cargar el catálogo', error));
    }
  },

  mostrarConfirmacion: async (req, res, next) => {
    try {
      // 1) Recuperar el carrito de la sesión (o de donde lo guardes)
      const carrito = req.session.carrito || [];
      if (!carrito.length) {
        // Si no hay productos, redirigir al carrito
        req.flash('info_msg', 'Tu carrito está vacío.');
        return res.redirect('/cliente/carrito');
      }

      // 2) Traer direcciones del cliente
      const direcciones = await Direccion.findAll({
        where: { id_cliente: req.session.user.id },
        attributes: ['id', 'nombre', 'descripcion']
      });
      if (!direcciones.length) {
        // Aunque el middleware hasAddress asegura que hay al menos una,
        // por si acaso redirigimos
        return res.redirect('/cliente/direcciones');
      }

      // 3) Traer configuración de ITBIS
      const configuracion = await Configuracion.findOne({ where: { id: 1 } });
      const itbisPct = parseFloat(configuracion.itbis);

      // 4) Calcular subtotal, itbis y totalFinal
      const subtotal = carrito.reduce((sum, item) => {
        return sum + (item.producto.precio * item.cantidad);
      }, 0);
      const itbisAmount = parseFloat((subtotal * (itbisPct / 100)).toFixed(2));
      const totalWithItbis = parseFloat((subtotal + itbisAmount).toFixed(2));

      // 5) Renderizar la vista de confirmación
      res.render('cliente/confirmarPedido', {
        title: 'Confirmar Pedido',
        user: req.session.user,
        carrito,
        direcciones,
        configuracion,    // para mostrar el % en la vista
        subtotal,
        itbisAmount,
        totalWithItbis
      });
    } catch (error) {
      next(error);
    }
  },

  // Método para confirmar pedido
  confirmarPedido: async (req, res, next) => {
    try {
      const { id_direccion } = req.body;
      const carrito = req.session.carrito || [];

      
      if (!id_direccion) {
        throw new AppError('Selecciona una dirección de entrega', 400);
      }

      if (!carrito.length) {
        throw new AppError('Tu carrito está vacío', 400);
      }

      const comercioId = carrito[0].producto.id_comercio;
  
      const config = await Configuracion.findOne();
      const subtotal = req.session.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
      const itbis = subtotal * (config.itbis / 100);
      const total = subtotal + itbis;
    
      const nuevoPedido = await Pedido.create({
        id_cliente: req.session.user.id,
        id_comercio: comercioId,
        id_direccion: id_direccion,
        subtotal,
        total,
        estado: 'pendiente'
      });

      // Crear los detalles (DetallePedido) para cada ítem del carrito
      await Promise.all(carrito.map(item => {
        return DetallePedido.create({
          id_pedido:       nuevoPedido.id,
          id_producto:     item.producto.id,
          cantidad:        item.cantidad,
          precio_unitario: item.producto.precio
        });
      }));
  

      const mailOptions = {
        from: 'appcenar@example.com',
        to: req.session.user.correo,
        subject: '¡Pedido Recibido!',
        html: `<p>Tu pedido #${nuevoPedido.id} está en proceso. Total: RD$ ${total}</p>`
      };
      await transporter.sendMail(mailOptions);

      req.session.carrito = [];
      req.flash('success_msg', 'Pedido confirmado correctamente');
      res.redirect('/cliente/pedidos');
    } catch (error) {
      next(new DBError('Error al confirmar el pedido', error));
    }
  },  

  // Cerrar sesión
  cerrarSesion: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
        return res.redirect('/cliente/home');
      }
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  }
};