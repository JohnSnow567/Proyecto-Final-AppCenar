const { Usuario, Comercio, TipoComercio } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const crypto = require('crypto');

module.exports = {
  // Login existente
  showLogin: (req, res) => {
    if (req.session && req.session.user) {
      const { rol } = req.session.user;
      switch (rol) {
        case 'cliente':
          return res.redirect('/cliente/home');
        case 'delivery':
          return res.redirect('/delivery/home');
        case 'comercio':
          return res.redirect('/comercio/home');
        case 'administrador':
          return res.redirect('/admin/dashboard');
        default:
          break;
      }
    }
    res.render('login', { title: 'Login', error: null });
  },

  login: async (req, res) => {
    try {
      const { correo_usuario, password } = req.body;
      if (!correo_usuario || !password) {
        return res.render('login', { title: 'Login', error: "Todos los campos son requeridos" });
      }
      const usuario = await Usuario.findOne({
        where: { [Op.or]: [{ correo: correo_usuario }, { usuario: correo_usuario }] }
      });
      if (!usuario) {
        return res.render('login', { title: 'Login', error: "Datos de acceso incorrectos" });
      }
      const validPassword = await bcrypt.compare(password, usuario.contrasena);
      if (!validPassword) {
        return res.render('login', { title: 'Login', error: "Datos de acceso incorrectos" });
      }
      if (usuario.estado === 'inactivo') {
        return res.render('login', { title: 'Login', error: "Cuenta inactiva. Revise su correo o contacte a un administrador" });
      }
      req.session.user = usuario;
      switch (usuario.rol) {
        case 'cliente':
          return res.redirect('/cliente/home');
        case 'delivery':
          return res.redirect('/delivery/home');
        case 'comercio':
          return res.redirect('/comercio/home');
        case 'administrador':
          return res.redirect('/admin/dashboard');
        default:
          return res.redirect('/login');
      }
    } catch (error) {
      console.error("Error en login:", error);
      res.render('login', { title: 'Login', error: "Error en el servidor" });
    }
  },

  // Registro para Cliente/Delivery
  showRegisterClienteDelivery: (req, res) => {
    res.render('registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: null });
  },

  registerClienteDelivery: async (req, res) => {
    try {
      const { nombre, apellido, telefono, correo, usuario, rol, password, confirmPassword } = req.body;
      // Validar campos
      if (!nombre || !apellido || !telefono || !correo || !usuario || !rol || !password || !confirmPassword) {
        return res.render('registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'Todos los campos son requeridos' });
      }
      if (password !== confirmPassword) {
        return res.render('registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'Las contraseñas no coinciden' });
      }
      // Validar que correo y usuario sean únicos
      const existingUser = await Usuario.findOne({ where: { [Op.or]: [{ correo }, { usuario }] } });
      if (existingUser) {
        return res.render('registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'El correo o usuario ya existe' });
      }
      // Subir foto de perfil (req.file viene de Multer)
      const foto = req.file ? req.file.filename : null;
      const hashedPassword = await bcrypt.hash(password, 10);
      // Crear el usuario con estado inactivo
      await Usuario.create({
        nombre, apellido, telefono, correo, usuario,
        foto,
        contrasena: hashedPassword,
        rol, // debe ser 'cliente' o 'delivery'
        estado: 'inactivo'
      });
      // Aquí se debería enviar un correo de activación con un enlace
      res.render('registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'Registro exitoso. Revise su correo para activar la cuenta.' });
    } catch (error) {
      console.error("Error en registro cliente/delivery:", error);
      res.render('registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: "Error en el servidor" });
    }
  },

  // Registro para Comercio
  showRegisterComercio: async (req, res) => {
    try {
      const tipos = await TipoComercio.findAll(); // Para llenar el select
      res.render('registerComercio', { title: 'Registro Comercio', error: null, tipos });
    } catch (error) {
      console.error(error);
      res.render('registerComercio', { title: 'Registro Comercio', error: 'Error al cargar tipos de comercio' });
    }
  },

  registerComercio: async (req, res) => {
    try {
      const { nombre_comercio, telefono, correo, hora_apertura, hora_cierre, id_tipo_comercio, password, confirmPassword } = req.body;
      if (!nombre_comercio || !telefono || !correo || !hora_apertura || !hora_cierre || !id_tipo_comercio || !password || !confirmPassword) {
        return res.render('registerComercio', { title: 'Registro Comercio', error: 'Todos los campos son requeridos' });
      }
      if (password !== confirmPassword) {
        return res.render('registerComercio', { title: 'Registro Comercio', error: 'Las contraseñas no coinciden' });
      }
      // Validar que correo y usuario sean únicos (en este caso, usuario se usará para el comercio)
      const existingUser = await Usuario.findOne({ where: { correo } });
      if (existingUser) {
        return res.render('registerComercio', { title: 'Registro Comercio', error: 'El correo ya existe' });
      }
      // Subir logo (req.file)
      const logo = req.file ? req.file.filename : null;
      const hashedPassword = await bcrypt.hash(password, 10);
      // Crear usuario con rol comercio
      const newUsuario = await Usuario.create({
        nombre: nombre_comercio, // se puede almacenar el nombre del comercio en este campo o en otro campo específico
        apellido: '',
        correo,
        telefono,
        foto: logo,
        usuario: correo, // o generar un nombre de usuario a partir del nombre del comercio
        contrasena: hashedPassword,
        rol: 'comercio',
        estado: 'inactivo'
      });
      // Crear el registro en la tabla comercios
      await Comercio.create({
        id_usuario: newUsuario.id,
        nombre_comercio,
        logo,
        telefono,
        hora_apertura,
        hora_cierre,
        id_tipo_comercio
      });
      // Enviar correo de activación
      res.render('registerComercio', { title: 'Registro Comercio', error: 'Registro exitoso. Revise su correo para activar la cuenta.' });
    } catch (error) {
      console.error("Error en registro comercio:", error);
      res.render('registerComercio', { title: 'Registro Comercio', error: "Error en el servidor" });
    }
  },

  // Solicitud de restablecimiento de contraseña
  showResetPassword: (req, res) => {
    res.render('resetPassword', { title: 'Restablecer Contraseña', error: null });
  },

  processResetPasswordRequest: async (req, res) => {
    try {
      const { correo_usuario } = req.body;
      if (!correo_usuario) {
        return res.render('resetPassword', { title: 'Restablecer Contraseña', error: 'El campo es requerido' });
      }
      const usuario = await Usuario.findOne({
        where: { [Op.or]: [{ correo: correo_usuario }, { usuario: correo_usuario }] }
      });
      if (!usuario) {
        return res.render('resetPassword', { title: 'Restablecer Contraseña', error: 'No se encontró usuario con esos datos' });
      }
      // Generar token
      const token = crypto.randomBytes(20).toString('hex');
      usuario.resetToken = token; // Se asume que el modelo Usuario tiene esta propiedad
      await usuario.save();
      // Simular envío de correo
      console.log(`Envío de correo: Use el siguiente enlace para restablecer la contraseña: http://localhost:3000/resetPassword/${token}`);
      res.render('resetPassword', { title: 'Restablecer Contraseña', error: 'Se ha enviado un correo con las instrucciones para restablecer la contraseña' });
    } catch (error) {
      console.error("Error en restablecer contraseña:", error);
      res.render('resetPassword', { title: 'Restablecer Contraseña', error: 'Error en el servidor' });
    }
  },

  // Mostrar formulario para establecer nueva contraseña
  showNewPasswordForm: async (req, res) => {
    try {
      const { token } = req.params;
      const usuario = await Usuario.findOne({ where: { resetToken: token } });
      if (!usuario) {
        return res.send("Token inválido o expirado");
      }
      res.render('newPassword', { title: 'Nueva Contraseña', error: null, token });
    } catch (error) {
      console.error(error);
      res.send("Error en el servidor");
    }
  },

  // Procesar nueva contraseña
  processNewPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;
      if (!password || !confirmPassword) {
        return res.render('newPassword', { title: 'Nueva Contraseña', error: 'Todos los campos son requeridos', token });
      }
      if (password !== confirmPassword) {
        return res.render('newPassword', { title: 'Nueva Contraseña', error: 'Las contraseñas no coinciden', token });
      }
      const usuario = await Usuario.findOne({ where: { resetToken: token } });
      if (!usuario) {
        return res.send("Token inválido o expirado");
      }
      usuario.contrasena = await bcrypt.hash(password, 10);
      usuario.resetToken = null; // Limpiar token
      await usuario.save();
      res.render('login', { title: 'Login', error: 'Contraseña actualizada. Inicie sesión.' });
    } catch (error) {
      console.error(error);
      res.render('newPassword', { title: 'Nueva Contraseña', error: 'Error en el servidor', token: req.params.token });
    }
  }
};
