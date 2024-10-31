const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const image = sequelize.define('image', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        readOnly: true
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false,
        readOnly: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        readOnly: true
    },
    upload_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        readOnly: true
    },
    user_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        readOnly: true
    }
}, {
    timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields,
    tableName: 'images'
})

module.exports = {image};