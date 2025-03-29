module.exports = (sequelize, DataTypes) => {
    const Direccion = sequelize.define('Direccion', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_cliente: { type: DataTypes.INTEGER, allowNull: false },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      descripcion: { type: DataTypes.STRING(255), allowNull: false }
    }, {
      tableName: 'direcciones',
      timestamps: false
    });
  
    Direccion.associate = function(models) {
      Direccion.belongsTo(models.Usuario, { foreignKey: 'id_cliente', as: 'cliente' });
    };
  
    return Direccion;
  };
  