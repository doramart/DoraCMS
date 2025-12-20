/**
 * ApiKey Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class ApiKeyService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 ApiKey Repository
    this.repository = this.repositoryFactory.createApiKeyRepository(ctx);
  }

  /**
   * 查找记录列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async find(payload = {}, options = {}) {
    return await this.repository.find(payload, options);
  }

  /**
   * 查找单条记录
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 统计记录数量
   * @param {Object} filters 查询条件（标准化格式）
   * @return {Promise<Number>} 记录数量
   */
  async count(filters = {}) {
    return await this.repository.count(filters);
  }

  /**
   * 创建记录
   * @param {Object} data 记录数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    return await this.repository.create(data);
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    return await this.repository.update(id, data);
  }

  /**
   * 删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    return await this.repository.remove(ids, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: 'disabled' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // ===== 🔥 ApiKey 特有的业务方法 =====

  /**
   * 生成API Key和Secret对
   * @return {Object} 包含key和secret的对象
   */
  generateKeyPair() {
    return this.repository.generateKeyPair();
  }

  /**
   * 创建新的API Key（带完整业务验证）
   * @param {String} userId 用户ID
   * @param {Object} data API Key数据
   * @return {Promise<Object>} 创建的API Key
   */
  async createApiKey(userId, data) {
    // 验证用户API Key数量限制
    await this.repository.checkUserApiKeyLimit(userId);

    // 生成key和secret
    const { key, secret } = this.generateKeyPair();

    // 验证唯一性
    await this.repository.checkKeyUnique(key);

    if (data.name) {
      await this.repository.checkNameUnique(data.name, userId);
    }

    // 验证IP白名单格式
    if (data.ipWhitelist && data.ipWhitelist.length > 0) {
      this.repository.validateIpWhitelist(data.ipWhitelist);
    }

    // 验证速率限制配置
    if (data.rateLimit) {
      this.repository.validateRateLimit(data.rateLimit);
    }

    const payload = {
      userId,
      name: data.name,
      key,
      secret,
      permissions: data.permissions || [],
      ipWhitelist: data.ipWhitelist || [],
      rateLimit: data.rateLimit || { requests: 100, period: 3600 },
      expiresAt: data.expiresAt,
      status: 'active',
    };

    const result = await this.repository.create(payload);

    // 🔥 创建后重新获取，包含完整的 secret（这是用户唯一能看到完整 secret 的机会）
    return await this.repository.findById(result.id, {
      includeSecret: true,
      populate: this.repository._getDefaultPopulate(),
    });
  }

  /**
   * 根据用户ID获取API Key列表
   * @param {String} userId 用户ID
   * @param {Object} query 查询参数
   * @return {Promise<Object>} API Key列表
   */
  async list(userId, query = {}) {
    const { page = 1, pageSize = 10 } = query;
    const payload = {
      current: page,
      pageSize,
      isPaging: '1',
    };

    const options = {
      filters: { userId: { $eq: userId } },
      sort: [{ field: 'createdAt', order: 'desc' }],
    };

    return await this.repository.find(payload, options);
  }

  /**
   * 获取API Key详情
   * @param {String} userId 用户ID
   * @param {String} id API Key ID
   * @return {Promise<Object>} API Key详情
   */
  async detail(userId, id) {
    const apiKey = await this.repository.findOne({ id, userId }, { populate: this.repository._getDefaultPopulate() });

    if (!apiKey) {
      throw this.repository.exceptions.apiKey.notFound(id);
    }

    return apiKey;
  }

  /**
   * 更新API Key
   * @param {String} userId 用户ID
   * @param {String} id API Key ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的API Key
   */
  async updateApiKey(userId, id, data) {
    // 验证API Key存在且属于该用户
    const existingApiKey = await this.detail(userId, id);

    // 验证名称唯一性（如果更新了名称）
    if (data.name && data.name !== existingApiKey.name) {
      await this.repository.checkNameUnique(data.name, userId, id);
    }

    // 验证IP白名单格式
    if (data.ipWhitelist && data.ipWhitelist.length > 0) {
      this.repository.validateIpWhitelist(data.ipWhitelist);
    }

    // 验证速率限制配置
    if (data.rateLimit) {
      this.repository.validateRateLimit(data.rateLimit);
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    return await this.repository.update(id, updateData);
  }

  /**
   * 删除API Key
   * @param {String} userId 用户ID
   * @param {String} id API Key ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteApiKey(userId, id) {
    // 验证API Key存在且属于该用户
    await this.detail(userId, id);

    // 检查是否为最后一个API Key（可选的业务规则）
    // await this.repository.checkNotLastApiKey(userId, id);

    return await this.repository.remove(id, 'id');
  }

  /**
   * 禁用API Key
   * @param {String} userId 用户ID
   * @param {String} id API Key ID
   * @return {Promise<Object>} 更新后的API Key
   */
  async disable(userId, id) {
    // 验证API Key存在且属于该用户
    await this.detail(userId, id);

    return await this.repository.update(id, {
      status: 'disabled',
      updatedAt: new Date(),
    });
  }

  /**
   * 启用API Key
   * @param {String} userId 用户ID
   * @param {String} id API Key ID
   * @return {Promise<Object>} 更新后的API Key
   */
  async enable(userId, id) {
    // 验证API Key存在且属于该用户
    await this.detail(userId, id);

    return await this.repository.update(id, {
      status: 'active',
      updatedAt: new Date(),
    });
  }

  /**
   * 轮换API Key
   * @param {String} userId 用户ID
   * @param {String} id API Key ID
   * @return {Promise<Object>} 更新后的API Key
   */
  async rotate(userId, id) {
    // 验证API Key存在且属于该用户
    await this.detail(userId, id);

    return await this.repository.rotateApiKey(id);
  }

  /**
   * 验证API Key
   * @param {String} key API Key
   * @param {String} secret API Secret
   * @return {Promise<Object|Boolean>} API Key信息或false
   */
  async verify(key, secret) {
    try {
      return await this.repository.verifyApiKey(key, secret);
    } catch (error) {
      // 认证失败返回false，而不是抛出异常
      if (error.name === 'AuthenticationError' || error.name === 'BusinessRuleError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 根据用户ID查找API Keys
   * @param {String} userId 用户ID
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Array>} API Key列表
   */
  async findByUserId(userId, payload = {}, options = {}) {
    return await this.repository.findByUserId(userId, payload, options);
  }

  /**
   * 根据Key查找API Key
   * @param {String} key API Key
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} API Key信息
   */
  async findByKey(key, options = {}) {
    return await this.repository.findByKey(key, options);
  }

  /**
   * 检查API Key是否唯一
   * @param {String} key API Key
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkKeyUnique(key, excludeId = null) {
    return await this.repository.checkKeyUnique(key, excludeId);
  }

  /**
   * 检查API Key名称是否唯一（用户维度）
   * @param {String} name API Key名称
   * @param {String} userId 用户ID
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkNameUnique(name, userId, excludeId = null) {
    return await this.repository.checkNameUnique(name, userId, excludeId);
  }

  /**
   * 更新API Key的最后使用时间
   * @param {String} key API Key
   * @param {Date} lastUsedAt 最后使用时间
   * @return {Promise<Object>} 更新结果
   */
  async updateLastUsedAt(key, lastUsedAt = new Date()) {
    return await this.repository.updateLastUsedAt(key, lastUsedAt);
  }

  /**
   * 批量更新API Key状态
   * @param {Array} apiKeyIds API Key ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(apiKeyIds, status) {
    return await this.repository.batchUpdateStatus(apiKeyIds, status);
  }

  /**
   * 获取用户的API Key统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserApiKeyStats(userId) {
    return await this.repository.getUserApiKeyStats(userId);
  }

  /**
   * 清理过期的API Keys
   * @param {String} userId 用户ID（可选）
   * @return {Promise<Object>} 清理结果
   */
  async cleanupExpiredKeys(userId = null) {
    return await this.repository.cleanupExpiredKeys(userId);
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  /**
   * 清除 Repository 缓存
   */
  clearRepositoryCache() {
    this.repositoryFactory.clearCache();
  }
}

module.exports = ApiKeyService;
