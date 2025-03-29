module.exports = (sequelize, DataTypes) => {
    const Usuario = sequelize.define('Usuario', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: DataTypes.STRING(50), allowNull: false },
      apellido: { type: DataTypes.STRING(50), allowNull: false },
      correo: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      telefono: { type: DataTypes.STRING(20) },
      foto: { type: DataTypes.STRING(255) },
      usuario: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      contrasena: { type: DataTypes.STRING(255), allowNull: false },
      rol: { type: DataTypes.ENUM('cliente', 'delivery', 'comercio', 'administrador'), allowNull: false },
      estado: { type: DataTypes.ENUM('activo', 'inactivo'), defaultValue: 'inactivo' },
      fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
      tableName: 'usuarios',
      timestamps: false
    });
  
    Usuario.associate = function(models) {
      // Relación: Si el usuario es comercio, tiene un registro en Comercios.
      Usuario.hasOne(models.Comercio, { foreignKey: 'id_usuario', as: 'comercio' });
      // Relación para pedidos y direcciones en rol cliente.
      Usuario.hasMany(models.Pedido, { foreignKey: 'id_cliente', as: 'pedidosCliente' });
      Usuario.hasMany(models.Pedido, { foreignKey: 'id_delivery', as: 'pedidosDelivery' });
      Usuario.hasMany(models.Direccion, { foreignKey: 'id_cliente', as: 'direcciones' });
      Usuario.hasMany(models.Favorito, { foreignKey: 'id_cliente', as: 'favoritos' });
    };
  
    return Usuario;
  };
  