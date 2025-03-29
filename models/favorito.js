module.exports = (sequelize, DataTypes) => {
    const Favorito = sequelize.define('Favorito', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_cliente: { type: DataTypes.INTEGER, allowNull: false },
      id_comercio: { type: DataTypes.INTEGER, allowNull: false },
      fecha_agregado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
      tableName: 'favoritos',
      timestamps: false
    });
  
    Favorito.associate = function(models) {
      Favorito.belongsTo(models.Usuario, { foreignKey: 'id_cliente', as: 'cliente' });
      Favorito.belongsTo(models.Comercio, { foreignKey: 'id_comercio', as: 'comercio' });
    };
  
    return Favorito;
  };
  