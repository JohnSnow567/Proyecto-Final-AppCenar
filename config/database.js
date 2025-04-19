module.exports = {
    development: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '030724',
      database: process.env.DB_NAME || 'appcenar',
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false
    },
    test: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'password',
      database: process.env.DB_NAME || 'appcenar_test',
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: 'mysql',
      logging: false
    },
    production: {
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false
    }
  };
  