const { Comercio, Pedido, Categoria, Producto, Usuario, DetallePedido, Configuracion} = require('../models');
const { Op, fn, col } = require('sequelize');
const bcrypt = require('bcrypt');

// Para operaciones con archivos (en perfil o productos)
const fs = require('fs');
const path = require('path');

// Directorios (ajusta según la estructura de tu proyecto)
const logosDir = path.join(__dirname, '../public/images/uploads/logos');
const productosDir = path.join(__dirname, '../public/images/uploads/productos');

module.exports = {

  /* 
    HOMEDEL COMERCIO: 
    - Obtiene el comercio asociado al usuario logueado.
    - Consulta los pedidos hechos a ese comercio, ordenados de más reciente a más antiguo.
  */
    home: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
            if (!comercio) return res.redirect('/login');

            const pedidos = await Pedido.findAll({
            where: { id_comercio: comercio.id },
            include: [
                { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
                { model: Comercio, as: 'comercio' }
            ],
            order: [['fecha_hora', 'DESC']]
            });

            // Calcular la cantidad total de productos en cada pedido
            const pedidosConCount = pedidos.map(pedido => {
            const pedidoObj = pedido.toJSON();
            let totalCantidad = 0;
            if (pedidoObj.detalles && pedidoObj.detalles.length > 0) {
                pedidoObj.detalles.forEach(detalle => {
                totalCantidad += detalle.cantidad;
                });
            }
            return { ...pedidoObj, cantidadProductos: totalCantidad };
            });

            const configuracion = await Configuracion.findOne({ where: {id: 1}});
            const itbisPct = parseFloat(configuracion.itbis);

            // añadimos campo itbisAmount y totalWithITBIS a cada pedido
            const pedidosConITBIS = pedidosConCount.map(pedido => {
              const baseTotal = parseFloat(pedido.total);
              const itbisAmount = parseFloat((baseTotal * (itbisPct / 100)).toFixed(2));
              const totalWithITBIS = parseFloat((baseTotal + itbisAmount).toFixed(2));
              return {
                ...pedido,
                itbisAmount,
                totalWithITBIS
              };
            });
            

            res.render('comercio/home', { 
            title: 'Home del Comercio', 
            comercio, 
            pedidos: pedidosConITBIS
            });
        } catch (error) {
            console.error("Error en home de comercio:", error);
            res.render('comercio/home', { title: 'Home del Comercio', error: 'Error en el servidor' });
        }
        },

  /*
    ORDER DETAIL:
    - Muestra el detalle del pedido seleccionado.
    - Se consultan los productos asociados al pedido (suponiendo que exista relación).
    - En este ejemplo, se asume que Pedido tiene un campo (o asociación) para obtener los detalles.
  */
    orderDetail: async (req, res) => {
        try {
          const { id } = req.params;
          const pedidoInstance = await Pedido.findByPk(id, {
            include: [
              { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
              { model: Comercio, as: 'comercio' }
            ]
          });
          if (!pedidoInstance) return res.redirect('/comercio/home');
          
          const pedido = pedidoInstance.toJSON();

          // 3) Traemos la configuración para el ITBIS
          const configuracion = await Configuracion.findOne({ where: { id: 1 } });
          const itbisPct = parseFloat(configuracion.itbis);

          // 4) Calculamos el monto de ITBIS y el total con ITBIS
          const baseTotal = parseFloat(pedido.total);
          const itbisAmount = parseFloat((baseTotal * (itbisPct / 100)).toFixed(2));
          const totalWithITBIS = parseFloat((baseTotal + itbisAmount).toFixed(2));

          // 5) Extendemos el objeto pedido con los nuevos campos
          pedido.itbisAmount = itbisAmount;
          pedido.totalWithITBIS = totalWithITBIS;

          res.render('comercio/orderDetail', { title: 'Detalle del Pedido', pedido, configuracion });
        } catch (error) {
          console.error("Error en orderDetail:", error);
          res.redirect('/comercio/home');
        }
      },
    

  /*
    ASIGNAR DELIVERY:
    - Para un pedido pendiente, busca un delivery disponible (rol "delivery" y estado "activo").
    - Asigna el delivery al pedido, cambia el estado del pedido a "en proceso".
    - Marca al delivery como ocupado (para evitar asignarlo nuevamente).
  */
  assignDelivery: async (req, res) => {
    try {
      const { id } = req.params; // id del pedido
      const pedido = await Pedido.findByPk(id);
      if (!pedido || pedido.estado !== 'pendiente') {
        return res.redirect('/comercio/home');
      }
      // Buscar un delivery disponible
      const delivery = await Usuario.findOne({ 
        where: { rol: 'delivery', estado: 'activo' } 
      });
      if (!delivery) {
        // Si no hay delivery disponible, mostrar mensaje (puedes almacenar un mensaje en session o pasar a la vista)
        return res.render('comercio/orderDetail', { 
          title: 'Detalle del Pedido', 
          pedido, 
          error: 'No hay delivery disponible en este momento. Intente más tarde.' 
        });
      }
      // Asignar el delivery: se guarda el id del delivery y cambia el estado del pedido
      pedido.id_delivery = delivery.id;
      pedido.estado = 'en proceso';
      await pedido.save();
      // Marcar delivery como ocupado; aquí se puede actualizar un campo adicional en el delivery, por ejemplo:
      delivery.estado = 'ocupado';
      await delivery.save();
      res.redirect('/comercio/home');
    } catch (error) {
      console.error("Error en assignDelivery:", error);
      res.redirect('/comercio/home');
    }
  },

  /*
    MI PERFIL DEL COMERCIO:
    - Muestra un formulario con los datos actuales del comercio.
    - Se obtienen tanto datos del registro en Comercio como (posiblemente) algunos del Usuario.
  */
  showPerfil: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      if (!comercio) {
        return res.redirect('/login');
      }
      const usuario = await Usuario.findOne({where: {id: userId}});
      if (!usuario) {
        return res.redirect('/login');
      }
      res.render('comercio/perfil', { title: 'Mi Perfil', comercio, usuario });
    } catch (error) {
      console.error("Error en showPerfil:", error);
      res.redirect('/comercio/home');
    }
  },

  /*
    UPDATE PERFIL:
    - Procesa la edición de la información del comercio.
    - Actualiza campos: logo (opcional), hora de apertura, hora de cierre, teléfono y correo.
    - Si se sube un nuevo logo, se reemplaza y se elimina el archivo antiguo.
  */
  updatePerfil: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { hora_apertura, hora_cierre, telefono, correo } = req.body;
      // Validar campos requeridos (logo es opcional)
      if (!hora_apertura || !hora_cierre || !telefono || !correo) {
        return res.render('comercio/perfil', { title: 'Mi Perfil', error: 'Todos los campos son requeridos' });
      }
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      if (!comercio) {
        return res.redirect('/login');
      }
      // Si se sube un nuevo logo, reemplazarlo y borrar el antiguo (asumiendo uso de multer)
      if (req.file) {
        const newLogo = req.file.filename;
        if (comercio.logo) {
          const oldLogoPath = path.join(logosDir, comercio.logo);
          fs.unlink(oldLogoPath, (err) => {
            if (err) console.error("Error al borrar logo antiguo:", err);
          });
        }
        comercio.logo = newLogo;
      }
      comercio.hora_apertura = hora_apertura;
      comercio.hora_cierre = hora_cierre;
      comercio.telefono = telefono;
      // Se actualiza también en el usuario (correo) si es necesario:
      // Por ejemplo, suponiendo que el comercio está relacionado con un Usuario.
      const usuario = await Usuario.findByPk(userId);
      if (usuario) usuario.correo = correo;
      await comercio.save();
      if (usuario) await usuario.save();
      res.redirect('/comercio/home');
    } catch (error) {
      console.error("Error en updatePerfil:", error);
      res.render('comercio/perfil', { title: 'Mi Perfil', error: 'Error en el servidor' });
    }
  },

  /*
    MANTENIMIENTO DE CATEGORÍAS:
    - LISTAR CATEGORÍAS del comercio (filtradas por el comercio logueado).
  */
    listCategorias: async (req, res) => {
        try {
          const userId = req.session.user.id;
          const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
          if (!comercio) return res.redirect('/login');
    
          // Buscamos las categorías del comercio y calculamos el número de productos asociados a cada una.
          const categorias = await Categoria.findAll({
            where: { id_comercio: comercio.id },
            include: [{
              model: Producto,
              as: 'productos',
              attributes: []
            }],
            attributes: {
              include: [[fn('COUNT', col('productos.id')), 'productCount']]
            },
            group: ['Categoria.id'],
            order: [['nombre', 'ASC']]
          });
    
          res.render('comercio/categorias/list', { title: 'Mantenimiento de Categorías', categorias });
        } catch (error) {
          console.error("Error en listCategorias:", error);
          res.redirect('/comercio/home');
        }
      },

  showCreateCategoria: (req, res) => {
    res.render('comercio/categorias/create', { title: 'Crear Categoría' });
  },

  createCategoria: async (req, res) => {
    try {
      const { nombre, descripcion } = req.body;
      if (!nombre || !descripcion) {
        return res.render('comercio/categorias/create', { title: 'Crear Categoría', error: 'Todos los campos son requeridos' });
      }
      const userId = req.session.user.id;
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      if (!comercio) return res.redirect('/login');
      await Categoria.create({
        nombre,
        descripcion,
        id_comercio: comercio.id
      });
      res.redirect('/comercio/categorias');
    } catch (error) {
      console.error("Error en createCategoria:", error);
      res.render('comercio/categorias/create', { title: 'Crear Categoría', error: 'Error en el servidor' });
    }
  },

  showEditCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findByPk(id);
      if (!categoria) return res.redirect('/comercio/categorias');
      res.render('comercio/categorias/edit', { title: 'Editar Categoría', categoria });
    } catch (error) {
      console.error("Error en showEditCategoria:", error);
      res.redirect('/comercio/categorias');
    }
  },

  updateCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      if (!nombre || !descripcion) {
        return res.render('comercio/categorias/edit', { title: 'Editar Categoría', error: 'Todos los campos son requeridos', categoria: req.body });
      }
      const categoria = await Categoria.findByPk(id);
      if (!categoria) return res.redirect('/comercio/categorias');
      categoria.nombre = nombre;
      categoria.descripcion = descripcion;
      await categoria.save();
      res.redirect('/comercio/categorias');
    } catch (error) {
      console.error("Error en updateCategoria:", error);
      res.render('comercio/categorias/edit', { title: 'Editar Categoría', error: 'Error en el servidor', categoria: req.body });
    }
  },

  deleteCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      await Categoria.destroy({ where: { id } });
      res.redirect('/comercio/categorias');
    } catch (error) {
      console.error("Error en deleteCategoria:", error);
      res.redirect('/comercio/categorias');
    }
  },

  /*
    MANTENIMIENTO DE PRODUCTOS:
    - LISTAR productos del comercio logueado.
  */
  listProductos: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      if (!comercio) return res.redirect('/login');
      // Se listan los productos del comercio e incluso se puede incluir el nombre de la categoría
      const productos = await Producto.findAll({
        where: { id_comercio: comercio.id },
        include: [{ model: Categoria, as: 'categoria', attributes: ['nombre'] }]
      });
      res.render('comercio/productos/list', { title: 'Mantenimiento de Productos', productos });
    } catch (error) {
      console.error("Error en listProductos:", error);
      res.redirect('/comercio/home');
    }
  },

  showCreateProducto: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      // Listar categorías del comercio
      const categorias = await Categoria.findAll({ where: { id_comercio: comercio.id } });
      res.render('comercio/productos/create', { title: 'Crear Producto', categorias });
    } catch (error) {
      console.error("Error en showCreateProducto:", error);
      res.redirect('/comercio/productos');
    }
  },

  createProducto: async (req, res) => {
    try {
      const { nombre, descripcion, precio, id_categoria } = req.body;
      if (!nombre || !descripcion || !precio || !id_categoria || !req.file) {
        const userId = req.session.user.id;
        const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
        const categorias = await Categoria.findAll({ where: { id_comercio: comercio.id } });
        return res.render('comercio/productos/create', { title: 'Crear Producto', error: 'Todos los campos son requeridos', categorias });
      }
      const userId = req.session.user.id;
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      await Producto.create({
        nombre,
        descripcion,
        precio,
        imagen: req.file.filename,
        id_categoria,
        id_comercio: comercio.id
      });
      res.redirect('/comercio/productos');
    } catch (error) {
      console.error("Error en createProducto:", error);
      res.redirect('/comercio/productos');
    }
  },

  showEditProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findByPk(id);
      if (!producto) return res.redirect('/comercio/productos');
      const userId = req.session.user.id;
      const comercio = await Comercio.findOne({ where: { id_usuario: userId } });
      const categorias = await Categoria.findAll({ where: { id_comercio: comercio.id } });
      res.render('comercio/productos/edit', { title: 'Editar Producto', producto, categorias });
    } catch (error) {
      console.error("Error en showEditProducto:", error);
      res.redirect('/comercio/productos');
    }
  },

  updateProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, id_categoria } = req.body;
      if (!nombre || !descripcion || !precio || !id_categoria) {
        // Es posible que se envíen datos incompletos
        return res.redirect('/comercio/productos');
      }
      const producto = await Producto.findByPk(id);
      if (!producto) return res.redirect('/comercio/productos');
      producto.nombre = nombre;
      producto.descripcion = descripcion;
      producto.precio = precio;
      producto.id_categoria = id_categoria;
      // Si se sube una nueva imagen, actualizar y eliminar la antigua
      if (req.file) {
        // Eliminar la imagen antigua
        if (producto.imagen) {
          const oldImagePath = path.join(productosDir, producto.imagen);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error al eliminar imagen antigua:", err);
          });
        }
        producto.imagen = req.file.filename;
      }
      await producto.save();
      res.redirect('/comercio/productos');
    } catch (error) {
      console.error("Error en updateProducto:", error);
      res.redirect('/comercio/productos');
    }
  },

  deleteProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findByPk(id);
      if (producto && producto.imagen) {
        const imagePath = path.join(productosDir, producto.imagen);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error al eliminar imagen del producto:", err);
        });
      }
      await Producto.destroy({ where: { id } });
      res.redirect('/comercio/productos');
    } catch (error) {
      console.error("Error en deleteProducto:", error);
      res.redirect('/comercio/productos');
    }
  },

  /*
    CERRAR SESIÓN
  */
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  }
};
