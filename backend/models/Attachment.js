'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attachment = sequelize.define('Attachment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    filename: { type: DataTypes.STRING, allowNull: false },
    filepath: { type: DataTypes.STRING, allowNull: false },
    mimetype: { type: DataTypes.STRING },
    filesize: { type: DataTypes.INTEGER },
    messageId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'attachments',
    timestamps: false,
  });

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.Message, {
      foreignKey: 'messageId'
    });
  };

  return Attachment;
};
