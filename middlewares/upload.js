const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '../public/images/uploads'); // Ajusta la ruta según tu estructura

// Función para asegurar que el directorio exista
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = baseDir;    
    if (file.fieldname === 'foto') {
      dest = path.join(baseDir, 'perfiles');
    } else if (file.fieldname === 'logo') {
      dest = path.join(baseDir, 'logos');
    } else if (file.fieldname === 'icono') {
      dest = path.join(baseDir, 'iconos');
    } else if (file.fieldname === 'producto') {
      dest = path.join(baseDir, 'productos');
    }
    // Aseguramos que el directorio destino existe
    ensureDirExists(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
module.exports = upload;

