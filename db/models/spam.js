'use strict'
const { Model, Sequelize } = require('sequelize');
const sequelize = require('../../config/database');
const contacts = require('./contacts');
const spam = sequelize.define('spam', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },
  marked_by: {
    type: Sequelize.INTEGER
  },
  count: {
    type: Sequelize.INTEGER
  },
  phone: {
    type: Sequelize.STRING
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

spam.hasMany(contacts,{foreignKey:'phone'});
contacts.belongsTo(spam,{foreignKey:'phone'});

module.exports = spam
