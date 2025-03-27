const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'Pepeburner123456@gmail.com', 
    pass: 'csat bttc cmgn orxp'
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = transporter;
