const { Usuario, Comercio, Configuracion, TipoComercio, Pedido, Producto } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const iconosDir = path.join(__dirname, '../public/images/uploads/iconos');
const perfilesDir = path.join(__dirname, '../public/images/uploads/perfiles');

module.exports = {
  // Dashboard: indicadores generales y menú
  showDashboard: async (req, res) => {
    try {
      // Contadores para pedidos
      const totalPedidos = await Pedido.count();
      const pedidosHoy = await Pedido.count({
        where: {
          fecha_hora: {
            [Op.gte]: fn('CURDATE')
          }
        }
      });
      // Contadores para usuarios según rol y estado
      const clientesActivos = await Usuario.count({ where: { rol: 'cliente', estado: 'activo' } });
      const clientesInactivos = await Usuario.count({ where: { rol: 'cliente', estado: 'inactivo' } });
      const deliveryActivos = await Usuario.count({ where: { rol: 'delivery', estado: 'activo' } });
      const deliveryInactivos = await Usuario.count({ where: { rol: 'delivery', estado: 'inactivo' } });
      const comerciosActivos = await Usuario.count({ where: { rol: 'comercio', estado: 'activo' } });
      const comerciosInactivos = await Usuario.count({ where: { rol: 'comercio', estado: 'inactivo' } });
      const totalProductos = await Producto.count();

      res.render('admin/dashboard', {
        title: 'Dashboard Administrador',
        indicadores: {
          totalPedidos,
          pedidosHoy,
          clientesActivos,
          clientesInactivos,
          deliveryActivos,
          deliveryInactivos,
          comerciosActivos,
          comerciosInactivos,
          totalProductos
        }
      });
    } catch (error) {
      console.error("Error en dashboard:", error);
      res.render('admin/dashboard', { title: 'Dashboard Administrador', error: 'Error en el servidor', indicadores: {} });
    }
  },

  // Listado de Clientes: incluye nombre, apellido, teléfono, correo y cantidad de pedidos
  listClientes: async (req, res) => {
    try {
      const clientes = await Usuario.findAll({
        where: { rol: 'cliente' },
        include: [{
          model: Pedido,
          as: 'pedidosCliente',
          attributes: []
        }],
        attributes: {
          include: [[fn('COUNT', col('pedidosCliente.id')), 'pedidoCount']]
        },
        group: ['Usuario.id'],
        order: [['nombre', 'ASC']]
      });
      res.render('admin/listClientes', { title: 'Listado de Clientes', usuarios: clientes });
    } catch (error) {
      console.error("Error en listClientes:", error);
      res.render('admin/listClientes', { title: 'Listado de Clientes', error: 'Error en el servidor', usuarios: [] });
    }
  },

  // Listado de Delivery: incluye nombre, apellido, teléfono, correo y cantidad de pedidos entregados
  listDelivery: async (req, res) => {
    try {
      const deliveries = await Usuario.findAll({
        where: { rol: 'delivery' },
        include: [{
          model: Pedido,
          as: 'pedidosDelivery',
          attributes: []
        }],
        attributes: {
          include: [[fn('COUNT', col('pedidosDelivery.id')), 'pedidoCount']]
        },
        group: ['Usuario.id'],
        order: [['nombre', 'ASC']]
      });
      res.render('admin/listDelivery', { title: 'Listado de Delivery', usuarios: deliveries });
    } catch (error) {
      console.error("Error en listDelivery:", error);
      res.render('admin/listDelivery', { title: 'Listado de Delivery', error: 'Error en el servidor', usuarios: [] });
    }
  },

  // Listado de Comercios: muestra información del comercio y cantidad de pedidos asociados
  listComercios: async (req, res) => {
    try {
      const comercios = await Comercio.findAll({
        include: [
          { model: Usuario, as: 'usuario', attributes: ['correo', 'telefono', 'estado'] },
          { model: Pedido, as: 'pedidos', attributes: [] }
        ],
        attributes: {
          include: [[fn('COUNT', col('pedidos.id')), 'pedidoCount']]
        },
        group: ['Comercio.id'],
        order: [['nombre_comercio', 'ASC']]
      });
      res.render('admin/listComercios', { title: 'Listado de Comercios', comercios });
    } catch (error) {
      console.error("Error en listComercios:", error);
      res.render('admin/listComercios', { title: 'Listado de Comercios', error: 'Error en el servidor', comercios: [] });
    }
  },

  // Mantenimiento de Configuración: mostrar la configuración actual
  showConfiguracion: async (req, res) => {
    try {
      const config = await Configuracion.findOne();
      res.render('admin/configuracion', { title: 'Mantenimiento de Configuración', config, error: null });
    } catch (error) {
      console.error("Error en showConfiguracion:", error);
      res.render('admin/configuracion', { title: 'Mantenimiento de Configuración', error: 'Error en el servidor', config: {} });
    }
  },

  // Editar Configuración: mostrar el formulario con la configuración actual
  editConfiguracion: async (req, res) => {
    try {
      const config = await Configuracion.findOne();
      res.render('admin/editConfiguracion', { title: 'Editar Configuración', config, error: null });
    } catch (error) {
      console.error("Error en editConfiguracion:", error);
      res.redirect('/admin/configuracion');
    }
  },

  // Actualizar Configuración: valida y guarda los nuevos valores
  updateConfiguracion: async (req, res) => {
    try {
      const { itbis } = req.body;
      if (!itbis) {
        const config = await Configuracion.findOne();
        return res.render('admin/editConfiguracion', { title: 'Editar Configuración', error: 'El campo ITBIS es requerido', config });
      }
      const config = await Configuracion.findOne();
      config.itbis = itbis;
      await config.save();
      res.redirect('/admin/configuracion');
    } catch (error) {
      console.error("Error en updateConfiguracion:", error);
      res.render('admin/editConfiguracion', { title: 'Editar Configuración', error: 'Error en el servidor' });
    }
  },

  // Mantenimiento de Administradores: listado de administradores
  listAdministradores: async (req, res) => {
    try {
      const administradores = await Usuario.findAll({ where: { rol: 'administrador' }, order: [['nombre', 'ASC']] });
      res.render('admin/listAdministradores', { title: 'Listado de Administradores', administradores, currentAdminId: req.session.id });
    } catch (error) {
      console.error("Error en listAdministradores:", error);
      res.render('admin/listAdministradores', { title: 'Listado de Administradores', error: 'Error en el servidor', administradores: [] });
    }
  },

  // Mostrar formulario para crear un administrador
  showCreateAdmin: (req, res) => {
    res.render('admin/createAdmin', { title: 'Crear Administrador', error: null });
  },

  // Crear administrador
  createAdmin: async (req, res) => {
    try {
      const { nombre, apellido, correo, telefono, usuario, password, confirmPassword } = req.body;
      const foto = req.file ? req.file.filename : null;
      if (!nombre || !apellido  || !correo || !telefono || !usuario || !foto || !password || !confirmPassword) {
        return res.render('admin/createAdmin', { title: 'Crear Administrador', error: 'Todos los campos son requeridos' });
      }
      if (password !== confirmPassword) {
        return res.render('admin/createAdmin', { title: 'Crear Administrador', error: 'Las contraseñas no coinciden' });
      }
      const existing = await Usuario.findOne({ where: { [Op.or]: [{ correo }, { usuario }] } });
      if (existing) {
        return res.render('admin/createAdmin', { title: 'Crear Administrador', error: 'El correo o usuario ya existe' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await Usuario.create({
        nombre,
        apellido,
        correo,
        telefono,
        usuario,
        foto,
        contrasena: hashedPassword,
        rol: 'administrador',
        estado: 'activo'
      });
      res.redirect('/admin/administradores');
    } catch (error) {
      console.error("Error en createAdmin:", error);
      res.render('admin/createAdmin', { title: 'Crear Administrador', error: 'Error en el servidor' });
    }
  },

    // Mostrar formulario para editar un administrador (solo para rol "administrador")
  showEditAdmin: async (req, res) => {
     try {
         const { id } = req.params;
               
        if (parseInt(req.session.user.id) === parseInt(id)) {
          return res.redirect('/admin/administradores');
        }
         const admin = await Usuario.findOne({ where: { id, rol: 'administrador' } });
         if (!admin) {
         return res.redirect('/admin/administradores');
        }
         res.render('admin/editAdmin', { title: 'Editar Administrador', admin, error: null });
      } catch (error) {
            console.error("Error en showEditAdmin:", error);
            res.redirect('/admin/administradores');
        }
    },

    // Procesar la edición de administrador
    updateAdmin: async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo, telefono, usuario, password, confirmPassword } = req.body;
        const newFoto = req.file ? req.file.filename : null;

        // Validar campos obligatorios
        if (!nombre || !apellido || !correo || !telefono || !usuario) {
        return res.render('admin/editAdmin', {
            title: 'Editar Administrador',
            error: 'Todos los campos son requeridos',
            admin: req.body
        });
        }

        const admin = await Usuario.findOne({ where: { id, rol: 'administrador' } });
        if (!admin) {
        return res.redirect('/admin/administradores');
        }

          // Si se subió una nueva foto y existe una anterior, se elimina el archivo antiguo.
        if (newFoto && admin.foto) {
          const oldImagePath = path.join(perfilesDir, admin.foto);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error("Error al eliminar imagen antigua:", err);
            } else {
              console.log("Imagen antigua eliminada:", oldImagePath);
            }
          });
        }

        // Actualizar los datos básicos
        admin.nombre = nombre;
        admin.apellido = apellido;
        admin.correo = correo;
        admin.usuario = usuario;
        admin.telefono = telefono;
        if (newFoto) {
          admin.foto = newFoto;
        }

        // Si se proporcionan contraseñas (se entiende que se desea cambiar la contraseña)
        if (password || confirmPassword) {
          if (password !== confirmPassword) {
              return res.render('admin/editAdmin', {
              title: 'Editar Administrador',
              error: 'Las contraseñas no coinciden',
              admin: req.body
              });
          }
          admin.contrasena = await bcrypt.hash(password, 10);
        }

        await admin.save();
        res.redirect('/admin/administradores');
    } catch (error) {
        console.error("Error en updateAdmin:", error);
        res.render('admin/editAdmin', {
        title: 'Editar Administrador',
        error: 'Error en el servidor',
        admin: req.body
        });
    }
    },

  toggleClientStatus: async(req, res) => {
    try{
      const { id } = req.params;
      const Cliente = await Usuario.findByPk(id);
      if(Cliente) {
        Cliente.estado = Cliente.estado === 'activo' ? 'inactivo' : 'activo';
        await Cliente.save();
        res.redirect('/admin/clientes');
      }

    }
    catch (error){
      console.error("Error en toggleClientStatus:", error);
      res.redirect('/admin/clientes')
    }
  },

  toggleDeliveryStatus: async(req, res) => {
    try{
      const { id } = req.params;
      const Delivery = await Usuario.findByPk(id);
      if(Delivery) {
        Delivery.estado = Delivery.estado === 'activo' ? 'inactivo' : 'activo';
        await Delivery.save();
        res.redirect('/admin/delivery');
      }

    }
    catch (error){
      console.error("Error en toggleDeliveryStatus:", error);
      res.redirect('/admin/delivery')
    }
  },

  toggleComercioStatus: async(req, res) => {
    try{
      const { id } = req.params;
      const Comercio = await Usuario.findByPk(id);
      if(Comercio) {
        Comercio.estado = Comercio.estado === 'activo' ? 'inactivo' : 'activo';
        await Comercio.save();
        res.redirect('/admin/comercios');
      }

    }
    catch (error){
      console.error("Error en toggleComercioStatus:", error);
      res.redirect('/admin/comercios')
    }
  },

  toggleAdminStatus: async (req, res) => {
    try {
      // Extraer 'id' de los parámetros de la URL
      const { id } = req.params;
      // Verifica que el administrador logueado no intente modificar su propio estado
      if (parseInt(req.session.user.id) === parseInt(id)) {
        return res.redirect('/admin/administradores');
      }
      // Buscar el administrador por su ID
      const admin = await Usuario.findByPk(id);
      if (admin) {
        admin.estado = admin.estado === 'activo' ? 'inactivo' : 'activo';
        await admin.save();
      }
      res.redirect('/admin/administradores');
    } catch (error) {
      console.error("Error en toggleAdminStatus:", error);
      res.redirect('/admin/administradores');
    }
  },
  

  // Mantenimiento de Tipos de Comercios: listado
  listTiposComercios: async (req, res) => {
    try {
      const tipos = await TipoComercio.findAll({ order: [['nombre', 'ASC']] });
      res.render('admin/listTipos', { title: 'Mantenimiento de Tipos de Comercios', tipos });
    } catch (error) {
      console.error("Error en listTiposComercios:", error);
      res.render('admin/listTipos', { title: 'Mantenimiento de Tipos de Comercios', error: 'Error en el servidor', tipos: [] });
    }
  },

  // Mostrar formulario para crear un nuevo tipo de comercio
  showCreateTipo: (req, res) => {
    res.render('admin/createTipo', { title: 'Crear Tipo de Comercio', error: null });
  },

  // Crear tipo de comercio (subida de icono con Multer)
  createTipo: async (req, res) => {
    try {
      const { nombre, descripcion } = req.body;
      const icono = req.file ? req.file.filename : null;
      if (!nombre || !descripcion || !icono) {
        return res.render('admin/createTipo', { title: 'Crear Tipo de Comercio', error: 'Todos los campos son requeridos' });
      }
      await TipoComercio.create({ nombre, descripcion, icono });
      res.redirect('/admin/tipos');
    } catch (error) {
      console.error("Error en createTipo:", error);
      res.render('admin/createTipo', { title: 'Crear Tipo de Comercio', error: 'Error en el servidor' });
    }
  },

  // Mostrar formulario para editar un tipo de comercio existente
  showEditTipo: async (req, res) => {
    try {
      const { id } = req.params;
      const tipo = await TipoComercio.findByPk(id);
      if (!tipo) {
        return res.redirect('/admin/tipos');
      }
      res.render('admin/editTipo', { title: 'Editar Tipo de Comercio', tipo, error: null });
    } catch (error) {
      console.error("Error en showEditTipo:", error);
      res.redirect('/admin/tipos');
    }
  },

  // Actualizar un tipo de comercio: si se sube un icono, se actualiza; de lo contrario, se mantiene el actual
  updateTipo: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      const newIcono = req.file ? req.file.filename : null;
      const tipo = await TipoComercio.findByPk(id);
      if (!tipo) {
        return res.redirect('/admin/tipos');
      }

      // Si se subió un nuevo icono y existe uno anterior, se elimina el archivo antiguo.
      if (newIcono && tipo.icono) {
        const oldImagePath = path.join(iconosDir, tipo.icono);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Error al eliminar imagen antigua:", err);
          } else {
            console.log("Imagen antigua eliminada:", oldImagePath);
          }
        });
      }

      // Actualizar los campos
      tipo.nombre = nombre;
      tipo.descripcion = descripcion;
      if (newIcono) {
        tipo.icono = newIcono;
      }

      await tipo.save();
      res.redirect('/admin/tipos');
    } catch (error) {
      console.error("Error en updateTipo:", error);
      res.render('admin/editTipo', { title: 'Editar Tipo de Comercio', error: 'Error en el servidor', tipo: req.body });
    }
  },

  // Eliminar un tipo de comercio (y, según requerimiento, se eliminarían todos los comercios asociados)
  deleteTipo: async (req, res) => {
    try {
      const { id } = req.params;
      // Buscar el registro para obtener el nombre del archivo del icono
      const tipo = await TipoComercio.findByPk(id);
      if (tipo && tipo.icono) {
        const imagePath = path.join(iconosDir, tipo.icono);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error al eliminar la imagen del tipo:", err);
          } else {
            console.log("Imagen eliminada correctamente:", imagePath);
          }
        });
      }
      // Eliminar el registro de la base de datos.
      await TipoComercio.destroy({ where: { id } });
      res.redirect('/admin/tipos');
    } catch (error) {
      console.error("Error en deleteTipo:", error);
      res.redirect('/admin/tipos');
    }
  },

  // Cerrar sesión: destruir la sesión y redirigir al login
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  }
};
