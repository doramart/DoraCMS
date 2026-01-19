/**
 * Admin-Role 关联关系表 Schema
 * 用于实现多对多关联而不是 JSON 字段
 */
'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize, app) => {
  const AdminRole = sequelize.define(
    'AdminRole',
    {
      // 主键字段
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 管理员ID（软引用，不创建外键约束）
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '管理员ID',
      },

      // 角色ID（软引用，不创建外键约束）
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '角色ID',
      },

      // 关联状态
      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '1',
        comment: '关联状态：1-有效，2-无效',
        validate: {
          isIn: [['1', '2']],
        },
      },

      // 创建信息
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
      },

      createBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '创建人',
      },

      updateBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '更新人',
      },
    },
    {
      tableName: 'admin_roles',
      timestamps: true,
      indexes: [
        // 复合索引
        {
          unique: true,
          fields: ['adminId', 'roleId'],
          name: 'uk_admin_role',
        },
        // 单独索引
        {
          fields: ['adminId'],
          name: 'idx_admin_id',
        },
        {
          fields: ['roleId'],
          name: 'idx_role_id',
        },
        {
          fields: ['status'],
          name: 'idx_status',
        },
      ],
      comment: '管理员角色关联表',
    }
  );

  // 🔥 定义关联关系（中间表的关联）
  AdminRole.associate = models => {
    // AdminRole 与 Admin 的关联
    if (models.Admin) {
      AdminRole.belongsTo(models.Admin, {
        foreignKey: 'adminId',
        as: 'admin',
      });
    }

    // AdminRole 与 Role 的关联
    if (models.Role) {
      AdminRole.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role',
      });
    }
  };

  return AdminRole;
};
