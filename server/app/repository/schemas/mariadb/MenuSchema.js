/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Menu MariaDB Schema 定义
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * Menu Schema for MariaDB
 * 菜单表结构定义 - 基于 MongoDB 模型设计
 * @param sequelize
 * @param app
 */
const MenuSchema = (sequelize, app) => {
  const Menu = sequelize.define(
    'Menu',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 核心菜单字段
      menuType: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: '菜单类型: 1-目录, 2-菜单',
        validate: {
          isIn: [['1', '2']],
        },
      },

      menuName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '菜单名称',
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      routeName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '路由名称',
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      routePath: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '路由路径',
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },

      component: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '组件路径',
        validate: {
          len: [0, 200],
        },
      },

      i18nKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '国际化键',
        validate: {
          len: [0, 100],
        },
      },

      icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '图标',
        validate: {
          len: [0, 100],
        },
      },

      iconType: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: '图标类型',
      },

      parentId: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '父菜单ID，0为根级菜单',
      },

      status: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: '状态: 0-禁用, 1-启用',
        validate: {
          isIn: [['0', '1']],
        },
      },

      keepAlive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否缓存页面',
      },

      constant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否为常量路由',
      },

      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '排序值',
      },

      href: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '外部链接',
        validate: {
          len: [0, 500],
        },
      },

      hideInMenu: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否在菜单中隐藏',
      },

      activeMenu: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '激活的菜单项',
        validate: {
          len: [0, 200],
        },
      },

      multiTab: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否支持多标签',
      },

      fixedIndexInTab: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '在标签页中的固定位置',
      },

      // JSON 字段存储复杂数据
      query: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '查询参数配置',
        defaultValue: [],
        get() {
          const value = this.getDataValue('query');
          if (!value) return [];
          if (Array.isArray(value)) return value; // 已经是数组
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              console.warn('Invalid JSON in query field:', value);
              return [];
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('query', value);
        },
      },

      buttons: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '按钮配置',
        defaultValue: [],
        get() {
          const value = this.getDataValue('buttons');
          if (!value) return [];
          if (Array.isArray(value)) return value; // 已经是数组
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              console.warn('Invalid JSON in buttons field:', value);
              return [];
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('buttons', value);
        },
      },

      // 统一时间字段
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '创建时间',
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '更新时间',
        defaultValue: DataTypes.NOW,
      },

      // 创建和更新人员
      createBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '创建人员ID',
      },

      updateBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '更新人员ID',
      },
    },
    {
      timestamps: false, // 使用自定义时间字段
      tableName: 'menus',
      comment: '菜单表',

      // 添加虚拟字段以保持与 MongoDB 风格的兼容性
      getterMethods: {
        // 虚拟 URL 字段
        url() {
          return this.routePath || `/menu/${this.routeName}`;
        },
      },

      hooks: {
        beforeUpdate(instance) {
          instance.updatedAt = new Date();
        },

        beforeBulkUpdate(options) {
          options.attributes.updatedAt = new Date();
        },

        beforeCreate(instance) {
          if (!instance.createdAt) {
            instance.createdAt = new Date();
          }
          if (!instance.updatedAt) {
            instance.updatedAt = new Date();
          }
        },

        // 数据验证钩子
        beforeValidate(instance) {
          // 确保 JSON 字段的默认值
          if (!instance.query) {
            instance.query = [];
          }
          if (!instance.buttons) {
            instance.buttons = [];
          }
        },
      },

      // 索引定义
      indexes: [
        {
          fields: ['status'],
        },
        {
          fields: ['menuType'],
        },
        {
          fields: ['parentId'],
        },
        {
          fields: ['order'],
        },
        {
          fields: ['createdAt'],
        },
        {
          unique: true,
          fields: ['routeName'],
        },
        {
          unique: true,
          fields: ['routePath'],
        },
        {
          fields: ['i18nKey'],
        },
        // 复合索引
        {
          fields: ['parentId', 'order'],
        },
        {
          fields: ['menuType', 'status'],
        },
      ],

      // 验证规则
      validate: {
        routeNameRequired() {
          if (!this.routeName || this.routeName.trim() === '') {
            throw new Error('路由名称不能为空');
          }
        },

        routePathRequired() {
          if (!this.routePath || this.routePath.trim() === '') {
            throw new Error('路由路径不能为空');
          }
        },

        menuNameRequired() {
          if (!this.menuName || this.menuName.trim() === '') {
            throw new Error('菜单名称不能为空');
          }
        },

        menuTypeValid() {
          if (!['1', '2'].includes(this.menuType)) {
            throw new Error('菜单类型必须是 1（目录）或 2（菜单）');
          }
        },

        statusValid() {
          if (!['0', '1'].includes(this.status)) {
            throw new Error('状态必须是 0（禁用）或 1（启用）');
          }
        },

        orderValid() {
          if (this.order < 0) {
            throw new Error('排序值不能为负数');
          }
        },

        buttonsValid() {
          if (this.buttons && Array.isArray(this.buttons)) {
            const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
            for (const button of this.buttons) {
              if (!button.permissionCode || !button.desc) {
                throw new Error('按钮必须包含 permissionCode 和 desc 字段');
              }
              if (button.httpMethod && !VALID_HTTP_METHODS.includes(String(button.httpMethod).toUpperCase())) {
                throw new Error(`按钮 ${button.permissionCode || ''} 的请求方法不合法`);
              }
            }
          }
        },

        queryValid() {
          if (this.query && Array.isArray(this.query)) {
            for (const queryItem of this.query) {
              if (!queryItem.key) {
                throw new Error('查询参数必须包含 key 字段');
              }
            }
          }
        },
      },
    }
  );

  // 定义关联关系
  Menu.associate = models => {
    // 菜单可能有父子关系，但这里使用 parentId 字符串而不是外键关联
    // 因为需要保持与 MongoDB 的兼容性
    // 如果将来需要与用户或角色建立关联：
    // Menu.belongsToMany(models.Role, { through: 'RoleMenus', foreignKey: 'menuId' });
    // Menu.belongsTo(models.User, { foreignKey: 'createBy', as: 'creator' });
    // Menu.belongsTo(models.User, { foreignKey: 'updateBy', as: 'updater' });
  };

  // 类方法
  Menu.findByStatus = function (status) {
    return this.findAll({ where: { status } });
  };

  Menu.findByMenuType = function (menuType) {
    return this.findAll({ where: { menuType } });
  };

  Menu.findByParentId = function (parentId) {
    return this.findAll({
      where: { parentId },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Menu.findByRouteName = function (routeName) {
    return this.findOne({ where: { routeName } });
  };

  Menu.findByRoutePath = function (routePath) {
    return this.findOne({ where: { routePath } });
  };

  Menu.findEnabledMenus = function () {
    return this.findAll({
      where: { status: '1' },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Menu.findRootMenus = function () {
    return this.findAll({
      where: { parentId: 0, status: '1' },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Menu.findDirectories = function () {
    return this.findAll({
      where: { menuType: '1', status: '1' },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Menu.findMenusByI18nKey = function (i18nKey) {
    return this.findAll({
      where: { i18nKey },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Menu.checkRouteNameUnique = async function (routeName, excludeId = null) {
    const where = { routeName };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  Menu.checkRoutePathUnique = async function (routePath, excludeId = null) {
    const where = { routePath };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  // 实例方法
  Menu.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加虚拟 URL 字段
    values.url = values.routePath || `/menu/${values.routeName}`;

    // 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 确保 JSON 字段默认值（防御性编程）
    // Sequelize 已经自动处理了 JSON 转换，这里只确保默认值
    values.query = values.query || [];
    values.buttons = values.buttons || [];

    // 添加状态和类型的文本描述
    values.statusText = values.status === '1' ? '启用' : '禁用';
    values.menuTypeText = values.menuType === '1' ? '目录' : '菜单';

    return values;
  };

  Menu.prototype.getDisplayName = function () {
    return this.menuName || `Menu-${this.id}`;
  };

  Menu.prototype.getRoutePath = function () {
    return this.routePath || `/menu/${this.routeName}`;
  };

  Menu.prototype.isDirectory = function () {
    return this.menuType === '1';
  };

  Menu.prototype.isMenu = function () {
    return this.menuType === '2';
  };

  Menu.prototype.isEnabled = function () {
    return this.status === '1';
  };

  Menu.prototype.isDisabled = function () {
    return this.status === '0';
  };

  Menu.prototype.isRootMenu = function () {
    return this.parentId === 0;
  };

  Menu.prototype.hasButtons = function () {
    return this.buttons && Array.isArray(this.buttons) && this.buttons.length > 0;
  };

  Menu.prototype.hasQuery = function () {
    return this.query && Array.isArray(this.query) && this.query.length > 0;
  };

  Menu.prototype.getButtonPermissionCodes = function () {
    if (!this.hasButtons()) {
      return [];
    }
    return this.buttons.map(button => button.permissionCode).filter(code => code);
  };

  Menu.prototype.getButtonApis = function () {
    if (!this.hasButtons()) {
      return [];
    }
    return this.buttons.map(button => button.api).filter(api => api);
  };

  Menu.prototype.addButton = function (buttonConfig) {
    if (!this.buttons) {
      this.buttons = [];
    }
    this.buttons.push(buttonConfig);
  };

  Menu.prototype.removeButton = function (permissionCode) {
    if (!this.buttons) {
      return false;
    }
    const index = this.buttons.findIndex(button => button.permissionCode === permissionCode);
    if (index > -1) {
      this.buttons.splice(index, 1);
      return true;
    }
    return false;
  };

  Menu.prototype.addQuery = function (queryConfig) {
    if (!this.query) {
      this.query = [];
    }
    this.query.push(queryConfig);
  };

  Menu.prototype.removeQuery = function (queryKey) {
    if (!this.query) {
      return false;
    }
    const index = this.query.findIndex(query => query.key === queryKey);
    if (index > -1) {
      this.query.splice(index, 1);
      return true;
    }
    return false;
  };

  return Menu;
};

module.exports = MenuSchema;
