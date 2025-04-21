const { Usuario, Comercio, TipoComercio, Direccion } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const crypto = require('crypto');
const transporter = require('../config/mailer')

module.exports = {
  showLogin: (req, res) => {
    if (req.session && req.session.user) {
      const { rol } = req.session.user;
      switch (rol) {
        case 'cliente':
          return res.redirect('/cliente/home');
        case 'delivery':
          return res.redirect('/delivery');
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
        where: { [Op.or]: [{ correo: correo_usuario }, { usuario: correo_usuario }] },
        include: [{ model: Direccion, as: 'direcciones' }]
      });

      if (!usuario) {
        return res.render('login', { title: 'Login', error: "Datos de acceso incorrectos" });
      }

      const validPassword = await bcrypt.compare(password, usuario.contrasena);
      if (!validPassword) {
        return res.render('login', { title: 'Login', error: "Datos de acceso incorrectos" });
      }

      if (usuario.estado === 'inactivo') {
        return res.render('login', { 
          title: 'Login', 
          error: "Cuenta inactiva. Revise su correo o contacte a un administrador" 
        });
      }

      req.session.user = usuario.get({ plain: true });
      
      switch (usuario.rol) {
        case 'cliente':
          return res.redirect('/cliente/home');
        case 'delivery':
          return res.redirect('/delivery');
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
    res.render('login/registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: null });
  },

  registerClienteDelivery: async (req, res) => {
    try {
      const { nombre, apellido, telefono, correo, usuario, rol, password, confirmPassword } = req.body;
      // Validar campos
      if (!nombre || !apellido || !telefono || !correo || !usuario || !rol || !password || !confirmPassword) {
        return res.render('login/registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'Todos los campos son requeridos' });
      }
      if (password !== confirmPassword) {
        return res.render('login/registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'Las contraseñas no coinciden' });
      }
      // Validar que correo y usuario sean únicos
      const existingUser = await Usuario.findOne({ where: { [Op.or]: [{ correo }, { usuario }] } });
      if (existingUser) {
        return res.render('login/registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'El correo o usuario ya existe' });
      }
      // Subir foto de perfil (req.file viene de Multer)
      const foto = req.file ? req.file.filename : null;
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generar token de activación
      const activationToken = crypto.randomBytes(20).toString('hex');

      // Crear el usuario con estado inactivo
      await Usuario.create({
        nombre, apellido, telefono, correo, usuario,
        foto,
        contrasena: hashedPassword,
        rol, // debe ser 'cliente' o 'delivery'
        estado: 'inactivo',
        activationToken
      });
      
       // Generar el enlace de activación (ajusta el dominio y puerto si es necesario)
       const activationLink = `http://localhost:3000/activate/${activationToken}`;

       // Configurar el correo de activación
       const mailOptions = {
         from: 'Appcenar@gmail.com', // Remitente
         to: correo,                    // Destinatario: el correo del usuario
         subject: 'Activa tu cuenta en AppCenar',
         text: `Por favor, activa tu cuenta haciendo click en el siguiente enlace: ${activationLink}`,
         html: `<p>Por favor, activa tu cuenta haciendo click en el siguiente enlace:</p><a href="${activationLink}">${activationLink}</a>`
       };
 
       // Enviar correo de activación
       await transporter.sendMail(mailOptions);

      res.render('login/registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: 'Registro exitoso. Revise su correo para activar la cuenta.' });
    } catch (error) {
      console.error("Error en registro cliente/delivery:", error);
      res.render('login/registerClienteDelivery', { title: 'Registro Cliente/Delivery', error: "Error en el servidor" });
    }
  },

  // Registro para Comercio
  showRegisterComercio: async (req, res) => {
    try {
      const tipos = await TipoComercio.findAll(); // Para llenar el select
      res.render('login/registerComercio', { title: 'Registro Comercio', error: null, tipos });
    } catch (error) {
      console.error(error);
      res.render('login/registerComercio', { title: 'Registro Comercio', error: 'Error al cargar tipos de comercio' });
    }
  },

  registerComercio: async (req, res) => {
    try {
      const { nombre_comercio, telefono, correo, hora_apertura, hora_cierre, id_tipo_comercio, password, confirmPassword } = req.body;
      if (!nombre_comercio || !telefono || !correo || !hora_apertura || !hora_cierre || !id_tipo_comercio || !password || !confirmPassword) {
        return res.render('login/registerComercio', { title: 'Registro Comercio', error: 'Todos los campos son requeridos' });
      }
      if (password !== confirmPassword) {
        return res.render('login/registerComercio', { title: 'Registro Comercio', error: 'Las contraseñas no coinciden' });
      }
      // Validar que correo y usuario sean únicos (en este caso, usuario se usará para el comercio)
      const existingUser = await Usuario.findOne({ where: { correo } });
      if (existingUser) {
        return res.render('login/registerComercio', { title: 'Registro Comercio', error: 'El correo ya existe' });
      }
      // Subir logo (req.file)
      const logo = req.file ? req.file.filename : null;
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generar token de activación
      const activationToken = crypto.randomBytes(20).toString('hex');

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
        estado: 'inactivo',
        activationToken
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
      
      // Generar el enlace de activación (ajusta el dominio y puerto si es necesario)
      const activationLink = `http://localhost:3000/activate/${activationToken}`;

      // Configurar el correo de activación
      const mailOptions = {
       from: 'Appcenar@gmail.com', // Remitente
       to: correo,                    // Destinatario: el correo del usuario
       subject: 'Activa tu cuenta en AppCenar',
       text: `Por favor, activa tu cuenta haciendo click en el siguiente enlace: ${activationLink}`,
       html: `<p>Por favor, activa tu cuenta haciendo click en el siguiente enlace:</p><a href="${activationLink}">${activationLink}</a>`
      };
       
      // Enviar correo de activación
       await transporter.sendMail(mailOptions);
             
      res.render('login/registerComercio', { title: 'Registro Comercio', error: 'Registro exitoso. Revise su correo para activar la cuenta.' });
    } catch (error) {
      console.error("Error en registro comercio:", error);
      res.render('login/registerComercio', { title: 'Registro Comercio', error: "Error en el servidor" });
    }
  },

  // Solicitud de restablecimiento de contraseña
  showResetPassword: (req, res) => {
    res.render('login/resetPassword', { title: 'Restablecer Contraseña', error: null });
  },

  processResetPasswordRequest: async (req, res) => {
    try {
      const { correo_usuario } = req.body;
      if (!correo_usuario) {
        return res.render('login/resetPassword', { title: 'Restablecer Contraseña', error: 'El campo es requerido' });
      }
      const usuario = await Usuario.findOne({
        where: { [Op.or]: [{ correo: correo_usuario }, { usuario: correo_usuario }] }
      });
      if (!usuario) {
        return res.render('login/resetPassword', { title: 'Restablecer Contraseña', error: 'No se encontró usuario con esos datos' });
      }
      const resetToken = crypto.randomBytes(20).toString('hex');
      usuario.resetToken = resetToken; 
      await usuario.save();

      const resetLink = `http://localhost:3000/resetPassword/${resetToken}`;

      const mailOptions = {
       from: 'Appcenar@gmail.com', 
       to: usuario.correo,                  
       subject: 'Solicitud de cambio de contraseña en AppCenar',
       text: `Se ha solicitado un cambio de contraseña en su cuenta de AppCenar,  
              haga click en el siguiente enlace para reestablacerla: ${resetLink}`,
       html: `<p>Se ha solicitado un cambio de contraseña en su cuenta de AppCenar,  
              haga click en el siguiente enlace para reestablacerla::</p><a href="${resetLink}">${resetLink}</a>`
      };
      
      await transporter.sendMail(mailOptions);

      res.render('login/resetPassword', { title: 'Restablecer Contraseña', error: 'Se ha enviado un correo con las instrucciones para restablecer la contraseña' });
    } catch (error) {
      console.error("Error en restablecer contraseña:", error);
      res.render('login/resetPassword', { title: 'Restablecer Contraseña', error: 'Error en el servidor' });
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
      res.render('login/newPassword', { title: 'Nueva Contraseña', error: null, token });
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
        return res.render('login/newPassword', { title: 'Nueva Contraseña', error: 'Todos los campos son requeridos', token });
      }
      if (password !== confirmPassword) {
        return res.render('login/newPassword', { title: 'Nueva Contraseña', error: 'Las contraseñas no coinciden', token });
      }
      const usuario = await Usuario.findOne({ where: { resetToken: token } });
      if (!usuario) {
        return res.send("Token inválido o expirado");
      }
      usuario.contrasena = await bcrypt.hash(password, 10);
      usuario.resetToken = null;
      await usuario.save();
      res.render('login', { title: 'Login', error: 'Contraseña actualizada. Inicie sesión.' });
    } catch (error) {
      console.error(error);
      res.render('login/newPassword', { title: 'Nueva Contraseña', error: 'Error en el servidor', token: req.params.token });
    }
  },

  // Método para activar la cuenta mediante el token de activación
  activateAccount: async (req, res) => {
    try {
      const { token } = req.params;
      // Buscar usuario que tenga el token de activación
      const usuario = await Usuario.findOne({ where: { activationToken: token } });
      if (!usuario) {
        return res.render('login', { title: 'Activación de Cuenta', error: 'Token inválido o expirado' });
      }
      // Actualizar estado a 'activo' y limpiar el token
      usuario.estado = 'activo';
      usuario.activationToken = null;
      await usuario.save();
      // Renderizamos la vista de login con mensaje de éxito
      res.render('login', { title: 'Login', error: 'Cuenta activada exitosamente. Por favor, inicie sesión.' });
    } catch (error) {
      console.error("Error en activateAccount:", error);
      res.render('login', { title: 'Activación de Cuenta', error: 'Error en el servidor' });
    }
  },

  // Middleware para verificar rol de cliente
  checkCliente: (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'cliente') {
      return next();
    }
    req.flash('error_msg', 'Acceso restringido a clientes');
    res.redirect('/login');
  }
};