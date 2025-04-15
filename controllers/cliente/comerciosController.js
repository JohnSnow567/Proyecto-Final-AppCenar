const db = require('../../models');

// Helper para calcular totales
const calculateTotals = (carrito, itbisPercent) => {
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const itbis = subtotal * (itbisPercent / 100);
  const total = subtotal + itbis;
  return { subtotal, itbis, total };
};

module.exports = {
  listarComercios: async (req, res) => {
    try {
      const { tipo, search } = req.query;
      const where = {};
      
      if (tipo) where.id_tipo_comercio = tipo;
      if (search) where.nombre_comercio = { [db.Sequelize.Op.like]: `%${search}%` };

      const comercios = await db.Comercio.findAll({
        where,
        include: [{ model: db.TipoComercio, as: 'tipoComercio' }]
      });

      const tipoActual = tipo ? await db.TipoComercio.findByPk(tipo) : null;

      res.render('cliente/comercios', {
        title: tipoActual ? tipoActual.nombre : 'Todos los Comercios',
        comercios,
        tipoActual,
        searchQuery: search || '',
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al listar comercios:', error);
      res.status(500).render('error', {
        message: 'Error al cargar los comercios',
        title: 'Error'
      });
    }
  },

  catalogoComercio: async (req, res) => {
    try {
      const comercio = await db.Comercio.findByPk(req.params.id, {
        include: [{
          model: db.Categoria,
          as: 'categorias',
          include: [{
            model: db.Producto,
            as: 'productos',
            where: { id_comercio: req.params.id }
          }]
        }]
      });

      if (!comercio) {
        req.flash('error_msg', 'Comercio no encontrado');
        return res.redirect('/cliente/comercios');
      }

      const productosEnCarrito = (req.session.carrito || [])
        .filter(item => item.id_comercio == req.params.id)
        .map(item => item.id_producto);

      res.render('cliente/catalogoComercio', {
        title: comercio.nombre_comercio,
        comercio: comercio.get({ plain: true }),
        productosEnCarrito,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al mostrar catálogo:', error);
      res.status(500).render('error', {
        message: 'Error al cargar el catálogo',
        title: 'Error'
      });
    }
  },

  agregarProductoCarrito: async (req, res) => {
    try {
      const { id_producto } = req.body;
      const producto = await db.Producto.findByPk(id_producto);
      
      if (!producto) {
        req.flash('error_msg', 'Producto no encontrado');
        return res.redirect('back');
      }

      req.session.carrito = req.session.carrito || [];
      
      const existingItem = req.session.carrito.find(
        item => item.id_producto == id_producto && item.id_comercio == req.params.id
      );

      if (existingItem) {
        existingItem.cantidad += 1;
      } else {
        req.session.carrito.push({
          id_comercio: req.params.id,
          id_producto: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          cantidad: 1
        });
      }

      res.redirect('back');
    } catch (error) {
      console.error('Error al agregar producto:', error);
      req.flash('error_msg', 'Error al agregar producto al carrito');
      res.redirect('back');
    }
  },

  eliminarProductoCarrito: async (req, res) => {
    try {
      if (req.session.carrito) {
        req.session.carrito = req.session.carrito.filter(
          item => !(item.id_producto == req.params.id_producto && item.id_comercio == req.params.id)
        );
      }
      res.redirect('back');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      req.flash('error_msg', 'Error al eliminar producto del carrito');
      res.redirect('back');
    }
  },

  confirmarPedido: async (req, res) => {
    try {
      const [comercio, direcciones, config] = await Promise.all([
        db.Comercio.findByPk(req.params.id),
        db.Direccion.findAll({ where: { id_cliente: req.session.user.id } }),
        db.Configuracion.findOne()
      ]);

      if (!comercio) {
        req.flash('error_msg', 'Comercio no encontrado');
        return res.redirect('/cliente/comercios');
      }

      const carrito = (req.session.carrito || []).filter(item => item.id_comercio == req.params.id);
      if (carrito.length === 0) {
        req.flash('error_msg', 'No hay productos en el carrito');
        return res.redirect(`/cliente/comercios/${req.params.id}`);
      }

      const itbisPercent = config ? config.itbis : 18;
      const { subtotal, itbis, total } = calculateTotals(carrito, itbisPercent);

      res.render('cliente/confirmarPedido', {
        title: 'Confirmar Pedido',
        comercio: comercio.get({ plain: true }),
        direcciones,
        carrito,
        subtotal,
        itbis,
        total,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      res.status(500).render('error', {
        message: 'Error al confirmar el pedido',
        title: 'Error'
      });
    }
  },

  finalizarPedido: async (req, res) => {
    try {
      const { id_direccion } = req.body;
      const carrito = (req.session.carrito || []).filter(item => item.id_comercio == req.params.id);

      // Validaciones
      const [direccion, config] = await Promise.all([
        db.Direccion.findOne({ where: { id: id_direccion, id_cliente: req.session.user.id } }),
        db.Configuracion.findOne()
      ]);

      if (!direccion) {
        req.flash('error_msg', 'Dirección no válida');
        return res.redirect('back');
      }

      if (carrito.length === 0) {
        req.flash('error_msg', 'No hay productos en el carrito');
        return res.redirect(`/cliente/comercios/${req.params.id}`);
      }

      // Calcular totales
      const itbisPercent = config ? config.itbis : 18;
      const { subtotal, total } = calculateTotals(carrito, itbisPercent);

      // Crear pedido
      const pedido = await db.sequelize.transaction(async (t) => {
        const newPedido = await db.Pedido.create({
          id_cliente: req.session.user.id,
          id_comercio: req.params.id,
          id_direccion,
          subtotal,
          total,
          estado: 'pendiente'
        }, { transaction: t });

        // Agregar productos al pedido
        await Promise.all(carrito.map(item =>
          newPedido.addProducto(item.id_producto, {
            through: { cantidad: item.cantidad },
            transaction: t
          })
        ));

        return newPedido;
      });

      // Limpiar carrito
      req.session.carrito = req.session.carrito.filter(item => item.id_comercio != req.params.id);

      req.flash('success_msg', 'Pedido realizado con éxito');
      res.redirect('/cliente/pedidos');
    } catch (error) {
      console.error('Error al finalizar pedido:', error);
      req.flash('error_msg', 'Error al realizar el pedido');
      res.redirect('back');
    }
  }
};