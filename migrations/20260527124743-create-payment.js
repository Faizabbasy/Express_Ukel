'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      payment_method: {
        type: Sequelize.ENUM(
          'transfer',
          'qris',
        ),
        allowNull: false
      },

      payment_proof: {
        type: Sequelize.STRING
      },

      payment_date: {
        type: Sequelize.DATE
      },

      status: {
        type: Sequelize.ENUM(
          'pending',
          'paid',
          'rejected'
        ),
        defaultValue: 'paid'
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addConstraint('Payments', {
      fields: ['booking_id'],
      type: 'foreign key',
      name: 'fk_payments_booking_id',
      references: {
        table: 'Bookings',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};