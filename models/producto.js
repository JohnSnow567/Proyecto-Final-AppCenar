module.exports = (sequelize, DataTypes) => {
    const Producto = sequelize.define('Producto', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_comercio: { type: DataTypes.INTEGER, allowNull: false },
      id_categoria: { type: DataTypes.INTEGER, allowNull: false },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      descripcion: { type: DataTypes.TEXT },
      precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      imagen: { type: DataTypes.STRING(255) }
    }, {
      tableName: 'productos',
      timestamps: false
    });
  
    Producto.associate = function(models) {
      Producto.belongsTo(models.Comercio, { foreignKey: 'id_comercio', as: 'comercio' });
      Producto.belongsTo(models.Categoria, { foreignKey: 'id_categoria', as: 'categoria' });
      Producto.hasMany(models.DetallePedido, { foreignKey: 'id_producto', as: 'detalles' });
      Producto.belongsToMany(models.Pedido, { through: models.DetallePedido, foreignKey: 'id_producto', otherKey: 'id_pedido', as: 'pedidos' });

    };
  
    return Producto;
  };
  