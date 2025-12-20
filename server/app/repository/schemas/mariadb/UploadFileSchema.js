/**
 * UploadFile MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 uploadFile 结构
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, app) => {
  const UploadFile = sequelize.define(
    'UploadFile',
    {
      // 主键字段 - 使用自增 ID 替代 MongoDB 的 id
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 创建时间
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
        get() {
          const value = this.getDataValue('createdAt');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },

      // 更新时间
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
        get() {
          const value = this.getDataValue('updatedAt');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },

      // 上传方式
      type: {
        type: DataTypes.ENUM('local', 'qn', 'oss'),
        allowNull: false,
        defaultValue: 'local',
        comment: '上传方式：local本地，qn七牛，oss阿里云',
      },

      // 本地上传路径
      uploadPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '本地上传路径',
      },

      // 七牛云配置
      qn_bucket: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '七牛云存储空间名称',
      },

      qn_accessKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '七牛云 AccessKey',
      },

      qn_secretKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '七牛云 SecretKey',
      },

      qn_zone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '七牛云存储区域',
      },

      qn_endPoint: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '七牛云访问域名',
      },

      // 阿里云OSS配置
      oss_bucket: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '阿里云OSS存储桶名称',
      },

      oss_accessKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '阿里云OSS AccessKey',
      },

      oss_secretKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '阿里云OSS SecretKey',
      },

      oss_region: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '阿里云OSS地域',
      },

      oss_endPoint: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '阿里云OSS访问域名',
      },

      oss_apiVersion: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '阿里云OSS API版本',
      },
    },
    {
      tableName: 'upload_files',
      timestamps: false, // 不使用 Sequelize 的 timestamps
      comment: '文件上传配置表',
      indexes: [
        {
          fields: ['type'],
          name: 'idx_type',
        },
      ],
    }
  );

  // 模型钩子：更新时自动设置 updatedAt
  UploadFile.beforeUpdate(instance => {
    instance.updatedAt = new Date();
  });

  // 模型钩子：创建时自动设置 createdAt
  UploadFile.beforeCreate(instance => {
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  });

  return UploadFile;
};
