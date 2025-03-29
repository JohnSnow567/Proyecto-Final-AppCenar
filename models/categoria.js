module.exports = (sequelize, DataTypes) => {
    const Categoria = sequelize.define('Categoria', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_comercio: { type: DataTypes.INTEGER, allowNull: false },
      nombre: { type: DataTypes.STRING(50), allowNull: false },
      descripcion: { type: DataTypes.STRING(255), allowNull: false }
    }, {
      tableName: 'categorias',
      timestamps: false
    });
  
    Categoria.associate = function(models) {
      Categoria.belongsTo(models.Comercio, { foreignKey: 'id_comercio', as: 'comercio' });
      Categoria.hasMany(models.Producto, { foreignKey: 'id_categoria', as: 'productos' });
    };
  
    return Categoria;
  };
  