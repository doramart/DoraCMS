/**
 * MailTemplate MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 MailTemplate 结构
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const MailTemplate = sequelize.define(
    'MailTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '创建时间',
        get() {
          const v = this.getDataValue('createdAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '更新时间',
        get() {
          const v = this.getDataValue('updatedAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      comment: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '备注',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '标题',
      },
      subTitle: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '概要',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '内容',
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '模板类型',
      },
    },
    {
      tableName: 'mail_templates',
      timestamps: true,
    }
  );
  return MailTemplate;
};
