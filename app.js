const express = require('express');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars');
const app = express();

// Importar modelo (inicializar Sequelize y sincronizar la BD si se desea)
const db = require('./models');
db.sequelize.sync();

// Middlewares para parsear el body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_clave_secreta',
  resave: false,
  saveUninitialized: false
}));

// Carpeta para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Handlebars
app.engine('hbs', 
    exphbs.engine({
    defaultLayout: 'main', 
    extname: "hbs",
    helpers: {
      eq: function(a, b){
        return a == b;
      },
      neq: function(a, b){
        return a !== b;
      }
    }}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
const authRoutes = require('./routes/authroutes');
app.use('/', authRoutes);
app.use('/', require ('./routes/adminRoutes'));

// Ruta raíz redirige a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Manejo de errores básico (opcional)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Error en el servidor');
});

// Arrancar el servidor
const PORT = process.env.PORT || 3000;
const models = require('./models');
models.sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
