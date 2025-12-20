/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: User MariaDB Schema 定义
 */

'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');
const CryptoJS = require('crypto-js');

/**
 * User Schema for MariaDB
 * 用户表结构定义，支持复杂的关联关系和数组字段映射
 * @param sequelize
 * @param app
 */
const UserSchema = (sequelize, app) => {
  const User = sequelize.define(
    'User',
    {
      // 主键设计
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'MariaDB 主键',
      },

      // 基础用户信息
      enable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '用户是否有效',
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '真实姓名',
      },

      userName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名',
      },

      password: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '加密密码',
        set(value) {
          if (value) {
            const encrypted = CryptoJS.AES.encrypt(value, app.config.encrypt_key).toString();
            this.setDataValue('password', encrypted);
          }
        },
      },

      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '邮箱地址',
        validate: {
          isEmail: true,
        },
      },

      qq: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'QQ号码',
      },

      phoneNum: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '手机号',
      },

      countryCode: {
        type: DataTypes.STRING(10),
        defaultValue: '86',
        comment: '手机号国家代码',
      },

      idNo: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '身份证号',
      },

      idType: {
        type: DataTypes.STRING(5),
        defaultValue: '1',
        comment: '证件类型 1为身份证',
      },

      comments: {
        type: DataTypes.TEXT,
        defaultValue: '',
        comment: '备注信息',
      },

      introduction: {
        type: DataTypes.TEXT,
        defaultValue: '',
        comment: '个人简介',
      },

      position: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '职位',
      },

      profession: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '职业',
      },

      industry: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '行业',
      },

      experience: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '教育经历',
      },

      company: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '大学或公司',
      },

      website: {
        type: DataTypes.STRING(300),
        allowNull: true,
        comment: '个人站点',
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
        get() {
          const value = this.getDataValue('createdAt');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },

      logo: {
        type: DataTypes.STRING(300),
        defaultValue: '/static/upload/images/defaultlogo.png',
        comment: '用户头像',
      },

      group: {
        type: DataTypes.STRING(10),
        defaultValue: '0',
        comment: '用户组 0-普通用户',
      },

      province: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '所在省份',
      },

      city: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '所在城市',
      },

      birth: {
        type: DataTypes.DATE,
        defaultValue: new Date('1770-01-01'),
        comment: '出生年月日',
        get() {
          const value = this.getDataValue('birth');
          return value ? moment(value).format('YYYY-MM-DD') : null;
        },
      },

      gender: {
        type: DataTypes.STRING(5),
        defaultValue: '0',
        comment: '性别 0男 1女',
      },

      // 关联数组字段 - JSON 存储
      despises: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '踩过的文章ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('despises');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('despises', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      despiseMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '踩过的评论ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('despiseMessage');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('despiseMessage', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      favorites: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '收藏的文章ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('favorites');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('favorites', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      praiseContents: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '点赞的文章ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('praiseContents');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('praiseContents', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      praiseMessages: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '点赞的评论ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('praiseMessages');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('praiseMessages', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      state: {
        type: DataTypes.STRING(5),
        defaultValue: '1',
        comment: '状态 1正常 0删除',
      },

      followers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '关注我的用户ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('followers');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('followers', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      watchers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '我关注的用户ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('watchers');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('watchers', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      watchTags: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '关注的标签ID数组(JSON格式)',
        get() {
          const value = this.getDataValue('watchTags');
          try {
            return value ? JSON.parse(value) : [];
          } catch (e) {
            return [];
          }
        },

        set(value) {
          this.setDataValue('watchTags', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },

      retrieve_time: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '用户发送激活请求的时间戳',
      },

      loginActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否首次登录激活',
      },

      deviceId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '设备ID（游客用户）',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      paranoid: false, // 不使用软删除，用 state 字段代替
      indexes: [
        // 主要索引
        {
          unique: true,
          fields: ['userName'],
          name: 'idx_user_username',
        },
        {
          fields: ['email'],
          name: 'idx_user_email',
        },
        {
          fields: ['phoneNum', 'countryCode'],
          name: 'idx_user_phone',
        },
        {
          fields: ['deviceId'],
          name: 'idx_user_deviceid',
        },
        {
          fields: ['group'],
          name: 'idx_user_group',
        },
        {
          fields: ['state'],
          name: 'idx_user_state',
        },
        {
          fields: ['enable'],
          name: 'idx_user_enable',
        },
      ],
      comment: '用户表',
    }
  );

  // 定义关联关系的辅助方法
  User.associate = function (models) {
    // 🔥 用户与内容的关联关系
    if (models.Content) {
      User.hasMany(models.Content, {
        foreignKey: 'uAuthor',
        as: 'contents',
        constraints: false, // 允许为空
      });
    }

    // 用户自关联 - 关注者
    User.belongsToMany(models.User, {
      through: 'user_followers',
      as: 'UserFollowers',
      foreignKey: 'userId',
      otherKey: 'followerId',
      constraints: false,
    });

    // 用户自关联 - 被关注者
    User.belongsToMany(models.User, {
      through: 'user_followers',
      as: 'UserWatchers',
      foreignKey: 'followerId',
      otherKey: 'userId',
      constraints: false,
    });
  };

  // 虚拟字段和 getter/setter
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 移除敏感信息
    // delete values.password;

    return values;
  };

  // 实例方法 - 验证密码
  User.prototype.verifyPassword = function (password) {
    try {
      const decryptedPassword = CryptoJS.AES.decrypt(this.password, app.config.encrypt_key).toString(CryptoJS.enc.Utf8);

      return decryptedPassword === password;
    } catch (error) {
      return false;
    }
  };

  // 实例方法 - 检查用户是否在某个列表中
  User.prototype.hasInList = function (listType, targetId) {
    const list = this[listType] || [];
    return list.includes(targetId);
  };

  // 实例方法 - 添加到列表
  User.prototype.addToList = function (listType, targetId) {
    const list = this[listType] || [];
    if (!list.includes(targetId)) {
      list.push(targetId);
      this[listType] = list;
    }
    return this;
  };

  // 实例方法 - 从列表移除
  User.prototype.removeFromList = function (listType, targetId) {
    const list = this[listType] || [];
    const index = list.indexOf(targetId);
    if (index > -1) {
      list.splice(index, 1);
      this[listType] = list;
    }
    return this;
  };

  // 静态方法 - 验证用户登录
  User.findByCredentials = async function (identifier, password, loginType, countryCode = null) {
    const whereClause = { state: '1' };

    switch (loginType) {
      case 'userName':
        whereClause.userName = identifier;
        break;
      case 'email':
        whereClause.email = identifier;
        break;
      case 'phoneNum':
        whereClause.phoneNum = identifier;
        if (countryCode) {
          whereClause.countryCode = countryCode;
        }
        break;
      default:
        return null;
    }

    const user = await User.findOne({ where: whereClause });

    if (user && user.verifyPassword(password)) {
      return user;
    }

    return null;
  };

  return User;
};

module.exports = UserSchema;
