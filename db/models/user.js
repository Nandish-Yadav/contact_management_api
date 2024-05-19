'use strict';
const { Model, Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const contacts = require('./contacts');
const spam = require('./spam')

const sequelize = require('../../config/database');
const AppError = require('../../utils/appError');
const user = sequelize.define(
    'users',
    {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'name cannot be null',
                },
                notEmpty: {
                    msg: 'name cannot be empty',
                },
            },
        },
        phone:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notNull: {
                    msg: 'phone number cannot be null',
                },
                notEmpty: {
                    msg: 'phone number cannot be empty',
                },
            }
        },
        email: {
            type: DataTypes.STRING,
            validate: {
                isEmail: {
                    msg: 'Invalid email id',
                },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'password cannot be null',
                },
                notEmpty: {
                    msg: 'password cannot be empty',
                },
            },
            set(value){ 
                const hashPassword = bcrypt.hashSync(value,10);
                this.setDataValue('password', hashPassword)
            }
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        deletedAt: {
            type: DataTypes.DATE,
        },
    },
);

user.hasMany(contacts,{foreignKey:'user_id'});
contacts.belongsTo(user,{foreignKey:'user_id'});


user.hasMany(spam,{foreignKey:'marked_by'});
spam.belongsTo(user,{foreignKey:'marked_by'});

module.exports = user;
