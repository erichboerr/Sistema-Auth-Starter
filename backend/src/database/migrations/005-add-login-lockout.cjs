"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "failedLoginAttempts", { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn("users", "lockedUntil", { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addIndex("users", ["lockedUntil"], { name: "users_locked_until_idx" });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_locked_until_idx");
    await queryInterface.removeColumn("users", "lockedUntil");
    await queryInterface.removeColumn("users", "failedLoginAttempts");
  },
};
