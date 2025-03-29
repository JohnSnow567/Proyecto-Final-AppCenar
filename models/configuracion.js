module.exports = (sequelize, DataTypes) => {
    const Configuracion = sequelize.define('Configuracion', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      itbis: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
      tableName: 'configuracion',
      timestamps: false
    });
  
    return Configuracion;
  };
  