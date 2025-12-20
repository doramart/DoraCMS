/**
 * 优化后的 Message MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 Message 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 Message 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 复杂关联关系处理 - User、Admin、Content 多重关联
 * 2. 基类提供通用 CRUD 方法 - 子类专注业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持 praiseMembers JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const MessageSchema = require('../../schemas/mariadb/MessageSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');

class MessageMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Message');

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
      this.model = this.connection.getModel('Message');

      if (!this.model) {
        throw new Error('Message 模型未找到，请检查模型加载顺序');
      }

      // 🔥 注册Message关联关系 - 使用Schema中的实际别名作为key
      this.registerModel({
        mariaModel: this.model,
        relations: {
          contentInfo: {
            // 🔥 使用Schema中的实际别名
            model: this.connection.getModel('Content'),
            type: 'belongsTo',
            foreignKey: 'contentId',
            as: 'contentInfo',
            select: ['id', 'title', 'stitle'],
          },
          authorUser: {
            // 🔥 使用Schema中的实际别名
            model: this.connection.getModel('User'),
            type: 'belongsTo',
            foreignKey: 'author',
            as: 'authorUser',
            select: ['id', 'userName', 'enable', 'createdAt', 'logo'], // 🔥 修复字段名：date→createdAt
          },
          replyUser: {
            // 🔥 使用Schema中的实际别名
            model: this.connection.getModel('User'),
            type: 'belongsTo',
            foreignKey: 'replyAuthor',
            as: 'replyUser',
            select: ['id', 'userName', 'enable', 'createdAt', 'logo'], // 🔥 修复字段名：date→createdAt
          },
          adminAuthorUser: {
            // 🔥 使用Schema中的实际别名
            model: this.connection.getModel('Admin'),
            type: 'belongsTo',
            foreignKey: 'adminAuthor',
            as: 'adminAuthorUser',
            select: ['id', 'userName', 'status', 'createdAt', 'logo'], // 🔥 修复字段名：enable→status, date→createdAt
          },
          adminReplyUser: {
            // 🔥 使用Schema中的实际别名
            model: this.connection.getModel('Admin'),
            type: 'belongsTo',
            foreignKey: 'adminReplyAuthor',
            as: 'adminReplyUser',
            select: ['id', 'userName', 'status', 'createdAt', 'logo'], // 🔥 修复字段名：enable→status, date→createdAt
          },
        },
      });

      // 🔥 调试：检查关联关系是否正确注册
      // console.log('🔍 Message 模型关联:', Object.keys(this.model.associations || {}));
      // console.log('✅ MessageMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ MessageMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - Message 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        model: this.connection.getModel('Content'),
        as: 'contentInfo', // MariaDB 内部使用 contentInfo（避免命名冲突）
        attributes: ['id', 'title', 'stitle'],
      },
      {
        model: this.connection.getModel('User'),
        as: 'authorUser', // MariaDB 内部使用 authorUser
        attributes: ['id', 'userName', 'enable', 'createdAt', 'logo'], // 🔥 修复字段名：date→createdAt
      },
      {
        model: this.connection.getModel('User'),
        as: 'replyUser', // MariaDB 内部使用 replyUser
        attributes: ['id', 'userName', 'enable', 'createdAt', 'logo'], // 🔥 修复字段名：date→createdAt
      },
      {
        model: this.connection.getModel('Admin'),
        as: 'adminAuthorUser', // MariaDB 内部使用 adminAuthorUser
        attributes: ['id', 'userName', 'status', 'createdAt', 'logo'], // 🔥 修复字段名：enable→status, date→createdAt
      },
      {
        model: this.connection.getModel('Admin'),
        as: 'adminReplyUser', // MariaDB 内部使用 adminReplyUser
        attributes: ['id', 'userName', 'status', 'createdAt', 'logo'], // 🔥 修复字段名：enable→status, date→createdAt
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['contentTitle', 'content'];
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
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return {
      false: '正常',
      true: '已举报',
    };
  }

  /**
   * 🔥 关键方法：只转换 populate 中的 path 字段名
   * 让基类的 transformer 处理完整的 populate → include 转换
   * @param {Array} populateArray 来自 Controller 的 populate 配置
   * @return {Array} path 字段名适配后的 populate 配置
   * @protected
   */
  _adaptPopulateForMariaDB(populateArray = []) {
    const fieldMapping = {
      // 跨数据库兼容字段名 -> MariaDB 内部字段名
      contentId: 'contentInfo', // 避免与 content 字段冲突
      author: 'authorUser', // 明确指向 User 模型
      replyAuthor: 'replyUser', // 明确指向 User 模型
      adminAuthor: 'adminAuthorUser', // 明确指向 Admin 模型
      adminReplyAuthor: 'adminReplyUser', // 明确指向 Admin 模型
    };

    // 🔥 只转换 path 字段，保持其他属性不变，让基类处理完整转换
    return populateArray.map(populateItem => {
      if (typeof populateItem === 'object' && populateItem.path) {
        const originalPath = populateItem.path;
        const mappedPath = fieldMapping[originalPath] || originalPath;

        // 只修改 path，保持其他属性（select 等）不变
        return {
          ...populateItem,
          path: mappedPath,
        };
      }
      return populateItem;
    });
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
   * 🔥 Message特有的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // Message模块特有的需要排除的字段
    const messageExcludeFields = [
      'contentInfo', // 关联字段 - Content 模型 (修复命名冲突)
      'authorUser', // 关联字段 - User 模型
      'replyUser', // 关联字段 - User 模型
      'adminAuthorUser', // 关联字段 - Admin 模型
      'adminReplyUser', // 关联字段 - Admin 模型
      'parentMessage', // 关联字段 - 父留言
    ];

    return [...baseExcludeFields, ...messageExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - Message 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 添加 Message 特有的数据处理
    // 🔥 字段名映射：将关联字段映射为业务层期望的字段名
    if (item.contentInfo) {
      item.contentId = item.contentInfo; // 🔥 修复命名冲突后的字段映射
      delete item.contentInfo;
    }
    if (item.authorUser) {
      item.author = item.authorUser;
      delete item.authorUser;
    }
    if (item.replyUser) {
      item.replyAuthor = item.replyUser;
      delete item.replyUser;
    }
    if (item.adminAuthorUser) {
      item.adminAuthor = item.adminAuthorUser;
      delete item.adminAuthorUser;
    }
    if (item.adminReplyUser) {
      item.adminReplyAuthor = item.adminReplyUser;
      delete item.adminReplyUser;
    }

    // 添加留言类型文本
    if (item.utype) {
      item.utypeText = item.utype === '1' ? '管理员' : '普通用户';
    }

    // 数据处理已在Schema中自动完成

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - Message 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 Message 特有的创建前处理
    // 设置默认值
    if (!data.state) data.state = false;
    if (!data.utype) data.utype = '0';

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - Message 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 Message 特有的更新前处理
    // 无需特殊处理，Schema会自动处理数据转换

    return data;
  }

  // ===== 🔥 Message 特有的业务方法 =====

  /**
   * 根据内容ID查找留言
   * @param {String} contentId 内容ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 留言列表
   */
  async findByContentId(contentId, options = {}) {
    try {
      const filters = { contentId: { $eq: contentId }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByContentId', { contentId, options });
    }
  }

  /**
   * 根据作者ID查找留言
   * @param {String} authorId 用户ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 留言列表
   */
  async findByAuthor(authorId, options = {}) {
    try {
      const filters = { author: { $eq: authorId }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByAuthor', { authorId, options });
    }
  }

  /**
   * 根据父留言ID查找回复
   * @param {String} relationMsgId 父留言ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 回复列表
   */
  async findReplies(relationMsgId, options = {}) {
    try {
      const filters = { relationMsgId: { $eq: relationMsgId }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findReplies', { relationMsgId, options });
    }
  }

  /**
   * 点赞留言 - 基于User表存储点赞记录
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   * @throws {NotFoundError} 当留言不存在时抛出异常
   */
  async praiseMessage(messageId, userId) {
    await this._ensureConnection();

    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取User模型
      const UserModel = this.connection.getModel('User');
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经点赞
      const praiseMessages = user.praiseMessages || [];
      if (praiseMessages.includes(messageId)) {
        return msg; // 已经点赞，直接返回
      }

      // 4. 更新用户的点赞记录
      praiseMessages.push(messageId);
      await user.update({
        praiseMessages,
        updatedAt: new Date(),
      });

      // 5. 返回更新后的留言（不需要更新留言表中的计数字段）
      return await this.findById(messageId);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'praiseMessage', { messageId, userId });
    }
  }

  /**
   * 取消点赞留言 - 基于User表存储点赞记录
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   * @throws {NotFoundError} 当留言不存在时抛出异常
   */
  async unpraiseMessage(messageId, userId) {
    await this._ensureConnection();

    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取User模型
      const UserModel = this.connection.getModel('User');
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经点赞
      let praiseMessages = user.praiseMessages || [];
      if (!praiseMessages.includes(messageId)) {
        return msg; // 没有点赞，直接返回
      }

      // 4. 更新用户的点赞记录
      praiseMessages = praiseMessages.filter(id => id !== messageId);
      await user.update({
        praiseMessages,
        updatedAt: new Date(),
      });

      // 5. 返回更新后的留言（不需要更新留言表中的计数字段）
      return await this.findById(messageId);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'unpraiseMessage', { messageId, userId });
    }
  }

  /**
   * 踩留言 - 基于User表存储踩记录
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   * @throws {NotFoundError} 当留言不存在时抛出异常
   */
  async despiseMessage(messageId, userId) {
    await this._ensureConnection();

    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取User模型
      const UserModel = this.connection.getModel('User');
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经踩过
      const despiseMessages = user.despiseMessage || [];
      if (despiseMessages.includes(messageId)) {
        return msg; // 已经踩过，直接返回
      }

      // 4. 更新用户的踩记录
      despiseMessages.push(messageId);
      await user.update({
        despiseMessage: despiseMessages,
        updatedAt: new Date(),
      });

      // 5. 返回更新后的留言（不需要更新留言表中的计数字段）
      return await this.findById(messageId);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'despiseMessage', { messageId, userId });
    }
  }

  /**
   * 取消踩留言 - 基于User表存储踩记录
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   * @throws {NotFoundError} 当留言不存在时抛出异常
   */
  async undespiseMessage(messageId, userId) {
    await this._ensureConnection();

    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取User模型
      const UserModel = this.connection.getModel('User');
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经踩过
      let despiseMessages = user.despiseMessage || [];
      if (!despiseMessages.includes(messageId)) {
        return msg; // 没有踩过，直接返回
      }

      // 4. 更新用户的踩记录
      despiseMessages = despiseMessages.filter(id => id !== messageId);
      await user.update({
        despiseMessage: despiseMessages,
        updatedAt: new Date(),
      });

      // 5. 返回更新后的留言（不需要更新留言表中的计数字段）
      return await this.findById(messageId);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'undespiseMessage', { messageId, userId });
    }
  }

  /**
   * 根据管理员作者查找留言
   * @param {String} adminAuthorId 管理员ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 留言列表
   */
  async findByAdminAuthor(adminAuthorId, options = {}) {
    try {
      const filters = { adminAuthor: { $eq: adminAuthorId }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByAdminAuthor', { adminAuthorId, options });
    }
  }

  /**
   * 批量更新留言状态
   * @param {Array} messageIds 留言ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(messageIds, state) {
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(messageIds) ? messageIds : [messageIds];
      const mariadbIds = idArray.map(id => this.transformer.transformQueryForMariaDB({ id }).id);

      const whereCondition = { id: { [this.Op.in]: mariadbIds } };
      const updateData = { state, updatedAt: new Date() };

      const [result] = await this.model.update(updateData, { where: whereCondition });

      this._logOperation('batchUpdateState', { messageIds, state }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'batchUpdateState', { messageIds, state });
    }
  }

  /**
   * 获取留言统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getMessageStats(filter = {}) {
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

      const result = { total: 0, normal: 0, reported: 0 };
      stats.forEach(stat => {
        const count = parseInt(stat.count, 10);
        result.total += count;
        if (stat.state === false) {
          result.normal = count;
        } else if (stat.state === true) {
          result.reported = count;
        }
      });

      this._logOperation('getMessageStats', { filter }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getMessageStats', { filter });
      return { total: 0, normal: 0, reported: 0 };
    }
  }

  // ===== 🔥 重写基类方法以支持字段映射适配 =====

  /**
   * 重写 findOne 方法，支持跨数据库兼容的 populate 字段映射
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   * @override
   */
  async findOne(query = {}, options = {}) {
    try {
      await this._ensureConnection();

      // 🔥 关键：适配 populate 字段映射
      const adaptedOptions = { ...options };
      if (options.populate && Array.isArray(options.populate)) {
        adaptedOptions.populate = this._adaptPopulateForMariaDB(options.populate);
      }

      // 调用基类方法，使用适配后的选项
      const result = await super.findOne(query, adaptedOptions);

      // 🔥 数据返回时，将内部字段名映射回跨数据库兼容字段名
      if (result) {
        return this._mapResultFieldsToCompatible(result);
      }

      return result;
    } catch (error) {
      this._handleError(error, 'findOne', { query, options });
    }
  }

  /**
   * 重写 find 方法，支持跨数据库兼容的 populate 字段映射
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   * @override
   */
  async find(payload = {}, options = {}) {
    try {
      await this._ensureConnection();

      // 🔥 关键：适配 populate 字段映射
      const adaptedOptions = { ...options };
      if (options.populate && Array.isArray(options.populate)) {
        adaptedOptions.populate = this._adaptPopulateForMariaDB(options.populate);
      }

      // 调用基类方法，使用适配后的选项
      const result = await super.find(payload, adaptedOptions);

      // 🔥 数据返回时，将内部字段名映射回跨数据库兼容字段名
      if (result && result.docs && Array.isArray(result.docs)) {
        result.docs = result.docs.map(doc => this._mapResultFieldsToCompatible(doc));
      }

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 🔥 将查询结果中的 MariaDB 内部字段名映射回跨数据库兼容字段名
   * @param {Object} result 查询结果
   * @return {Object} 映射后的结果
   * @private
   */
  _mapResultFieldsToCompatible(result) {
    if (!result || typeof result !== 'object') return result;

    const mappedResult = { ...result };

    // 字段映射：MariaDB 内部字段名 -> 跨数据库兼容字段名
    const fieldMapping = {
      contentInfo: 'contentId',
      authorUser: 'author',
      replyUser: 'replyAuthor',
      adminAuthorUser: 'adminAuthor',
      adminReplyUser: 'adminReplyAuthor',
    };

    // 执行字段映射
    Object.keys(fieldMapping).forEach(internalField => {
      const compatibleField = fieldMapping[internalField];
      if (mappedResult.hasOwnProperty(internalField)) {
        mappedResult[compatibleField] = mappedResult[internalField];
        delete mappedResult[internalField];
      }
    });

    return mappedResult;
  }

  // 🔥 根据具体业务需求添加其他方法...
  // 参考Admin、Content模块实现：findByXXX, checkUniqueField, batchUpdateStatus 等
}

module.exports = MessageMariaRepository;
