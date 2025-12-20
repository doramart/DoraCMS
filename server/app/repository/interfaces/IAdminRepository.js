/**
 * Admin Repository 接口定义
 * 定义管理员相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IAdminRepository extends IBaseRepository {
  /**
   * 根据用户名查找管理员
   * @param {String} userName 用户名
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 管理员记录
   */
  async findByUserName(userName, options = {}) {
    throw new Error('Method findByUserName() must be implemented');
  }

  /**
   * 根据邮箱查找管理员
   * @param {String} userEmail 邮箱
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 管理员记录
   */
  async findByEmail(userEmail, options = {}) {
    throw new Error('Method findByEmail() must be implemented');
  }

  /**
   * 根据手机号查找管理员
   * @param {String} userPhone 手机号
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 管理员记录
   */
  async findByPhone(userPhone, options = {}) {
    throw new Error('Method findByPhone() must be implemented');
  }

  /**
   * 管理员登录验证
   * @param {String} identifier 用户标识（用户名/邮箱/手机号）
   * @param {String} password 密码
   * @param {String} loginType 登录类型 ('username', 'email', 'phone')
   * @return {Promise<Object|null>} 验证通过的管理员记录
   */
  async verifyLogin(identifier, password, loginType) {
    throw new Error('Method verifyLogin() must be implemented');
  }

  /**
   * 检查用户名是否已存在
   * @param {String} userName 用户名
   * @param {String} excludeId 排除的管理员ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkUserNameExists(userName, excludeId = null) {
    throw new Error('Method checkUserNameExists() must be implemented');
  }

  /**
   * 检查邮箱是否已存在
   * @param {String} userEmail 邮箱
   * @param {String} excludeId 排除的管理员ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkEmailExists(userEmail, excludeId = null) {
    throw new Error('Method checkEmailExists() must be implemented');
  }

  /**
   * 检查手机号是否已存在
   * @param {String} userPhone 手机号
   * @param {String} excludeId 排除的管理员ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkPhoneExists(userPhone, excludeId = null) {
    throw new Error('Method checkPhoneExists() must be implemented');
  }

  /**
   * 更新管理员密码
   * @param {String} adminId 管理员ID
   * @param {String} newPassword 新密码
   * @return {Promise<Object>} 更新结果
   */
  async updatePassword(adminId, newPassword) {
    throw new Error('Method updatePassword() must be implemented');
  }

  /**
   * 批量更新管理员状态
   * @param {Array} adminIds 管理员ID数组
   * @param {String} status 状态 ('1' 启用, '2' 禁用)
   * @return {Promise<Object>} 更新结果
   */
  async updateAdminsStatus(adminIds, status) {
    throw new Error('Method updateAdminsStatus() must be implemented');
  }

  /**
   * 根据角色查找管理员
   * @param {String|Array} roleIds 角色ID或ID数组
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByRoles(roleIds, payload = {}, options = {}) {
    throw new Error('Method findByRoles() must be implemented');
  }

  /**
   * 添加管理员角色
   * @param {String} adminId 管理员ID
   * @param {String|Array} roleIds 角色ID或ID数组
   * @return {Promise<Object>} 更新结果
   */
  async addRoles(adminId, roleIds) {
    throw new Error('Method addRoles() must be implemented');
  }

  /**
   * 移除管理员角色
   * @param {String} adminId 管理员ID
   * @param {String|Array} roleIds 角色ID或ID数组
   * @return {Promise<Object>} 更新结果
   */
  async removeRoles(adminId, roleIds) {
    throw new Error('Method removeRoles() must be implemented');
  }

  /**
   * 获取管理员的角色信息
   * @param {String} adminId 管理员ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async getAdminRoles(adminId, options = {}) {
    throw new Error('Method getAdminRoles() must be implemented');
  }

  /**
   * 根据状态查找管理员
   * @param {String} status 状态 ('1' 启用, '2' 禁用)
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByStatus(status, payload = {}, options = {}) {
    throw new Error('Method findByStatus() must be implemented');
  }

  /**
   * 激活管理员账户
   * @param {String} adminId 管理员ID
   * @return {Promise<Object>} 激活结果
   */
  async activateAdmin(adminId) {
    throw new Error('Method activateAdmin() must be implemented');
  }

  /**
   * 禁用管理员账户
   * @param {String} adminId 管理员ID
   * @return {Promise<Object>} 禁用结果
   */
  async deactivateAdmin(adminId) {
    throw new Error('Method deactivateAdmin() must be implemented');
  }

  /**
   * 获取管理员统计信息
   * @return {Promise<Object>} 统计信息
   */
  async getAdminStats() {
    throw new Error('Method getAdminStats() must be implemented');
  }
}

module.exports = IAdminRepository;
