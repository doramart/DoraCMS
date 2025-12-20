/**
 * 标准化的 Message MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const _ = require('lodash');

class MessageMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Message');

    // 设置 MongoDB 模型
    this.model = this.app.model.Message;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // 定义关联关系
        contentId: {
          model: this.app.model.Content,
          path: 'contentId',
          select: ['title', 'stitle', '_id'],
        },
        author: {
          model: this.app.model.User,
          path: 'author',
          select: ['userName', '_id', 'enable', 'date', 'logo'],
        },
        replyAuthor: {
          model: this.app.model.User,
          path: 'replyAuthor',
          select: ['userName', '_id', 'enable', 'date', 'logo'],
        },
        adminAuthor: {
          model: this.app.model.Admin,
          path: 'adminAuthor',
          select: ['userName', '_id', 'enable', 'date', 'logo'],
        },
        adminReplyAuthor: {
          model: this.app.model.Admin,
          path: 'adminReplyAuthor',
          select: ['userName', '_id', 'enable', 'date', 'logo'],
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
    return [
      { path: 'contentId', select: ['title', 'stitle', '_id'] },
      { path: 'author', select: ['userName', '_id', 'enable', 'date', 'logo'] },
      { path: 'replyAuthor', select: ['userName', '_id', 'enable', 'date', 'logo'] },
      { path: 'adminAuthor', select: ['userName', '_id', 'enable', 'date', 'logo'] },
      { path: 'adminReplyAuthor', select: ['userName', '_id', 'enable', 'date', 'logo'] },
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
   * 子类自定义的数据项处理（业务特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 🔥 添加业务特定的数据处理

    // 添加留言类型文本
    if (item.utype) {
      item.utypeText = item.utype === '1' ? '管理员' : '普通用户';
    }

    // 添加状态文本
    if (typeof item.state === 'boolean') {
      item.stateText = item.state ? '已举报' : '正常';
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加业务特定的创建前处理
    // 设置默认值
    if (!data.state) data.state = false;
    if (!data.utype) data.utype = '0';

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加业务特定的更新前处理
    // 无需特殊处理，保持原有逻辑

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
    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取用户信息
      const UserModel = this.app.model.User;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经点赞
      let praiseMessages = [];
      try {
        praiseMessages = user.praiseMessages ? JSON.parse(user.praiseMessages) : [];
      } catch {
        praiseMessages = [];
      }

      if (praiseMessages.includes(messageId)) {
        return msg; // 已经点赞，直接返回
      }

      // 4. 更新用户的点赞记录
      praiseMessages.push(messageId);
      await UserModel.findByIdAndUpdate(userId, {
        praiseMessages: JSON.stringify(praiseMessages),
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
    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取用户信息
      const UserModel = this.app.model.User;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经点赞
      let praiseMessages = [];
      try {
        praiseMessages = user.praiseMessages ? JSON.parse(user.praiseMessages) : [];
      } catch {
        praiseMessages = [];
      }

      if (!praiseMessages.includes(messageId)) {
        return msg; // 没有点赞，直接返回
      }

      // 4. 更新用户的点赞记录
      praiseMessages = praiseMessages.filter(id => id !== messageId);
      await UserModel.findByIdAndUpdate(userId, {
        praiseMessages: JSON.stringify(praiseMessages),
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
    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取用户信息
      const UserModel = this.app.model.User;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经踩过
      let despiseMessages = [];
      try {
        despiseMessages = user.despiseMessage ? JSON.parse(user.despiseMessage) : [];
      } catch {
        despiseMessages = [];
      }

      if (despiseMessages.includes(messageId)) {
        return msg; // 已经踩过，直接返回
      }

      // 4. 更新用户的踩记录
      despiseMessages.push(messageId);
      await UserModel.findByIdAndUpdate(userId, {
        despiseMessage: JSON.stringify(despiseMessages),
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
    try {
      // 1. 检查留言是否存在
      const msg = await this.findById(messageId);
      if (!msg) {
        throw this.exceptions.message.notFound(messageId);
      }

      // 2. 获取用户信息
      const UserModel = this.app.model.User;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 3. 检查用户是否已经踩过
      let despiseMessages = [];
      try {
        despiseMessages = user.despiseMessage ? JSON.parse(user.despiseMessage) : [];
      } catch {
        despiseMessages = [];
      }

      if (!despiseMessages.includes(messageId)) {
        return msg; // 没有踩过，直接返回
      }

      // 4. 更新用户的踩记录
      despiseMessages = despiseMessages.filter(id => id !== messageId);
      await UserModel.findByIdAndUpdate(userId, {
        despiseMessage: JSON.stringify(despiseMessages),
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
    try {
      const idArray = Array.isArray(messageIds) ? messageIds : [messageIds];
      const result = await this.model.updateMany({ _id: { $in: idArray } }, { $set: { state, updatedAt: new Date() } });
      this._logOperation('batchUpdateState', { messageIds, state }, result);
      return { modifiedCount: result.modifiedCount };
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
    try {
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
          },
        },
      ];
      const result = await this.model.aggregate(pipeline);
      const stats = { total: 0, normal: 0, reported: 0 };
      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        if (item._id === false) {
          stats.normal = count;
        } else if (item._id === true) {
          stats.reported = count;
        }
      });
      this._logOperation('getMessageStats', { filter }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getMessageStats', { filter });
      return { total: 0, normal: 0, reported: 0 };
    }
  }
}

module.exports = MessageMongoRepository;
