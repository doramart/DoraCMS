/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Admin MariaDB Schema 定义 - 基于Menu模块成功经验
 */

'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');
const CryptoJS = require('crypto-js');

/**
 * Admin Schema for MariaDB
 * Admin表结构定义 - 基于 MongoDB 模型设计
 * @param sequelize
 * @param app
 */
const AdminSchema = (sequelize, app) => {
  const Admin = sequelize.define(
    'Admin',
    {
      // 🔥 主键字段 - 使用自增 ID 替代 MongoDB 的 _id
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 🔥 核心字段（与 MongoDB 模型一致，基于Menu模块经验）
      userName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '用户名',
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      password: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '密码（加密）',
        // 自动加密密码
        set(value) {
          if (value) {
            const encrypted = CryptoJS.AES.encrypt(value, app.config.encrypt_key).toString();
            this.setDataValue('password', encrypted);
          }
        },
      },

      logo: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'https://cdn.html-js.cn/cms/upload/images/20250601/1748746558512977961.png',
        comment: '头像',
      },

      userGender: {
        type: DataTypes.ENUM('1', '2'),
        allowNull: false,
        comment: '性别 1: 男, 2: 女',
      },

      nickName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '昵称',
      },

      userPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '手机号',
      },

      userEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: '邮箱',
      },

      // 移除 userRoles JSON 字段，使用关联表代替

      status: {
        type: DataTypes.ENUM('1', '2'),
        allowNull: false,
        defaultValue: '1',
        comment: '状态 1: 启用, 2: 禁用',
      },

      createBy: {
        type: DataTypes.STRING(32),
        allowNull: true,
        comment: '创建者',
      },

      // 🔥 统一时间字段（采用 createdAt/updatedAt 命名，基于Menu模块经验）
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
      },

      updateBy: {
        type: DataTypes.STRING(32),
        allowNull: true,
        comment: '更新者',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
      },
    },
    {
      tableName: 'admins',
      timestamps: false, // 我们手动管理时间字段
      comment: '管理员表',
      indexes: [
        {
          name: 'idx_admin_username',
          fields: ['userName'],
        },
        {
          name: 'idx_admin_email',
          fields: ['userEmail'],
        },
        {
          name: 'idx_admin_phone',
          fields: ['userPhone'],
          unique: true,
        },
        {
          name: 'idx_admin_status',
          fields: ['status'],
        },
        {
          name: 'idx_admin_create_time',
          fields: ['createdAt'],
        },
      ],
      // 🔥 数据验证进行了加强（基于Menu模块经验）
      validate: {
        userNameRequired() {
          if (!this.userName || this.userName.trim() === '') {
            throw new Error('用户名不能为空');
          }
        },

        statusValid() {
          if (!['1', '2'].includes(this.status)) {
            throw new Error('状态必须是 1（启用）或 2（禁用）');
          }
        },

        emailValid() {
          if (this.userEmail && !/\S+@\S+\.\S+/.test(this.userEmail)) {
            throw new Error('邮箱格式无效');
          }
        },

        phoneValid() {
          if (this.userPhone) {
            const phone = String(this.userPhone).trim();
            if (!/^\d+$/.test(phone)) {
              throw new Error('手机号必须为数字');
            }
            this.userPhone = phone;
          }
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

        // 🔥 数据验证钩子（基于Menu模块经验）
        beforeValidate(instance) {
          // 确保 JSON 字段的默认值
          if (!instance.userRoles) {
            instance.userRoles = [];
          }
        },
      },
    }
  );

  // 🔥 实例方法（基于Menu模块成功实践）
  Admin.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 移除敏感信息
    // delete values.password;

    // 🔥 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 添加状态文本描述
    values.statusText = values.status === '1' ? '启用' : '禁用';
    values.userGenderText = values.userGender === '1' ? '男' : '女';

    return values;
  };

  // 类方法
  Admin.checkUserNameExists = async function (userName, excludeId = null) {
    const where = { userName };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  Admin.checkEmailExists = async function (userEmail, excludeId = null) {
    const where = { userEmail };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  Admin.checkPhoneExists = async function (userPhone, excludeId = null) {
    const where = { userPhone };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  // 验证密码方法
  Admin.prototype.verifyPassword = function (password) {
    try {
      const rawPassword = this.getDataValue('password');
      if (!rawPassword) return false;

      const bytes = CryptoJS.AES.decrypt(rawPassword, app.config.encrypt_key);
      const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedPassword === password;
    } catch (error) {
      return false;
    }
  };

  // 获取解密后的密码（仅用于验证）
  Admin.prototype.getDecryptedPassword = function () {
    try {
      const rawPassword = this.getDataValue('password');
      if (!rawPassword) return null;

      const bytes = CryptoJS.AES.decrypt(rawPassword, app.config.encrypt_key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      return null;
    }
  };

  // 添加角色
  Admin.prototype.addRole = function (roleId) {
    const currentRoles = this.userRoles || [];
    if (!currentRoles.includes(roleId)) {
      this.userRoles = [...currentRoles, roleId];
    }
  };

  // 移除角色
  Admin.prototype.removeRole = function (roleId) {
    const currentRoles = this.userRoles || [];
    this.userRoles = currentRoles.filter(id => id !== roleId);
  };

  // 检查是否拥有角色
  Admin.prototype.hasRole = function (roleId) {
    const currentRoles = this.userRoles || [];
    return currentRoles.includes(roleId);
  };

  // 激活账户
  Admin.prototype.activate = function () {
    this.status = '1';
    this.updatedAt = new Date();
  };

  // 禁用账户
  Admin.prototype.deactivate = function () {
    this.status = '2';
    this.updatedAt = new Date();
  };

  // 检查是否激活
  Admin.prototype.isActive = function () {
    return this.status === '1';
  };

  Admin.prototype.getDisplayName = function () {
    return this.nickName || this.userName || `Admin-${this.id}`;
  };

  Admin.prototype.isEnabled = function () {
    return this.status === '1';
  };

  Admin.prototype.isDisabled = function () {
    return this.status === '2';
  };

  // 🔥 根据业务需要添加其他实例方法（参考Menu模块）
  Admin.prototype.isMale = function () {
    return this.userGender === '1';
  };

  Admin.prototype.isFemale = function () {
    return this.userGender === '2';
  };

  // 🔥 定义关联关系（从AdminMariaRepository迁移过来）
  Admin.associate = models => {
    // 🔥 管理员与内容的关联关系
    if (models.Content) {
      Admin.hasMany(models.Content, {
        foreignKey: 'author',
        as: 'contents',
        constraints: false, // 允许为空
      });
    }

    // Admin 和 Role 的多对多关系，通过 AdminRole 中间表
    if (models.Role && models.AdminRole) {
      Admin.belongsToMany(models.Role, {
        through: models.AdminRole,
        foreignKey: 'adminId',
        otherKey: 'roleId',
        as: 'userRoles',
      });

      // 一对多关系
      Admin.hasMany(models.AdminRole, {
        foreignKey: 'adminId',
        as: 'roleRelations',
      });
    }
  };

  return Admin;
};

module.exports = AdminSchema;
