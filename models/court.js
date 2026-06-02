'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Court extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Court.hasMany(models.Booking, {
        foreignKey: 'court_id'
      });


      Court.belongsTo(models.Category, {
        foreignKey: 'category_id',
      });
    }
  }
  Court.init({
    category_id: DataTypes.INTEGER,
    nameCourt: DataTypes.STRING,
    price: DataTypes.INTEGER,
    image: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('image');
        return rawValue ? `http://localhost:3000/uploads/${rawValue}` : null;
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'maintenance', 'non-active'),
      defaultValue: 'available',
    }
  }, {
    sequelize,
    modelName: 'Court',
  });
  return Court;
};