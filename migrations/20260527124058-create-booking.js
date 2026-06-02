'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      court_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      booking_date: {
        type: Sequelize.DATEONLY
      },
      start_time: {
        type: Sequelize.TIME
      },
      end_time: {
        type: Sequelize.TIME
      },
      booking_type: {
        type: Sequelize.ENUM('regular', 'flexible'),
        defaultValue: 'regular'
      },
      total_price: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending'
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

    // FK user_id
    await queryInterface.addConstraint('Bookings', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_bookings_user_id',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // FK court_id
    await queryInterface.addConstraint('Bookings', {
      fields: ['court_id'],
      type: 'foreign key',
      name: 'fk_bookings_court_id',
      references: {
        table: 'Courts',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Tambahkan penghapusan constraint sebelum dropTable agar database bersih total saat di-undo
    await queryInterface.removeConstraint('Bookings', 'fk_bookings_user_id');
    await queryInterface.removeConstraint('Bookings', 'fk_bookings_court_id');
    await queryInterface.dropTable('Bookings');
  }
};