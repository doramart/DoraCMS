/**
 * 优化后的 ApiKey MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 ApiKey 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 ApiKey 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 ApiKey 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const ApiKeySchema = require('../../schemas/mariadb/ApiKeySchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ApiKeyMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'ApiKey');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
    this.userModel = null;

    // 注意：不在构造函数中同步调用 _initializeConnection
    // 而是在 _ensureConnection 中异步调用
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();

      // 🔥 使用连接管理器中已建立关联关系的模型
      this.model = this.connection.getModel('ApiKey');
      this.userModel = this.connection.getModel('User');

      if (!this.model || !this.userModel) {
        throw new Error('ApiKey 或 User 模型未找到，请检查模型加载顺序');
      }

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          user: {
            model: this.userModel,
            type: 'belongsTo',
            foreignKey: 'userId',
            as: 'user',
            select: ['id', 'userName', 'email', 'phoneNum', 'logo'],
          },
        },
      });

      // console.log('✅ ApiKeyMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ ApiKeyMariaRepository initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保连接已建立
   * @private
   */
  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  // ===== 🔥 重写基类的抽象方法 - ApiKey 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        model: this.userModel,
        as: 'user',
        attributes: ['id', 'userName', 'email', 'phoneNum', 'logo'],
        where: { enable: true }, // 只查询启用的用户
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['name', 'key'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'createdAt', order: 'desc' },
      { field: 'lastUsedAt', order: 'desc' },
    ];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.API_KEY.STATUS_TEXT;
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从Schema获取所有字段，大幅减少维护成本
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 ApiKey模块特有的需要排除的字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // ApiKey模块特有的需要排除的字段
    const apiKeyExcludeFields = [
      'user', // 关联字段 - 通过belongsTo管理
    ];

    return [...baseExcludeFields, ...apiKeyExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - ApiKey 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param {Object} options 查询选项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item, options);

    // 添加 ApiKey 特有的数据处理
    // 添加过期状态
    if (item.expiresAt) {
      item.isExpired = new Date(item.expiresAt) < new Date();
    }

    // 确保数组字段的默认值
    item.permissions = item.permissions || [];
    item.ipWhitelist = item.ipWhitelist || [];

    // 确保速率限制的默认值
    if (!item.rateLimit) {
      item.rateLimit = { requests: 100, period: 3600 };
    }

    // 添加安全信息（隐藏secret）
    // 🔥 类似于 User/Admin 的 includePassword，支持 includeSecret 选项
    if (item.secret) {
      item.secretMasked = item.secret.substring(0, 8) + '****';
      // 在非特殊情况下隐藏完整secret（除非明确要求包含）
      if (!options.includeSecret) {
        delete item.secret;
      }
    }

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - ApiKey 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 ApiKey 特有的创建前处理
    // 验证必填字段
    if (!data.name || data.name.trim() === '') {
      throw this.exceptions.apiKey.nameRequired();
    }

    if (!data.userId) {
      throw this.exceptions.apiKey.userIdRequired();
    }

    // 验证字段长度
    if (data.name && data.name.length > 100) {
      throw this.exceptions.apiKey.nameTooLong(100);
    }

    // 设置默认值
    if (!data.status) data.status = 'active';

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - ApiKey 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 ApiKey 特有的更新前处理
    // 验证字段长度
    if (data.name && data.name.length > 100) {
      throw this.exceptions.apiKey.nameTooLong(100);
    }

    // 验证状态值
    if (data.status && !['active', 'disabled'].includes(data.status)) {
      throw this.exceptions.apiKey.invalidStatus(data.status);
    }

    return data;
  }

  // ===== 🔥 ApiKey 特有的业务方法 =====

  /**
   * 生成API Key和Secret对
   * @return {Object} 包含key和secret的对象
   */
  generateKeyPair() {
    const key = uuidv4();
    const secret = crypto.randomBytes(32).toString('hex');
    return { key, secret };
  }

  /**
   * 检查API Key是否唯一
   * @param {String} key API Key
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当API Key已存在时抛出异常
   */
  async checkKeyUnique(key, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkApiKeyUnique(this, key, excludeId);
      if (!isUnique) {
        throw this.exceptions.apiKey.keyExists(key);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkKeyUnique', { key, excludeId });
    }
  }

  /**
   * 检查API Key名称在用户维度下是否唯一
   * @param {String} name API Key名称
   * @param {String} userId 用户ID
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当名称已存在时抛出异常
   */
  async checkNameUnique(name, userId, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkApiKeyNameUnique(this, name, userId, excludeId);
      if (!isUnique) {
        throw this.exceptions.apiKey.nameExists(name);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkNameUnique', { name, userId, excludeId });
    }
  }

  /**
   * 根据Key查找API Key
   * @param {String} key API Key
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} API Key信息
   */
  async findByKey(key, options = {}) {
    try {
      const query = { key };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByKey', { key, options });
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
    try {
      const filters = { userId, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByUserId', { userId, payload, options });
    }
  }

  /**
   * 验证API Key和Secret
   * @param {String} key API Key
   * @param {String} secret API Secret
   * @return {Promise<Object|null>} API Key信息（如果验证成功）
   * @throws {AuthenticationError} 认证失败时抛出异常
   * @throws {BusinessRuleError} 业务规则违反时抛出异常
   */
  async verifyApiKey(key, secret) {
    try {
      // 查找API Key（包含secret字段）
      const apiKey = await this.findByKey(key, {
        fields: [
          'id',
          'userId',
          'name',
          'key',
          'secret',
          'status',
          'expiresAt',
          'permissions',
          'ipWhitelist',
          'rateLimit',
        ],
      });

      if (!apiKey) {
        throw this.exceptions.apiKey.keyNotFound(key);
      }

      // 验证Secret
      if (apiKey.secret !== secret) {
        throw this.exceptions.apiKey.keySecretMismatch();
      }

      // 检查状态
      if (apiKey.status !== 'active') {
        throw this.exceptions.apiKey.disabled(apiKey.id);
      }

      // 检查过期时间
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        throw this.exceptions.apiKey.expired(apiKey.id);
      }

      // 更新最后使用时间
      await this.updateLastUsedAt(key, new Date());

      // 返回API Key信息（不包含secret）
      delete apiKey.secret;
      return apiKey;
    } catch (error) {
      this._handleError(error, 'verifyApiKey', { key });
    }
  }

  /**
   * 更新API Key的最后使用时间
   * @param {String} key API Key
   * @param {Date} lastUsedAt 最后使用时间
   * @return {Promise<Object>} 更新结果
   */
  async updateLastUsedAt(key, lastUsedAt = new Date()) {
    await this._ensureConnection();

    try {
      const result = await this.model.update({ lastUsedAt }, { where: { key } });

      this._logOperation('updateLastUsedAt', { key, lastUsedAt }, result);
      return { modifiedCount: result[0] };
    } catch (error) {
      this._handleError(error, 'updateLastUsedAt', { key, lastUsedAt });
    }
  }

  /**
   * 轮换API Key（重新生成key和secret）
   * @param {String} apiKeyId API Key ID
   * @return {Promise<Object>} 更新后的API Key
   */
  async rotateApiKey(apiKeyId) {
    try {
      const { key, secret } = this.generateKeyPair();

      // 检查新生成的key是否唯一
      await this.checkKeyUnique(key, apiKeyId);

      await this.update(apiKeyId, {
        key,
        secret,
        updatedAt: new Date(),
      });

      // 🔥 轮换后重新获取，包含完整的 secret（用户需要看到新的 secret）
      const result = await this.findById(apiKeyId, {
        includeSecret: true,
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('rotateApiKey', { apiKeyId }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'rotateApiKey', { apiKeyId });
    }
  }

  /**
   * 检查用户的API Key数量是否超过限制
   * @param {String} userId 用户ID
   * @param {Number} maxKeys 最大API Key数量
   * @return {Promise<Boolean>} 是否超过限制
   * @throws {BusinessRuleError} 当超过限制时抛出异常
   */
  async checkUserApiKeyLimit(userId, maxKeys = 10) {
    try {
      const count = await this.count({ userId, status: 'active' });

      if (count >= maxKeys) {
        throw this.exceptions.apiKey.tooManyKeys(userId, maxKeys);
      }

      return true;
    } catch (error) {
      if (error.name === 'BusinessRuleError') {
        throw error;
      }
      this._handleError(error, 'checkUserApiKeyLimit', { userId, maxKeys });
    }
  }

  /**
   * 验证IP白名单格式
   * @param {Array} ipWhitelist IP白名单数组
   * @throws {ValidationError} IP格式无效时抛出异常
   */
  validateIpWhitelist(ipWhitelist) {
    if (!Array.isArray(ipWhitelist)) {
      throw this.exceptions.apiKey.invalidIpWhitelist('IP白名单必须是数组');
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    for (const ip of ipWhitelist) {
      if (typeof ip !== 'string' || !ipRegex.test(ip)) {
        throw this.exceptions.apiKey.invalidIpWhitelist(`无效的IP地址格式: ${ip}`);
      }

      // 验证IP地址的每个部分是否在0-255范围内
      const parts = ip.split('/')[0].split('.');
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (num < 0 || num > 255) {
          throw this.exceptions.apiKey.invalidIpWhitelist(`无效的IP地址: ${ip}`);
        }
      }
    }
  }

  /**
   * 验证速率限制配置
   * @param {Object} rateLimit 速率限制配置
   * @throws {ValidationError} 配置无效时抛出异常
   */
  validateRateLimit(rateLimit) {
    if (!rateLimit || typeof rateLimit !== 'object') {
      throw this.exceptions.apiKey.invalidRateLimit('速率限制配置必须是对象');
    }

    if (typeof rateLimit.requests !== 'number' || rateLimit.requests <= 0) {
      throw this.exceptions.apiKey.invalidRateLimit('请求数必须是正整数');
    }

    if (typeof rateLimit.period !== 'number' || rateLimit.period <= 0) {
      throw this.exceptions.apiKey.invalidRateLimit('时间周期必须是正整数（秒）');
    }

    // 验证合理范围
    if (rateLimit.requests > 10000) {
      throw this.exceptions.apiKey.invalidRateLimit('请求数不能超过10000');
    }

    if (rateLimit.period > 86400) {
      // 最大24小时
      throw this.exceptions.apiKey.invalidRateLimit('时间周期不能超过86400秒（24小时）');
    }
  }

  /**
   * 批量更新API Key状态
   * @param {Array} apiKeyIds API Key ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(apiKeyIds, status) {
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(apiKeyIds) ? apiKeyIds : [apiKeyIds];

      // 验证状态值
      if (!['active', 'disabled'].includes(status)) {
        throw this.exceptions.apiKey.invalidStatus(status);
      }

      const result = await this.model.update(
        { status, updatedAt: new Date() },
        { where: { id: { [this.Op.in]: idArray } } }
      );

      this._logOperation('batchUpdateStatus', { apiKeyIds, status }, result);
      return { modifiedCount: result[0] };
    } catch (error) {
      this._handleError(error, 'batchUpdateStatus', { apiKeyIds, status });
    }
  }

  /**
   * 获取用户的API Key统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserApiKeyStats(userId) {
    await this._ensureConnection();

    try {
      const stats = await this.model.findAll({
        where: { userId },
        attributes: [
          'status',
          [this.connection.getSequelize().fn('COUNT', this.connection.getSequelize().col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      const result = {
        total: 0,
        active: 0,
        disabled: 0,
        expired: 0,
      };

      stats.forEach(item => {
        const count = parseInt(item.count);
        result.total += count;

        switch (item.status) {
          case 'active':
            result.active = count;
            break;
          case 'disabled':
            result.disabled = count;
            break;
        }
      });

      // 统计过期的API Key
      const expiredCount = await this.count({
        userId,
        status: 'active',
        expiresAt: { [this.Op.lt]: new Date() },
      });
      result.expired = expiredCount;

      return result;
    } catch (error) {
      this._handleError(error, 'getUserApiKeyStats', { userId });
      return { total: 0, active: 0, disabled: 0, expired: 0 };
    }
  }

  /**
   * 清理过期的API Keys
   * @param {String} userId 用户ID（可选，不提供则清理所有用户）
   * @return {Promise<Object>} 清理结果
   */
  async cleanupExpiredKeys(userId = null) {
    await this._ensureConnection();

    try {
      const where = {
        status: 'active',
        expiresAt: { [this.Op.lt]: new Date() },
      };

      if (userId) {
        where.userId = userId;
      }

      const result = await this.model.update({ status: 'disabled', updatedAt: new Date() }, { where });

      this._logOperation('cleanupExpiredKeys', { userId }, result);
      return { modifiedCount: result[0] };
    } catch (error) {
      this._handleError(error, 'cleanupExpiredKeys', { userId });
    }
  }
}

module.exports = ApiKeyMariaRepository;
