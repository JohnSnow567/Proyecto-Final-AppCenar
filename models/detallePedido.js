module.exports = (sequelize, DataTypes) => {
    const DetallePedido = sequelize.define('DetallePedido', {
      id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      id_pedido: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      id_producto: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      cantidad: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      precio_unitario: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
      }
    }, {
      tableName: 'detalle_pedidos',
      timestamps: false
    });
  
    DetallePedido.associate = function(models) {
      // Cada detalle pertenece a un pedido
      DetallePedido.belongsTo(models.Pedido, { 
        foreignKey: 'id_pedido', 
        as: 'pedido'
      });
      // Cada detalle pertenece a un producto
      DetallePedido.belongsTo(models.Producto, { 
        foreignKey: 'id_producto', 
        as: 'producto'
      });
    };
  
    return DetallePedido;
  };
  