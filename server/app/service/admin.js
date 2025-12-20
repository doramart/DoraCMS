/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2025-01-xx xx:xx:xx
 *
 * 新版 AdminService - 基于 Repository/Adapter 模式
 * 使用 Repository 接口替代直接访问 general.js
 */

'use strict';
const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const RepositoryExceptions = require('../repository/base/RepositoryExceptions');

class AdminService extends Service {
  constructor(ctx) {
    super(ctx);
    // 创建 Repository 工厂实例
    this.repositoryFactory = new RepositoryFactory(this.app);
    // 获取 Admin Repository
    this.repository = this.repositoryFactory.createAdminRepository(ctx);
    // 内容仓库用于删除校验
    this.contentRepository = this.repositoryFactory.createContentRepository(ctx);
  }

  /**
   * 获取管理员列表
   * @param payload
   * @param options
   */
  async find(payload, options = {}) {
    const defaultOptions = {
      searchKeys: ['userName', 'nickName', 'userPhone', 'userEmail'],
      populate: [],
      files: '-password',
    };

    return await this.repository.find(payload, { ...defaultOptions, ...options });
  }

  /**
   * 根据ID获取管理员信息
   * @param adminId
   * @param options
   */
  async findById(adminId, options = {}) {
    return await this.repository.findById(adminId, options);
  }

  /**
   * 根据查询条件获取单个管理员
   * @param params
   * @param options
   */
  async findOne(params = {}, options = {}) {
    return await this.repository.findOne(params, options);
  }

  /**
   * 根据查询条件获取单个管理员（item 方法的别名，保持兼容性）
   * @param params
   */
  async item(params = {}) {
    return await this.repository.findOne(params);
  }

  /**
   * 统计管理员数量
   * @param query
   */
  async count(query = {}) {
    return await this.repository.count(query);
  }

  /**
   * 创建管理员
   * @param data
   * @description 🔥 Phase2优化：Repository层自动验证唯一性并抛出语义化异常
   *             Service层无需手动检查，直接调用Repository
   */
  async create(data) {
    // Repository层会自动进行唯一性验证并抛出UniqueConstraintError
    // 无需在Service层重复检查，代码从21行减少到2行
    return await this.repository.create(data);
  }

  /**
   * 更新管理员信息
   * @param adminId
   * @param data
   * @description 🔥 Phase2优化：Repository层自动验证唯一性并抛出语义化异常
   *             Service层无需手动检查，代码从37行减少到2行
   */
  async update(adminId, data) {
    // Repository层会自动验证唯一性（排除当前ID）并抛出UniqueConstraintError
    // 无需在Service层重复检查，大幅简化代码
    return await this.repository.update(adminId, data);
  }

