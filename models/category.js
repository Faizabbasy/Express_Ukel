'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Category.hasMany(models.Court, {
        foreignKey: 'category_id',
      });
    }
  }
  Category.init({
    nameCategory: DataTypes.STRING,
      image: {
        type: DataTypes.STRING,
        get() {
          const rawValue = this.getDataValue('image');
          return rawValue ? `http://localhost:3000/uploads/${rawValue}` : null;
        }
      }
  }, {
    sequelize,
    modelName: 'Category',
  });
  return Category;
};