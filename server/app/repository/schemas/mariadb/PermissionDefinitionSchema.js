'use strict';

const { DataTypes } = require('sequelize');

/**
 * PermissionDefinition Schema for MariaDB
 * @param {Sequelize} sequelize
 * @param {Application} app
 * @return {Model}
 */
const PermissionDefinitionSchema = (sequelize, app) => {
  const PermissionDefinition = sequelize.define(
    'PermissionDefinition',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: '自增主键',
      },
      code: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        comment: '权限标识 code',
      },
      method: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'GET',
        comment: 'HTTP Method',
      },
      path: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '匹配路径',
      },
      desc: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '描述',
      },
      group: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: 'default',
        comment: '权限所属分组',
      },
      resourceType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'api',
        comment: '资源类型 api/event/task',
      },
      scope: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: 'global',
        comment: '作用域',
      },
      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'enabled',
        comment: '状态 enabled/disabled',
      },
      aliases: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: '兼容旧版别名',
      },
      meta: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        comment: '扩展元数据',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: '标签',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '版本号',
      },
      revision: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '热更新修订号',
      },
      hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '定义内容哈希',
      },
      createdBy: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: 'system',
        comment: '创建人',
      },
      updatedBy: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: 'system',
        comment: '最后更新人',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'permission_definitions',
      underscored: false,
      freezeTableName: true,
      comment: '权限定义表',
      indexes: [
        {
          fields: ['code'],
          unique: true,
        },
        {
          fields: ['status', 'group'],
        },
        {
          fields: ['method', 'path'],
        },
      ],
    }
  );

  PermissionDefinition.addHook('beforeCreate', record => {
    record.method = (record.method || 'GET').toUpperCase();
    record.path = normalizePath(record.path);
  });

  PermissionDefinition.addHook('beforeUpdate', record => {
    record.method = (record.method || 'GET').toUpperCase();
    record.path = normalizePath(record.path);
  });

  function normalizePath(pathname) {
    if (!pathname) {
      return '/';
    }
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  return PermissionDefinition;
};

module.exports = PermissionDefinitionSchema;
