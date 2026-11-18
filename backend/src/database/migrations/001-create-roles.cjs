"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Los roles se separan de los usuarios para poder cambiar permisos sin
    // modificar la identidad de cada usuario.
    await queryInterface.createTable("roles", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
      name: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("roles");
  },
};
