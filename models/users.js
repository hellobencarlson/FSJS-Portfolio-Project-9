// requirements
'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class User extends Sequelize.Model {}
    User.init({
        exclude: ['password'],
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        emailAddress: {
            type: Sequelize.STRING,
            allowNull: false
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
    },
    { // timestamps: false, 
        sequelize });
    
    User.associate = (models) => {
        User.hasMany(models.Course, { 
           // as: 'userId',
           // targetKey: "lastName",
            foreignKey: {
                fieldName: "userId",
                allowNull: false
            }
        });
    };

    return User;

};
