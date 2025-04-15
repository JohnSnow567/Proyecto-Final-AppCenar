const express = require('express');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const app = express();


// Importar modelos y sincronizar la BD
const db = require('./models');
db.sequelize.sync()
  .then(() => console.log('Base de datos conectada y sincronizada'))
  .catch(err => console.error('Error al sincronizar la base de datos:', err));

// Middlewares para parsear el body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_clave_secreta_mas_segura_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Cambiar a true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
}));

// Middleware para mensajes flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null;
  next();
});

// Configuración de Handlebars con helpers adicionales
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    // Helpers para fechas y comparaciones
    formatDate: (date) => date ? new Date(date).toLocaleString() : 'N/A',
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    
    // Helpers matemáticos
    multiply: (a, b) => a * b,
    calculateTax: (amount, percent) => (amount * (percent / 100)).toFixed(2),
    add: (a, b) => a + b,
    
    // Helpers para lógica condicional
    if: function(conditional, options) {
      return conditional ? options.fn(this) : options.inverse(this);
    },
    ifEquals: function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    
    // Helpers para manipulación de datos
    json: (context) => JSON.stringify(context),
    lookup: (obj, key) => obj && obj[key],
    concat: function() {
      return Array.prototype.slice.call(arguments, 0, -1).join('');
    },
    
    // Helper para seleccionar opciones en forms
    selected: (a, b) => a == b ? 'selected' : ''
  },
  partialsDir: [
    path.join(__dirname, 'views/partials'),
    path.join(__dirname, 'views/cliente/partials')
  ]
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Carpeta para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
const authRoutes = require('./routes/authRoutes');
const deliveryRoutes = require('./routes/delivery/deliveryRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

// Importar otras rutas según necesites (cliente, comercio, admin)
app.use('/', authRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/cliente', clienteRoutes);

// Ruta raíz redirige a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: err.message || 'Error en el servidor',
    title: 'Error',
    layout: 'main'  // Asegúrate de tener este layout
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
