module.exports = (sequelize, DataTypes) => {
    const Pedido = sequelize.define('Pedido', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, 
      id_cliente: { type: DataTypes.INTEGER, allowNull: false },
      id_comercio: { type: DataTypes.INTEGER, allowNull: false },
      id_delivery: { type: DataTypes.INTEGER, allowNull: true },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      fecha_hora: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      estado: { type: DataTypes.ENUM('pendiente', 'en proceso', 'completado'), allowNull: false }
    }, {
      tableName: 'pedidos',
      timestamps: false
    });
  
    Pedido.associate = function(models) {
      Pedido.belongsTo(models.Usuario, { foreignKey: 'id_cliente', as: 'cliente' });
      Pedido.belongsTo(models.Comercio, { foreignKey: 'id_comercio', as: 'comercio' });
      Pedido.belongsTo(models.Usuario, { foreignKey: 'id_delivery', as: 'delivery' });
      Pedido.hasMany(models.DetallePedido, { foreignKey: 'id_pedido', as: 'detalles' });
      Pedido.belongsToMany(models.Producto, { through: models.DetallePedido, foreignKey: 'id_pedido', otherKey: 'id_producto', as: 'productos' });
      Pedido.belongsTo(models.Direccion, { foreignKey: 'id_direccion', as: 'direccion'});
    };
  
    return Pedido;
  };
