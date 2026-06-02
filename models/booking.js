'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.hasOne(models.Payment, {
        foreignKey: 'booking_id'
      });

      Booking.belongsTo(models.User, {
        foreignKey: 'user_id'
      });

      Booking.belongsTo(models.Court, {
        foreignKey: 'court_id'
      });
    }
  }
  Booking.init({
    user_id: DataTypes.INTEGER,
    court_id: DataTypes.INTEGER,
    booking_date: DataTypes.DATE,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    booking_type: DataTypes.STRING,
    total_price: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};