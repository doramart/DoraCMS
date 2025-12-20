/**
 * Role MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 Role 结构
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, app) => {
  const Role = sequelize.define(
    'Role',
    {
      // 主键字段 - 使用自增 ID 替代 MongoDB 的 id
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 角色基本信息
      roleName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '角色名称',
      },

      roleCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '角色代码，全局唯一',
      },

      roleDesc: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '角色描述',
      },

      // 角色状态
      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '1',
        comment: '角色状态：1-启用，2-禁用',
        validate: {
          isIn: [['1', '2']],
        },
      },

      // 权限数组字段（存储为 JSON 字符串）
      menus: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        comment: '角色拥有的菜单ID数组（JSON 格式）',
        get() {
          const value = this.getDataValue('menus');
          if (!value) return [];
          try {
            return JSON.parse(value);
          } catch (e) {
            return [];
          }
        },

        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('menus', JSON.stringify(value));
          } else {
            this.setDataValue('menus', '[]');
          }
        },
      },

      buttons: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        comment: '角色拥有的按钮代码数组（JSON 格式）',
        get() {
          const value = this.getDataValue('buttons');
          if (!value) return [];
          try {
            return JSON.parse(value);
          } catch (e) {
            return [];
          }
        },

        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('buttons', JSON.stringify(value));
          } else {
            this.setDataValue('buttons', '[]');
          }
        },
      },

      // 审计字段
      createBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '创建者',
      },

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

      updateBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '更新者',
      },

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
    },
    {
      // 表名配置
      tableName: 'roles',

      // 禁用 Sequelize 的自动时间戳，我们使用自定义的
      timestamps: false,

      // 添加表级别的注释
      comment: '角色表 - 存储系统角色信息和权限配置',

      // 定义表索引
      indexes: [
        {
          name: 'idx_role_name',
          fields: ['roleName'],
        },
        {
          name: 'idx_role_code',
          unique: true,
          fields: ['roleCode'],
        },
        {
          name: 'idx_role_status',
          fields: ['status'],
        },
        {
          name: 'idx_role_create_time',
          fields: ['createdAt'],
        },
      ],

      // 钩子函数
      hooks: {
        beforeCreate: (role, options) => {
          // 确保数组字段的默认值
          if (!role.menus) role.menus = [];
          if (!role.buttons) role.buttons = [];

          // 设置时间戳
          const now = new Date();
          if (!role.createdAt) role.createdAt = now;
          if (!role.updatedAt) role.updatedAt = now;
        },

        beforeUpdate: (role, options) => {
          // 更新时间戳
          role.updatedAt = new Date();
        },

        beforeBulkUpdate: options => {
          // 批量更新时设置 updatedAt
          if (!options.attributes.updatedAt) {
            options.attributes.updatedAt = new Date();
          }
        },

        // 🔥 数据验证钩子（基于Menu模块经验）
        beforeValidate: instance => {
          // 确保数组字段的默认值
          if (!instance.menus) {
            instance.menus = [];
          }
          if (!instance.buttons) {
            instance.buttons = [];
          }

          // 确保状态字段有效
          if (!['1', '2'].includes(instance.status)) {
            instance.status = '1';
          }
        },
      },

      // 🔥 模型级别验证规则（基于Menu模块最佳实践）
      validate: {
        roleNameRequired() {
          if (!this.roleName || this.roleName.trim() === '') {
            throw new Error('角色名称不能为空');
          }
        },

        roleCodeRequired() {
          if (!this.roleCode || this.roleCode.trim() === '') {
            throw new Error('角色代码不能为空');
          }
        },

        statusValid() {
          if (!['1', '2'].includes(this.status)) {
            throw new Error('状态必须是 1（启用）或 2（禁用）');
          }
        },
      },
    }
  );

  // 🔥 实例方法（基于Menu模块成功实践）
  Role.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 确保数组字段
    values.menus = values.menus || [];
    values.buttons = values.buttons || [];

    // 🔥 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 添加状态文本描述
    values.statusText = values.status === '1' ? '启用' : '禁用';

    return values;
  };

  // 类方法 - 查找启用的角色
  Role.findEnabledRoles = function (options = {}) {
    return this.findAll({
      where: { status: '1' },
      order: [['createdAt', 'ASC']],
      ...options,
    });
  };

  // 类方法 - 检查角色代码是否存在
  Role.checkRoleCodeExists = async function (roleCode, excludeId = null) {
    const where = { roleCode };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  // 类方法 - 检查角色名称是否存在
  Role.checkRoleNameExists = async function (roleName, excludeId = null) {
    const where = { roleName };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  // 类方法 - 清理无效的菜单权限
  Role.cleanInvalidMenuPermissions = async function (deletedMenuIds) {
    if (!Array.isArray(deletedMenuIds) || deletedMenuIds.length === 0) {
      return { success: true, affectedRows: 0 };
    }

    // 查找包含这些菜单ID的角色
    const roles = await this.findAll({
      attributes: ['id', 'menus'],
    });

    let affectedRows = 0;

    for (const role of roles) {
      const currentMenus = role.menus || [];
      const filteredMenus = currentMenus.filter(menuId => !deletedMenuIds.includes(menuId));

      if (filteredMenus.length !== currentMenus.length) {
        await role.update({
          menus: filteredMenus,
          updatedAt: new Date(),
        });
        affectedRows++;
      }
    }

    return { success: true, affectedRows };
  };

  // 🔥 根据业务需要添加其他实例方法（参考Menu模块）
  Role.prototype.getDisplayName = function () {
    return this.roleName || `Role-${this.id}`;
  };

  Role.prototype.isEnabled = function () {
    return this.status === '1';
  };

  Role.prototype.isDisabled = function () {
    return this.status === '2';
  };

  Role.prototype.hasMenu = function (menuId) {
    const menus = this.menus || [];
    return menus.includes(menuId);
  };

  Role.prototype.hasButton = function (buttonCode) {
    const buttons = this.buttons || [];
    return buttons.includes(buttonCode);
  };

  Role.prototype.getMenuCount = function () {
    return (this.menus || []).length;
  };

  Role.prototype.getButtonCount = function () {
    return (this.buttons || []).length;
  };

  // 🔥 定义关联关系（与AdminSchema对应）
  Role.associate = models => {
    // Role 和 Admin 的多对多关系，通过 AdminRole 中间表
    if (models.Admin && models.AdminRole) {
      Role.belongsToMany(models.Admin, {
        through: models.AdminRole,
        foreignKey: 'roleId',
        otherKey: 'adminId',
        as: 'admins',
      });

      // 一对多关系
      Role.hasMany(models.AdminRole, {
        foreignKey: 'roleId',
        as: 'adminRelations',
      });
    }
  };

  return Role;
};