  /**
   * 删除管理员
   * @param {String|Array} adminIds
   * @param {Object} options
   * @param {Array} options.cachedAdmins 预先加载的管理员列表（可选，减少重复查询）
   */
  async remove(adminIds, options = {}) {
    const ids = Array.isArray(adminIds) ? adminIds : [adminIds];
    const normalizedIds = Array.from(new Set(ids.filter(Boolean).map(id => String(id))));

    if (!normalizedIds.length) {
      return { deletedCount: 0 };
    }

    const ctx = this.ctx;
    const operatorId = ctx?.session?.adminUserInfo?.id || ctx?.session?.adminUserInfo?._id;
    if (operatorId && normalizedIds.includes(String(operatorId))) {
      throw RepositoryExceptions.business.operationNotAllowed(ctx.__('admin.errors.deleteSelf'));
    }

    let cachedAdmins = Array.isArray(options.cachedAdmins) ? options.cachedAdmins : null;
    if (!cachedAdmins) {
      cachedAdmins = await Promise.all(
        normalizedIds.map(id =>
          this.findById(id, { fields: ['id', 'userName', 'nickName'] })
            .then(admin => admin || null)
            .catch(() => null)
        )
      );
    }

    const adminInfoMap = new Map();
    const deletableIds = Array.from(
      new Set(
        cachedAdmins
          .filter(admin => !!admin)
          .map(admin => {
            const data = typeof admin.toObject === 'function' ? admin.toObject() : admin;
            const adminId = data?.id || data?._id || data?.ID || data?.Id || null;
            if (adminId) {
              adminInfoMap.set(String(adminId), data);
            }
            return adminId;
          })
          .filter(Boolean)
          .map(id => String(id))
      )
    );

    if (!deletableIds.length) {
      return { deletedCount: 0 };
    }

    if (this.contentRepository) {
      for (const adminId of deletableIds) {
        const numericId = /^\d+$/.test(adminId) ? Number(adminId) : null;
        const authorFilter = numericId !== null ? { author: { $in: [adminId, numericId] } } : { author: adminId };
        const publishedCount = await this.contentRepository.count(authorFilter);
        if (publishedCount > 0) {
          const adminInfo = adminInfoMap.get(adminId) || {};
          const adminName = adminInfo.nickName || adminInfo.userName || adminId;
          throw RepositoryExceptions.business.operationNotAllowed(
            ctx.__('admin.errors.hasPublishedContent', [adminName])
          );
        }
      }
    }

    const totalAdmins = await this.count();
    if (totalAdmins - deletableIds.length < 1) {
      throw RepositoryExceptions.business.operationNotAllowed(ctx.__('admin.errors.lastAdmin'));
    }

    return await this.repository.remove(normalizedIds);
  }

  /**
   * 软删除管理员（禁用）
   * @param adminIds
   */
  async safeDelete(adminIds) {
    return await this.repository.safeDelete(adminIds);
  }

  /**
   * 管理员登录验证
   * @param identifier
   * @param password
   * @param loginType
   */
  async login(identifier, password, loginType = 'username') {
    if (!identifier || !password) {
      throw new Error('Identifier and password are required');
    }

    const admin = await this.repository.verifyLogin(identifier, password, loginType);

    if (!admin) {
      throw new Error('Invalid credentials or account disabled');
    }

    // 可以在这里添加登录日志记录
    // await this.recordLoginLog(admin.id);

    return admin;
  }

  /**
   * 检查是否需要初始化管理员
   * @return {Promise<boolean>}
   */
  async needsInitialization() {
    const total = await this.repository.count({});
    return total === 0;
  }

  /**
   * 初始化首位超级管理员
   * @param {Object} data 管理员数据
   * @return {Promise<Object>} 创建结果
   */
  async initializeFirstAdmin(data) {
    const needInit = await this.needsInitialization();
    if (!needInit) {
      throw RepositoryExceptions.business.operationNotAllowed(this.ctx.__('admin.init.alreadyInitialized'));
    }
    return await this.repository.create(data);
  }

  /**
   * 更新管理员密码
   * @param adminId
   * @param newPassword
   */
  async updatePassword(adminId, newPassword) {
    // 🔥 基础验证保留在Service层
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    return await this.repository.updatePassword(adminId, newPassword);
  }

  /**
   * 批量更新管理员状态
   * @param adminIds
   * @param status
   */
  async updateStatus(adminIds, status) {
    // 🔥 状态验证保留在Service层
    if (!['1', '2'].includes(status)) {
      throw new Error('Invalid status value');
    }

    return await this.repository.updateAdminStatus(adminIds, status);
  }

  /**
   * 激活管理员账户
   * @param adminId
   */
  async activate(adminId) {
    return await this.repository.update(adminId, { status: '1' });
  }

  /**
   * 禁用管理员账户
   * @param adminId
   */
  async deactivate(adminId) {
    return await this.repository.update(adminId, { status: '2' });
  }

  /**
   * 根据角色查找管理员
   * @param roleIds
   * @param payload
   * @param options
   */
  async findByRoles(roleIds, payload = {}, options = {}) {
    return await this.repository.findByRoles(roleIds, payload, options);
  }

  /**
   * 为管理员添加角色
   * @param adminId
   * @param roleIds
   */
  async addRoles(adminId, roleIds) {
    return await this.repository.addRoles(adminId, roleIds);
  }

