module.exports = (sequelize, DataTypes) => {
    const Comercio = sequelize.define('Comercio', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_usuario: { type: DataTypes.INTEGER, allowNull: false },
      nombre_comercio: { type: DataTypes.STRING(100), allowNull: false },
      logo: { type: DataTypes.STRING(255) },
      telefono: { type: DataTypes.STRING(20) },
      hora_apertura: { type: DataTypes.TIME },
      hora_cierre: { type: DataTypes.TIME },
      id_tipo_comercio: { type: DataTypes.INTEGER }
    }, {
      tableName: 'comercios',
      timestamps: false
    });
  
    Comercio.associate = function(models) {
      Comercio.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
      Comercio.belongsTo(models.TipoComercio, { foreignKey: 'id_tipo_comercio', as: 'tipoComercio' });
      Comercio.hasMany(models.Categoria, { foreignKey: 'id_comercio', as: 'categorias' });
      Comercio.hasMany(models.Producto, { foreignKey: 'id_comercio', as: 'productos' });
      Comercio.hasMany(models.Pedido, { foreignKey: 'id_comercio', as: 'pedidos' });
      Comercio.hasMany(models.Favorito, { foreignKey: 'id_comercio', as: 'favoritos' });
    };
  
    return Comercio;
  };
  