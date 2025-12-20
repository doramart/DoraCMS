/**
 * User Repository 接口定义
 * 定义用户相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IUserRepository extends IBaseRepository {
  /**
   * 根据用户名查找用户
   * @param {String} userName 用户名
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 用户记录
   */
  async findByUserName(userName, options = {}) {
    throw new Error('Method findByUserName() must be implemented');
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email 邮箱
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 用户记录
   */
  async findByEmail(email, options = {}) {
    throw new Error('Method findByEmail() must be implemented');
  }

  /**
   * 根据手机号查找用户
   * @param {String} phoneNum 手机号
   * @param {String} countryCode 国家代码
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 用户记录
   */
  async findByPhoneNum(phoneNum, countryCode, options = {}) {
    throw new Error('Method findByPhoneNum() must be implemented');
  }

  /**
   * 根据设备ID查找用户（游客用户）
   * @param {String} deviceId 设备ID
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 用户记录
   */
  async findByDeviceId(deviceId, options = {}) {
    throw new Error('Method findByDeviceId() must be implemented');
  }

  /**
   * 用户登录验证
   * @param {String} identifier 用户标识（用户名/邮箱/手机号）
   * @param {String} password 密码
   * @param {String} loginType 登录类型 ('username', 'email', 'phone')
   * @param {String} countryCode 国家代码（手机号登录时需要）
   * @return {Promise<Object|null>} 验证通过的用户记录
   */
  async verifyLogin(identifier, password, loginType, countryCode = null) {
    throw new Error('Method verifyLogin() must be implemented');
  }

  /**
   * 检查用户名是否已存在
   * @param {String} userName 用户名
   * @param {String} excludeId 排除的用户ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkUserNameExists(userName, excludeId = null) {
    throw new Error('Method checkUserNameExists() must be implemented');
  }

  /**
   * 检查邮箱是否已存在
   * @param {String} email 邮箱
   * @param {String} excludeId 排除的用户ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkEmailExists(email, excludeId = null) {
    throw new Error('Method checkEmailExists() must be implemented');
  }

  /**
   * 检查手机号是否已存在
   * @param {String} phoneNum 手机号
   * @param {String} countryCode 国家代码
   * @param {String} excludeId 排除的用户ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkPhoneExists(phoneNum, countryCode, excludeId = null) {
    throw new Error('Method checkPhoneExists() must be implemented');
  }

  /**
   * 更新用户密码
   * @param {String} userId 用户ID
   * @param {String} newPassword 新密码
   * @return {Promise<Object>} 更新结果
   */
  async updatePassword(userId, newPassword) {
    throw new Error('Method updatePassword() must be implemented');
  }

  /**
   * 添加用户收藏
   * @param {String} userId 用户ID
   * @param {String} contentId 内容ID
   * @param {String} type 收藏类型 ('favorites', 'praiseContents', 'despises')
   * @return {Promise<Object>} 更新结果
   */
  async addToUserList(userId, contentId, type) {
    throw new Error('Method addToUserList() must be implemented');
  }

  /**
   * 移除用户收藏
   * @param {String} userId 用户ID
   * @param {String} contentId 内容ID
   * @param {String} type 收藏类型 ('favorites', 'praiseContents', 'despises')
   * @return {Promise<Object>} 更新结果
   */
  async removeFromUserList(userId, contentId, type) {
    throw new Error('Method removeFromUserList() must be implemented');
  }

  /**
   * 数组字段添加元素
   * @param {String} userId 用户ID
   * @param {Object} payload 要添加的数据
   * @return {Promise<Object>} 更新结果
   */
  async addToSet(userId, payload) {
    throw new Error('Method addToSet() must be implemented');
  }

  /**
   * 数组字段移除元素
   * @param {String} userId 用户ID
   * @param {Object} payload 要移除的数据
   * @return {Promise<Object>} 更新结果
   */
  async pull(userId, payload) {
    throw new Error('Method pull() must be implemented');
  }

  /**
   * 用户关注操作
   * @param {String} userId 用户ID
   * @param {String} targetUserId 目标用户ID
   * @param {String} action 操作类型 ('follow', 'unfollow')
   * @return {Promise<Object>} 操作结果
   */
  async handleUserFollow(userId, targetUserId, action) {
    throw new Error('Method handleUserFollow() must be implemented');
  }

  /**
   * 获取用户统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 用户统计信息
   */
  async getUserStats(userId) {
    throw new Error('Method getUserStats() must be implemented');
  }

  /**
   * 根据用户组查找用户
   * @param {String} group 用户组
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByGroup(group, payload = {}, options = {}) {
    throw new Error('Method findByGroup() must be implemented');
  }

  /**
   * 批量更新用户状态
   * @param {Array} userIds 用户ID数组
   * @param {Boolean} enable 启用状态
   * @return {Promise<Object>} 更新结果
   */
  async updateUsersStatus(userIds, enable) {
    throw new Error('Method updateUsersStatus() must be implemented');
  }

  /**
   * 获取用户的关注列表
   * @param {String} userId 用户ID
   * @param {String} type 类型 ('followers', 'watchers')
   * @param {Object} payload 分页参数
   * @return {Promise<Object>} 关注列表
   */
  async getUserFollowList(userId, type, payload = {}) {
    throw new Error('Method getUserFollowList() must be implemented');
  }

  /**
   * 激活用户账户
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 激活结果
   */
  async activateUser(userId) {
    throw new Error('Method activateUser() must be implemented');
  }
}

module.exports = IUserRepository;
