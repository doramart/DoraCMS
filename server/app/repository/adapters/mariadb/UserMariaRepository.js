/**
 * 优化后的 User MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 User 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 User 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 复杂JSON数组字段处理 - despises, favorites, praiseContents, praiseMessages, followers, watchers, watchTags
 * 2. 基于Message模块关联关系经验 - 用户自关联和多模块关联
 * 3. 基类提供通用 CRUD 方法 - 子类专注业务逻辑
 * 4. 可配置的钩子方法 - 灵活的数据处理管道
 * 5. 统一的深度 JSON 转换 - 支持复杂JSON字段和关联字段
 * 6. 密码安全处理 - 默认排除密码字段，支持特殊场景
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const UserSchema = require('../../schemas/mariadb/UserSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const CryptoUtil = require('../../../utils/CryptoUtil');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class UserMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'User');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;

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
      this.model = this.connection.getModel('User');

      if (!this.model) {
        throw new Error('User 模型未找到，请检查模型加载顺序');
      }

      // 🔥 注册User关联关系 - 基于Message模块关联关系处理经验
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // 用户创建的内容
          contents: {
            model: this.connection.getModel('Content'),
            type: 'hasMany',
            foreignKey: 'uAuthor',
            as: 'contents',
            select: ['id', 'title', 'stitle', 'createdAt', 'clickNum', 'likeNum'],
          },
          // 用户自关联 - 关注者（基于Message模块多重关联经验）
          userFollowers: {
            model: this.connection.getModel('User'),
            type: 'belongsToMany',
            through: 'user_followers',
            foreignKey: 'userId',
            otherKey: 'followerId',
            as: 'userFollowers',
            select: ['id', 'userName', 'name', 'logo', 'enable'],
          },
          // 用户自关联 - 被关注者
          userWatchers: {
            model: this.connection.getModel('User'),
            type: 'belongsToMany',
            through: 'user_followers',
            foreignKey: 'followerId',
            otherKey: 'userId',
            as: 'userWatchers',
            select: ['id', 'userName', 'name', 'logo', 'enable'],
          },
        },
      });

      // 🔥 调试：检查关联关系是否正确注册
      // console.log('🔍 User 模型关联:', Object.keys(this.model.associations || {}));
      // console.log('✅ UserMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ UserMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - User 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // 默认不加载关联数据，避免性能问题
      // 根据具体业务场景在Controller中指定需要的关联
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['userName', 'name', 'phoneNum', 'email', 'introduction'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'createdAt', order: 'desc' }, // 注册时间
      { field: 'loginActive', order: 'desc' }, // 活跃用户优先
    ];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.USER.STATUS_TEXT;
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
   * 🔥 User模块特有的需要排除的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // User模块特有的需要排除的字段
    const userExcludeFields = [
      'contents', // 关联字段 - 用户创建的内容
      'userFollowers', // 关联字段 - 关注者
      'userWatchers', // 关联字段 - 被关注者
      // 'password', // 敏感字段 - 默认排除（除非明确要求）
    ];

    return [...baseExcludeFields, ...userExcludeFields];
  }

  /**
   * 🔥 重写基类方法 - User模块密码字段处理
   * 基于Admin模块实战经验：默认排除密码字段
   * @param {Object} payload 查询参数
   * @param {Object} options 选项
   * @return {Promise} 查询结果
   */
  async find(payload = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 🔥 User模块实战经验：默认排除密码字段
      if (!options.fields && !payload.fields && !options.includePassword) {
        options.fields = this._getValidTableFields().filter(field => field !== 'password');
      }

      // 调用基类的 find 方法
      const result = await super.find(payload, options);

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 🔥 重写findOne方法 - User模块密码字段处理
   * 基于Admin模块实战经验：排除密码字段，除非明确要求包含
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(query = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 🔥 User模块实战经验：排除密码字段，除非明确要求包含
      if (!options.fields && !options.includePassword) {
        options.fields = this._getValidTableFields().filter(field => field !== 'password');
      }

      // 调用基类方法
      return await super.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findOne', { query, options });
    }
  }

  /**
   * 子类自定义的数据项处理 - User 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 添加 User 特有的数据处理
    // 性别文本
    if (item.gender) {
      item.genderText = item.gender === '0' ? '男' : '女';
    }

    // 用户组文本
    if (item.group) {
      item.groupText = item.group === '0' ? '普通用户' : '高级用户';
    }

    // 证件类型文本
    if (item.idType) {
      item.idTypeText = item.idType === '1' ? '身份证' : '其他证件';
    }

    // 确保数组字段的默认值（JSON字段已在Schema中自动处理）
    item.despises = item.despises || [];
    item.despiseMessage = item.despiseMessage || [];
    item.favorites = item.favorites || [];
    item.praiseContents = item.praiseContents || [];
    item.praiseMessages = item.praiseMessages || [];
    item.followers = item.followers || [];
    item.watchers = item.watchers || [];
    item.watchTags = item.watchTags || [];

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - User 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 User 特有的创建前处理
    // 设置默认值
    if (!data.state) data.state = '1';
    if (typeof data.enable === 'undefined') data.enable = true;
    if (!data.group) data.group = '0';
    if (!data.gender) data.gender = '0';
    if (!data.idType) data.idType = '1';
    if (!data.countryCode) data.countryCode = '86';

    // 确保数组字段初始化（Schema会自动处理JSON转换）
    data.despises = data.despises || [];
    data.despiseMessage = data.despiseMessage || [];
    data.favorites = data.favorites || [];
    data.praiseContents = data.praiseContents || [];
    data.praiseMessages = data.praiseMessages || [];
    data.followers = data.followers || [];
    data.watchers = data.watchers || [];
    data.watchTags = data.watchTags || [];

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - User 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 User 特有的更新前处理
    // 密码加密在Schema的setter中自动处理

    return data;
  }

  // ===== 🔥 重写CRUD方法以包含自动唯一性验证 =====

  /**
   * 创建用户（自动验证唯一性）
   * @param {Object} data 用户数据
   * @return {Promise<Object>} 创建的用户
   * @throws {UniqueConstraintError} 当字段不唯一时抛出
   */
  async create(data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性
      if (data.userName) {
        await this.checkUserNameUnique(data.userName);
      }
      if (data.email) {
        await this.checkEmailUnique(data.email);
      }
      if (data.phoneNum) {
        await this.checkPhoneUnique(data.phoneNum);
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
   * 更新用户（自动验证唯一性）
   * @param {String} id 用户ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的用户
   * @throws {UniqueConstraintError} 当字段不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性（排除当前ID）
      if (data.userName) {
        await this.checkUserNameUnique(data.userName, id);
      }
      if (data.email) {
        await this.checkEmailUnique(data.email, id);
      }
      if (data.phoneNum) {
        await this.checkPhoneUnique(data.phoneNum, id);
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

  // ===== 🔥 User 特有的业务方法 =====

  /**
   * 🔥 统一异常处理版本：检查用户名唯一性 - 必须使用UniqueChecker
   * @param {String} userName 用户名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当用户名已存在时抛出异常
   */
  async checkUserNameUnique(userName, excludeId = null) {
    try {
      // 🔥 必须使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
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
   * 🔥 统一异常处理版本：检查邮箱唯一性 - 必须使用UniqueChecker
   * @param {String} email 邮箱
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当邮箱已存在时抛出异常
   */
  async checkEmailUnique(email, excludeId = null) {
    try {
      // 🔥 必须使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
      const isUnique = await UniqueChecker.checkUserEmailUnique(this, email, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.emailExists(email);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkEmailUnique', { email, excludeId });
    }
  }

  /**
   * 🔥 统一异常处理版本：检查手机号唯一性 - 必须使用UniqueChecker
   * @param {String} phoneNum 手机号
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当手机号已存在时抛出异常
   */
  async checkPhoneUnique(phoneNum, excludeId = null) {
    try {
      // 🔥 必须使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
      const isUnique = await UniqueChecker.checkPhoneUnique(this, phoneNum, excludeId);
      if (!isUnique) {
        throw this.exceptions.user.phoneExists(phoneNum);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkPhoneUnique', { phoneNum, excludeId });
    }
  }

  /**
   * 🔥 User模块实战：用户登录验证 - 统一异常处理版本
   * @param {String} identifier 登录标识（用户名、邮箱或手机号）
   * @param {String} password 密码
   * @param {String} loginType 登录类型
   * @return {Promise<Object>} 用户信息
   * @throws {AuthenticationError} 认证失败时抛出异常
   * @throws {NotFoundError} 用户不存在时抛出异常
   * @throws {BusinessRuleError} 用户被禁用时抛出异常
   */
  async verifyLogin(identifier, password, loginType) {
    try {
      let user = null;
      switch (loginType) {
        case 'username':
          user = await this.findByUserName(identifier, {
            fields: ['id', 'userName', 'password', 'enable', 'state'],
            includePassword: true,
          });
          break;
        case 'email':
          user = await this.findByEmail(identifier, {
            fields: ['id', 'userName', 'password', 'enable', 'state'],
            includePassword: true,
          });
          break;
        case 'phone':
          user = await this.findByPhone(identifier, {
            fields: ['id', 'userName', 'password', 'enable', 'state'],
            includePassword: true,
          });
          break;
        default:
          throw new Error('Invalid login type');
      }

      if (!user) {
        throw this.exceptions.user.notFound();
      }

      if (!user.enable) {
        throw this.exceptions.user.disabled();
      }

      if (user.state !== '1') {
        throw this.exceptions.user.deleted();
      }

      // 验证密码 - 使用Schema中的实例方法
      const isValidPassword = user.verifyPassword
        ? user.verifyPassword(password)
        : CryptoUtil.verifyPassword(password, user.password, this.app.config.encrypt_key);

      if (!isValidPassword) {
        throw this.exceptions.user.invalidCredentials();
      }

      // 返回用户信息（不包含密码）
      delete user.password;
      return user;
    } catch (error) {
      this._handleError(error, 'verifyLogin', { identifier, loginType });
    }
  }

  /**
   * 根据用户名查找用户
   * @param {String} userName 用户名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 用户信息
   */
  async findByUserName(userName, options = {}) {
    const filters = { userName: { $eq: userName }, state: { $eq: '1' } };
    return await this.findOne(filters, options);
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email 邮箱
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 用户信息
   */
  async findByEmail(email, options = {}) {
    const filters = { email: { $eq: email }, state: { $eq: '1' } };
    return await this.findOne(filters, options);
  }

  /**
   * 根据手机号查找用户
   * @param {String} phoneNum 手机号
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 用户信息
   */
  async findByPhone(phoneNum, options = {}) {
    const filters = { phoneNum: { $eq: phoneNum }, state: { $eq: '1' } };
    return await this.findOne(filters, options);
  }

  /**
   * 🔥 User模块特有：添加到用户列表（收藏、点赞、关注等）
   * 基于Message模块JSON字段处理经验
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型（favorites, praiseContents, watchers等）
   * @param {String} targetId 目标ID
   * @return {Promise<Object>} 更新后的用户
   * @throws {NotFoundError} 当用户不存在时抛出异常
   */
  async addToUserList(userId, listType, targetId) {
    await this._ensureConnection();

    try {
      const user = await this.findById(userId, { fields: [listType] });
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 检查是否已存在
      const currentList = user[listType] || [];
      if (currentList.includes(targetId)) {
        return user; // 已存在，直接返回
      }

      // 添加到列表
      const newList = [...currentList, targetId];
      const updateData = {
        [listType]: newList,
        updatedAt: new Date(),
      };

      return await this.update(userId, updateData);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'addToUserList', { userId, listType, targetId });
    }
  }

  /**
   * 🔥 User模块特有：从用户列表移除（取消收藏、取消点赞、取消关注等）
   * 基于Message模块JSON字段处理经验
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型
   * @param {String} targetId 目标ID
   * @return {Promise<Object>} 更新后的用户
   * @throws {NotFoundError} 当用户不存在时抛出异常
   */
  async removeFromUserList(userId, listType, targetId) {
    await this._ensureConnection();

    try {
      const user = await this.findById(userId, { fields: [listType] });
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 从列表中移除
      const currentList = user[listType] || [];
      const newList = currentList.filter(id => id !== targetId);

      const updateData = {
        [listType]: newList,
        updatedAt: new Date(),
      };

      return await this.update(userId, updateData);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'removeFromUserList', { userId, listType, targetId });
    }
  }

  /**
   * 🔥 User模块特有：检查用户是否在某个列表中
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型
   * @param {String} targetId 目标ID
   * @return {Promise<Boolean>} 是否在列表中
   */
  async checkUserInList(userId, listType, targetId) {
    try {
      const user = await this.findById(userId, { fields: [listType] });
      if (!user) {
        return false;
      }

      const list = user[listType] || [];
      return list.includes(targetId);
    } catch (error) {
      this._handleError(error, 'checkUserInList', { userId, listType, targetId });
      return false;
    }
  }

  /**
   * 🔥 User模块特有：获取用户统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserStats(userId) {
    try {
      const user = await this.findById(userId, {
        fields: ['favorites', 'praiseContents', 'praiseMessages', 'followers', 'watchers', 'watchTags'],
      });

      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      return {
        favoritesCount: (user.favorites || []).length,
        praiseContentsCount: (user.praiseContents || []).length,
        praiseMessagesCount: (user.praiseMessages || []).length,
        followersCount: (user.followers || []).length,
        watchersCount: (user.watchers || []).length,
        watchTagsCount: (user.watchTags || []).length,
      };
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'getUserStats', { userId });
      return {
        favoritesCount: 0,
        praiseContentsCount: 0,
        praiseMessagesCount: 0,
        followersCount: 0,
        watchersCount: 0,
        watchTagsCount: 0,
      };
    }
  }

  /**
   * 🔥 通用实战：批量更新用户状态
   * @param {Array} userIds 用户ID数组
   * @param {String} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(userIds, state) {
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(userIds) ? userIds : [userIds];
      const mariadbIds = idArray.map(id => this.transformer.transformQueryForMariaDB({ id }).id);

      const whereCondition = { id: { [this.Op.in]: mariadbIds } };
      const updateData = { state, updatedAt: new Date() };

      const [result] = await this.model.update(updateData, { where: whereCondition });

      this._logOperation('batchUpdateState', { userIds, state }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'batchUpdateState', { userIds, state });
    }
  }

  /**
   * 🔥 User模块实战：获取用户统计信息（按状态分组）
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getUserEntityStats(filter = {}) {
    await this._ensureConnection();

    try {
      const whereCondition = this.transformer.transformQueryForMariaDB(filter);

      const stats = await this.model.findAll({
        attributes: [
          'state',
          [this.connection.getSequelize().fn('COUNT', this.connection.getSequelize().col('id')), 'count'],
        ],
        where: whereCondition,
        group: ['state'],
        raw: true,
      });

      const result = { total: 0, active: 0, deleted: 0 };
      stats.forEach(stat => {
        const count = parseInt(stat.count, 10);
        result.total += count;
        if (stat.state === '1') {
          result.active = count;
        } else if (stat.state === '0') {
          result.deleted = count;
        }
      });

      this._logOperation('getUserEntityStats', { filter }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getUserEntityStats', { filter });
      return { total: 0, active: 0, deleted: 0 };
    }
  }

  // 🔥 根据具体业务需求添加其他方法...
  // 参考Message模块实现：findByXXX, checkUniqueField, batchUpdateStatus 等
}

module.exports = UserMariaRepository;
