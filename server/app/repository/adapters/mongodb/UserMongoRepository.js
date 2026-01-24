/**
 * 标准化的 User MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 *
 * 基于Message模块关联关系处理经验，User模块具有以下特点：
 * 1. 复杂的JSON数组字段：despises, favorites, praiseContents, praiseMessages, followers, watchers, watchTags
 * 2. 自关联关系：followers/watchers 用户互相关注
 * 3. 多模块关联：与Content、Message、ContentTag的关联
 * 4. 密码安全处理：默认排除密码字段，支持特殊场景
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const CryptoUtil = require('../../../utils/CryptoUtil');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class UserMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'User');

    // 设置 MongoDB 模型
    this.model = this.app.model.User;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // 用户创建的内容
        contents: {
          model: this.app.model.Content,
          path: 'contents',
          select: ['title', 'stitle', 'createdAt', 'clickNum', 'likeNum'],
        },
        // 关注的用户（我关注的创作者）
        watchers: {
          model: this.app.model.User,
          path: 'watchers',
          select: ['userName', 'name', 'logo', 'enable'],
        },
        // 粉丝（关注我的创作者）
        followers: {
          model: this.app.model.User,
          path: 'followers',
          select: ['userName', 'name', 'logo', 'enable'],
        },
        // 关注的标签
        watchTags: {
          model: this.app.model.ContentTag,
          path: 'watchTags',
          select: ['name', 'alias', 'enable'],
        },
        // 收藏的文章
        favorites: {
          model: this.app.model.Content,
          path: 'favorites',
          select: ['title', 'stitle', 'createdAt', 'clickNum', 'likeNum'],
        },
        // 点赞的文章
        praiseContents: {
          model: this.app.model.Content,
          path: 'praiseContents',
          select: ['title', 'stitle', 'createdAt', 'clickNum', 'likeNum'],
        },
        // 点赞的评论
        praiseMessages: {
          model: this.app.model.Message,
          path: 'praiseMessages',
          select: ['content', 'createdAt', 'praise_num'],
        },
        // 踩过的文章
        despises: {
          model: this.app.model.Content,
          path: 'despises',
          select: ['title', 'stitle', 'createdAt'],
        },
        // 踩过的评论
        despiseMessage: {
          model: this.app.model.Message,
          path: 'despiseMessage',
          select: ['content', 'createdAt'],
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
   * 🔥 重写查找方法 - User模块密码字段处理
   * 基于Admin模块实战经验：默认排除密码字段
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    // 🔥 User模块实战经验：默认排除密码字段
    if (!options.fields && !payload.fields && !options.includePassword) {
      options.fields = '-password';
    }

    // 调用基类方法
    const result = await super.find(payload, options);

    return result;
  }

  /**
   * 🔥 重写findOne方法 - User模块密码字段处理
   * 基于Admin模块实战经验：排除密码字段，除非明确要求包含
   * @param {Object} params 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(params = {}, options = {}) {
    // 🔥 User模块实战经验：排除密码字段，除非明确要求包含
    if (!options.fields && !options.includePassword) {
      options.fields = '-password';
    }

    // 调用基类方法
    return await super.findOne(params, options);
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
      // 🔥 必须使用UniqueChecker统一处理唯一性验证
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
      // 🔥 必须使用UniqueChecker统一处理唯一性验证
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
      // 🔥 必须使用UniqueChecker统一处理唯一性验证
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
            fields: '_id userName password enable state',
            includePassword: true,
          });
          break;
        case 'email':
          user = await this.findByEmail(identifier, {
            fields: '_id userName password enable state',
            includePassword: true,
          });
          break;
        case 'phone':
          user = await this.findByPhone(identifier, {
            fields: '_id userName password enable state',
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

      // 验证密码
      const isValidPassword = CryptoUtil.verifyPassword(password, user.password, this.app.config.encrypt_key);
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
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型（favorites, praiseContents, watchers等）
   * @param {String} targetId 目标ID
   * @return {Promise<Object>} 更新后的用户
   * @throws {NotFoundError} 当用户不存在时抛出异常
   */
  async addToUserList(userId, listType, targetId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw this.exceptions.user.notFound(userId);
      }

      // 检查是否已存在
      const currentList = user[listType] || [];
      if (currentList.includes(targetId)) {
        return user; // 已存在，直接返回
      }

      // 添加到列表
      const updateData = {
        [listType]: [...currentList, targetId],
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
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型
   * @param {String} targetId 目标ID
   * @return {Promise<Object>} 更新后的用户
   * @throws {NotFoundError} 当用户不存在时抛出异常
   */
  async removeFromUserList(userId, listType, targetId) {
    try {
      const user = await this.findById(userId);
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
    try {
      const idArray = Array.isArray(userIds) ? userIds : [userIds];
      const result = await this.model.updateMany({ _id: { $in: idArray } }, { $set: { state, updatedAt: new Date() } });
      return { modifiedCount: result.modifiedCount };
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
      const stats = { total: 0, active: 0, deleted: 0 };
      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        switch (item._id) {
          case '1':
            stats.active = count;
            break;
          case '0':
            stats.deleted = count;
            break;
        }
      });
      return stats;
    } catch (error) {
      this._handleError(error, 'getUserEntityStats', { filter });
      return { total: 0, active: 0, deleted: 0 };
    }
  }

  // ===== 🔥 基类钩子方法重写 - 用于业务特定逻辑 =====

  /**
   * 重写状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.USER.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（业务特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 🔥 添加User特定的数据处理
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

    // 确保数组字段的默认值
    item.despises = item.despises || [];
    item.despiseMessage = item.despiseMessage || [];
    item.favorites = item.favorites || [];
    item.praiseContents = item.praiseContents || [];
    item.praiseMessages = item.praiseMessages || [];
    item.followers = item.followers || [];
    item.watchers = item.watchers || [];
    item.watchTags = item.watchTags || [];

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加User特定的创建前处理
    // 设置默认值
    if (!data.state) {
      data.state = '1';
    }
    if (typeof data.enable === 'undefined') {
      data.enable = true;
    }
    if (!data.group) {
      data.group = '0';
    }
    if (!data.gender) {
      data.gender = '0';
    }
    if (!data.idType) {
      data.idType = '1';
    }
    if (!data.countryCode) {
      data.countryCode = '86';
    }

    // 确保数组字段初始化
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
   * 子类自定义的更新前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加User特定的更新前处理
    // 如果更新密码，需要加密
    if (data.password) {
      data.password = CryptoUtil.encryptPassword(data.password, this.app.config.encrypt_key);
    }

    return data;
  }
}

module.exports = UserMongoRepository;
