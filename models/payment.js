'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Payment.belongsTo(models.Booking, {
        foreignKey: 'booking_id'
      });
    }
  }
  Payment.init({
    booking_id: DataTypes.INTEGER,
    payment_method: DataTypes.STRING,
    payment_proof: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('payment_proof'); 
        return rawValue ? `http://localhost:3000/uploads/${rawValue}` : null;
      }
    },
    payment_date: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};