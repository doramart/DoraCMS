/**
 * 标准化的 Admin MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const CryptoUtil = require('../../../utils/CryptoUtil');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class AdminMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Admin');

    // 设置 MongoDB 模型
    this.model = this.app.model.Admin;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        userRoles: {
          model: this.app.model.Role,
          path: 'userRoles',
          select: ['menus', 'buttons', 'roleName', 'roleCode', 'status'],
        },
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [{ path: 'userRoles', select: ['menus', 'buttons', 'roleName', 'roleCode', 'status'] }];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['userName', 'nickName', 'userPhone', 'userEmail'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  /**
   * 重写查找方法以添加默认字段过滤（排除密码）
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    // 设置默认字段过滤（排除密码）
    if (!options.fields && !payload.fields) {
      options.fields = '-password';
    }

    // 调用基类方法
    return await super.find(payload, options);
  }

  /**
   * 重写findOne方法以添加默认字段过滤（排除密码）
   * @param {Object} params 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(params = {}, options = {}) {
    // 设置默认字段过滤（排除密码），除非明确要求包含密码
    if (!options.fields && !options.includePassword) {
      options.fields = '-password';
    }

    // 调用基类方法
    return await super.findOne(params, options);
  }

  // ===== 🔥 基类钩子方法重写 - 用于Admin特定逻辑 =====

  /**
   * 重写状态映射（Admin特定状态）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（Admin特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 🔥 添加Admin特定的数据处理
    // 添加性别文本
    if (item.userGender) {
      item.userGenderText = SYSTEM_CONSTANTS.USER.GENDER_TEXT[item.userGender] || '未知';
    }

    // 确保敏感信息被移除 - 但如果 options.fields 中明确包含 password 则保留
    if (item.password && !this._shouldIncludeField('password', options)) {
      delete item.password;
    }

    // 确保数组字段的默认值
    item.userRoles = item.userRoles || [];

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（Admin特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加Admin特定的创建前处理
    // 处理密码加密
    if (data.password) {
      data.password = CryptoUtil.encryptPassword(data.password, this.app.config.encrypt_key);
    }

    // 设置默认值
    if (!data.status) data.status = SYSTEM_CONSTANTS.STATUS.ENABLED;
    if (!data.userRoles) data.userRoles = [];

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（Admin特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加Admin特定的更新前处理
    // 处理密码加密
    if (data.password) {
      data.password = CryptoUtil.encryptPassword(data.password, this.app.config.encrypt_key);
    }

    return data;
  }

  // ===== 🔥 重写CRUD方法以包含自动唯一性验证 =====

  /**
   * 创建管理员（自动验证唯一性）
   * @param {Object} data 管理员数据
   * @return {Promise<Object>} 创建的管理员
   * @throws {UniqueConstraintError} 当字段不唯一时抛出
   */
  async create(data) {
    try {
      // 🔥 Phase2优化：自动验证唯一性
      if (data.userName) {
        await this.checkUserNameUnique(data.userName);
      }
      if (data.userEmail) {
        await this.checkEmailUnique(data.userEmail);
      }
      if (data.userPhone) {
        await this.checkPhoneUnique(data.userPhone);
      }

      // 调用父类的create方法
      return await super.create(data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'create', data);
    }
  }

  /**
   * 更新管理员（自动验证唯一性）
   * @param {String} id 管理员ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的管理员
   * @throws {UniqueConstraintError} 当字段不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2优化：自动验证唯一性（排除当前ID）
      if (data.userName) {
        await this.checkUserNameUnique(data.userName, id);
      }
      if (data.userEmail) {
        await this.checkEmailUnique(data.userEmail, id);
      }
      if (data.userPhone) {
        await this.checkPhoneUnique(data.userPhone, id);
      }

      // 调用父类的update方法
      return await super.update(id, data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'update', { id, data });
    }
  }

  // ===== Admin 特定的业务方法 =====

  /**
   * 检查用户名是否唯一
   * @param {String} userName 用户名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当用户名已存在时抛出异常
   */
  async checkUserNameUnique(userName, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkUserNameUnique(this, userName, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.nameExists(userName);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkUserNameUnique', { userName, excludeId });
    }
  }

  /**
   * 检查手机号是否唯一
   * @param {String} userPhone 手机号
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当手机号已存在时抛出异常
   */
  async checkPhoneUnique(userPhone, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkPhoneUnique(this, userPhone, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.phoneExists(userPhone);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkPhoneUnique', { userPhone, excludeId });
    }
  }

  /**
   * 检查邮箱是否唯一
   * @param {String} userEmail 邮箱
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当邮箱已存在时抛出异常
   */
  async checkEmailUnique(userEmail, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkEmailUnique(this, userEmail, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.emailExists(userEmail);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkEmailUnique', { userEmail, excludeId });
    }
  }

  /**
   * 根据用户名查找管理员
   * @param {String} userName 用户名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 管理员信息
   */
  async findByUserName(userName, options = {}) {
    try {
      const query = { userName };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByUserName', { userName, options });
    }
  }

  /**
   * 根据邮箱查找管理员
   * @param {String} userEmail 邮箱
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 管理员信息
   */
  async findByEmail(userEmail, options = {}) {
    try {
      const query = { userEmail };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByEmail', { userEmail, options });
    }
  }

  /**
   * 根据手机号查找管理员
   * @param {String} userPhone 手机号
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 管理员信息
   */
  async findByPhone(userPhone, options = {}) {
    try {
      const query = { userPhone };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByPhone', { userPhone, options });
    }
  }

  /**
   * 根据状态查找管理员
   * @param {String} status 状态
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByStatus(status, payload = {}, options = {}) {
    try {
      const filters = { status, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByStatus', { status, payload, options });
    }
  }

  /**
   * 根据角色查找管理员
   * @param {String|Array} roleIds 角色ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByRoles(roleIds, payload = {}, options = {}) {
    try {
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds];
      const filters = { userRoles: { $in: roles }, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByRoles', { roleIds, payload, options });
    }
  }

  /**
   * 管理员登录验证
   * @param {String} identifier 登录标识（用户名、邮箱或手机号）
   * @param {String} password 密码
   * @param {String} loginType 登录类型
   * @return {Promise<Object|null>} 管理员信息
   */
  async verifyLogin(identifier, password, loginType) {
    try {
      let admin = null;

      switch (loginType) {
        case 'username':
          admin = await this.findByUserName(identifier, {
            fields: '_id userName password status nickName userRoles',
          });
          break;
        case 'email':
          admin = await this.findByEmail(identifier, {
            fields: '_id userName password status nickName userRoles',
          });
          break;
        case 'phone':
          admin = await this.findByPhone(identifier, {
            fields: '_id userName password status nickName userRoles',
          });
          break;
        default:
          throw new Error('Invalid login type');
      }

      if (!admin) {
        throw this.exceptions.user.notFound();
      }

      if (admin.status !== SYSTEM_CONSTANTS.STATUS.ENABLED) {
        throw this.exceptions.user.disabled();
      }

      // 验证密码
      const isValidPassword = CryptoUtil.verifyPassword(password, admin.password, this.app.config.encrypt_key);
      if (!isValidPassword) {
        throw this.exceptions.user.invalidCredentials();
      }

      // 返回管理员信息（不包含密码）
      delete admin.password;
      return admin;
    } catch (error) {
      this._handleError(error, 'verifyLogin', { identifier, loginType });
    }
  }

  /**
   * 更新管理员密码
   * @param {String} adminId 管理员ID
   * @param {String} newPassword 新密码
   * @return {Promise<Object>} 更新结果
   */
  async updatePassword(adminId, newPassword) {
    const encryptedPassword = CryptoUtil.encryptPassword(newPassword, this.app.config.encrypt_key);
    return await this.update(adminId, { password: encryptedPassword });
  }

  /**
   * 获取管理员统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdminStats(filter = {}) {
    try {
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);

      const stats = {
        total: 0,
        enabled: 0,
        disabled: 0,
      };

      result.forEach(item => {
        const count = item.count;
        stats.total += count;

        switch (item._id) {
          case SYSTEM_CONSTANTS.STATUS.ENABLED:
            stats.enabled = count;
            break;
          case SYSTEM_CONSTANTS.STATUS.DISABLED:
            stats.disabled = count;
            break;
        }
      });

      return stats;
    } catch (error) {
      this._handleError(error, 'getAdminStats', { filter });
      return { total: 0, enabled: 0, disabled: 0 };
    }
  }

  /**
   * 批量更新管理员状态
   * @param {Array} adminIds 管理员ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateAdminStatus(adminIds, status) {
    try {
      const idArray = Array.isArray(adminIds) ? adminIds : [adminIds];
      const result = await this.model.updateMany(
        { _id: { $in: idArray } },
        { $set: { status, updatedAt: new Date() } }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateAdminStatus', { adminIds, status });
    }
  }

  /**
   * 添加角色到管理员
   * @param {String} adminId 管理员ID
   * @param {String|Array} roleIds 角色ID
   * @return {Promise<Object>} 更新结果
   */
  async addRoles(adminId, roleIds) {
    try {
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds];
      const result = await this.model.updateOne(
        { _id: adminId },
        {
          $addToSet: { userRoles: { $each: roles } },
          $set: { updatedAt: new Date() },
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'addRoles', { adminId, roleIds });
    }
  }

  /**
   * 移除管理员的角色
   * @param {String} adminId 管理员ID
   * @param {String|Array} roleIds 角色ID
   * @return {Promise<Object>} 更新结果
   */
  async removeRoles(adminId, roleIds) {
    try {
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds];
      const result = await this.model.updateOne(
        { _id: adminId },
        {
          $pullAll: { userRoles: roles },
          $set: { updatedAt: new Date() },
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'removeRoles', { adminId, roleIds });
    }
  }

  /**
   * 获取管理员的角色信息
   * @param {String} adminId 管理员ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async getAdminRoles(adminId, options = {}) {
    const admin = await this.findById(adminId, {
      fields: 'userRoles',
      populate: [
        {
          path: 'userRoles',
          select: '_id roleName roleCode roleDesc status menus buttons',
        },
      ],
    });

    return admin ? admin.userRoles || [] : [];
  }
}

module.exports = AdminMongoRepository;
