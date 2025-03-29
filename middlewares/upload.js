const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'src/uploads/';
    if (file.fieldname === 'foto') {
      dest += 'perfiles/';
    } else if (file.fieldname === 'logo') {
      dest += 'logos/';
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
module.exports = upload;