  /**
   * 移除管理员角色
   * @param adminId
   * @param roleIds
   */
  async removeRoles(adminId, roleIds) {
    return await this.repository.removeRoles(adminId, roleIds);
  }

  /**
   * 获取管理员的角色信息
   * @param adminId
   * @param options
   */
  async getAdminRoles(adminId, options = {}) {
    return await this.repository.getAdminRoles(adminId, options);
  }

  /**
   * 根据状态查找管理员
   * @param status
   * @param payload
   * @param options
   */
  async findByStatus(status, payload = {}, options = {}) {
    return await this.repository.findByStatus(status, payload, options);
  }

  /**
   * 获取管理员统计信息
   */
  async getStats() {
    return await this.repository.getAdminStats();
  }

  /**
   * 检查用户名是否可用
   * @param userName
   * @param excludeId
   */
  async checkUserName(userName, excludeId = null) {
    const available = await this.repository.checkUserNameUnique(userName, excludeId);
    return { available, exists: !available };
  }

  /**
   * 检查邮箱是否可用
   * @param userEmail
   * @param excludeId
   */
  async checkEmail(userEmail, excludeId = null) {
    const available = await this.repository.checkEmailUnique(userEmail, excludeId);
    return { available, exists: !available };
  }

  /**
   * 检查手机号是否可用
   * @param userPhone
   * @param excludeId
   */
  async checkPhone(userPhone, excludeId = null) {
    const available = await this.repository.checkPhoneUnique(userPhone, excludeId);
    return { available, exists: !available };
  }

  /**
   * 获取启用的管理员列表
   * @param payload
   * @param options
   */
  async getActiveAdmins(payload = {}, options = {}) {
    const query = { status: '1' };
    return await this.find(payload, { ...options, query });
  }

  /**
   * 获取禁用的管理员列表
   * @param payload
   * @param options
   */
  async getInactiveAdmins(payload = {}, options = {}) {
    const query = { status: '2' };
    return await this.find(payload, { ...options, query });
  }

  /**
   * 根据性别获取管理员列表
   * @param gender
   * @param payload
   * @param options
   */
  async getAdminsByGender(gender, payload = {}, options = {}) {
    if (!['1', '2'].includes(gender)) {
      throw new Error('Invalid gender value');
    }

    const filters = { userGender: { $eq: gender } };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 搜索管理员
   * @param keyword
   * @param payload
   * @param options
   */
  async search(keyword, payload = {}, options = {}) {
    const searchPayload = {
      ...payload,
      searchkey: keyword,
    };

    return await this.find(searchPayload, options);
  }

  /**
   * 获取 Repository 统计信息（调试用）
   * @return {Object} 统计信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  // ===== 兼容旧版本的方法别名 =====

  /**
   * 兼容旧版本的 removes 方法
   * @param {Object} ctx 上下文
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {String} key 主键字段名，默认为 'id'
   * @return {Promise<Object>} 删除结果
   */
  async removes(ctx, ids, key = 'id') {
    return await this.remove(ids);
  }

  /**
   * 检查用户名是否唯一
   * @param userName
   * @param excludeId
   */
  async checkUserNameUnique(userName, excludeId = null) {
    return await this.repository.checkUserNameUnique(userName, excludeId);
  }

  /**
   * 检查手机号是否唯一
   * @param userPhone
   * @param excludeId
   */
  async checkPhoneUnique(userPhone, excludeId = null) {
    return await this.repository.checkPhoneUnique(userPhone, excludeId);
  }

  /**
   * 检查邮箱是否唯一
   * @param userEmail
   * @param excludeId
   */
  async checkEmailUnique(userEmail, excludeId = null) {
    return await this.repository.checkEmailUnique(userEmail, excludeId);
  }

  /**
   * 验证用户登录（直接调用Repository方法）
   * @param identifier 登录标识（用户名、邮箱或手机号）
   * @param password 密码
   * @param loginType 登录类型
   */
  async verifyLogin(identifier, password, loginType = 'username') {
    return await this.repository.verifyLogin(identifier, password, loginType);
  }
}

module.exports = AdminService;
