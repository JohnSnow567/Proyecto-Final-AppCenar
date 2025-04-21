const express = require('express');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const app = express();

// Importar modelos
const db = require('./models');

// Middlewares para parsear el body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_clave_secreta_mas_segura_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
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

// Configuración de Handlebars
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    formatDate: (date) => date ? new Date(date).toLocaleString() : 'N/A',
    formatDateTime: function(date) {
      return new Date(date).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    gte: (a, b) => a >= b,
    multiply: (a, b) => a * b,
    calculateTax: (amount, percent) => (amount * (percent / 100)).toFixed(2),
    add: (a, b) => a + b,
    if: function(conditional, options) {
      return conditional ? options.fn(this) : options.inverse(this);
    },
    ifEquals: function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    json: (context) => JSON.stringify(context),
    lookup: (obj, key) => obj && obj[key],
    concat: function() {
      return Array.prototype.slice.call(arguments, 0, -1).join('');
    },
    selected: (a, b) => a == b ? 'selected' : '',
    includes: (arr, val) => Array.isArray(arr) && arr.includes(val),
    toFixed:  (num, decimals) => parseFloat(num).toFixed(decimals)

  },
  partialsDir: [
    path.join(__dirname, 'views/partials'),
    path.join(__dirname, 'views/cliente/partials')
  ],
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Carpeta para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
const authRoutes = require('./routes/authRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const comercioRoutes = require('./routes/comercioRoutes')



app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', comercioRoutes);
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
    layout: 'main'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// Función para sincronizar la base de datos
async function syncDatabase() {
  try {
    // Desactivar verificaciones de claves foráneas
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sincronizar modelos en el orden correcto
    await db.TipoComercio.sync({ force: false });
    await db.Usuario.sync({ force: false });
    await db.Comercio.sync({ force: false });
    await db.Categoria.sync({ force: false });
    await db.Producto.sync({ force: false });
    await db.Direccion.sync({ force: false });
    await db.Pedido.sync({ force: false });
    await db.DetallePedido.sync({ force: false });
    await db.Favorito.sync({ force: false });
    
    // Reactivar verificaciones de claves foráneas
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Base de datos sincronizada correctamente');
    return true;
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
    return false;
  }
}

// Iniciar aplicación después de sincronizar la base de datos
syncDatabase().then(success => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } else {
    console.error('No se pudo iniciar el servidor debido a errores en la base de datos');
  }
});