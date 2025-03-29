module.exports = (sequelize, DataTypes) => {
    const TipoComercio = sequelize.define('TipoComercio', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: DataTypes.STRING(50), allowNull: false },
      descripcion: { type: DataTypes.STRING(255), allowNull: false },
      icono: { type: DataTypes.STRING(255), allowNull: false }
    }, {
      tableName: 'tipos_comercios',
      timestamps: false
    });
  
    TipoComercio.associate = function(models) {
      TipoComercio.hasMany(models.Comercio, { foreignKey: 'id_tipo_comercio', as: 'comercios' });
    };
  
    return TipoComercio;
  };
  