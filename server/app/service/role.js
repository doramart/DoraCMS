/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2025-01-xx xx:xx:xx
 *
 * 新版 RoleService - 基于 Repository/Adapter 模式
 * 使用 Repository 接口替代直接访问 general.js
 */

'use strict';
const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class RoleService extends Service {
  constructor(ctx) {
    super(ctx);
    // 创建 Repository 工厂实例
    this.repositoryFactory = new RepositoryFactory(this.app);
    // 获取 Role Repository
    this.repository = this.repositoryFactory.createRoleRepository(ctx);
  }

  /**
   * 查找角色列表
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 角色列表数据
   */
  async find(payload, options = {}) {
    return await this.repository.find(payload, options);
  }

  /**
   * 统计角色数量
   * @param {Object} params 查询条件
   * @return {Promise<Number>} 角色数量
   */
  async count(params = {}) {
    return await this.repository.count(params);
  }

  /**
   * 创建角色
   * @param {Object} payload 角色数据
   * @return {Promise<Object>} 创建的角色
   */
  async create(payload) {
    return await this.repository.create(payload);
  }

  /**
   * 删除角色
   * @param {Array|String} ids 角色ID数组或单个ID
   * @param {String} key 删除的键名
   * @return {Promise<Object>} 删除结果
   */
  async removes(ids, key = '_id') {
    return await this.repository.remove(ids, key);
  }

  /**
   * 软删除角色
   * @param {Array|String} ids 角色ID数组或单个ID
   * @param {Object} updateObj 更新对象，默认 { status: '0' }
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: '0' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  /**
   * 更新角色
   * @param {String} id 角色ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新结果
   */
  async update(id, data) {
    return await this.repository.update(id, data);
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
   * 查找单条记录
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 获取单个角色（兼容原有接口）
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 角色信息
   */
  async item(options = {}) {
    const { query = {}, populate = [], fields = null } = options;
    return await this.repository.findOne(query, { populate, fields });
  }

  // ======================== Role 特有业务方法 ========================

  /**
   * 根据角色名称查找角色
   * @param {String} roleName 角色名称
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 角色信息
   */
  async findByRoleName(roleName, options = {}) {
    return await this.repository.findByRoleName(roleName, options);
  }

  /**
   * 根据角色代码查找角色
   * @param {String} roleCode 角色代码
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 角色信息
   */
  async findByRoleCode(roleCode, options = {}) {
    return await this.repository.findByRoleCode(roleCode, options);
  }

  /**
   * 🔥 检查角色代码是否唯一 - 统一异常处理版本
   * @param {String} roleCode 角色代码
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当角色代码已存在时抛出异常
   */
  async checkRoleCodeUnique(roleCode, excludeId = null) {
    return await this.repository.checkRoleCodeUnique(roleCode, excludeId);
  }

  /**
   * 🔥 检查角色名称是否唯一 - 统一异常处理版本
   * @param {String} roleName 角色名称
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当角色名称已存在时抛出异常
   */
  async checkRoleNameUnique(roleName, excludeId = null) {
    return await this.repository.checkRoleNameUnique(roleName, excludeId);
  }

  /**
   * 检查角色代码是否已存在（兼容旧接口）
   * @param {String} roleCode 角色代码
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkRoleCodeExists(roleCode, excludeId = null) {
    return await this.repository.checkRoleCodeExists(roleCode, excludeId);
  }

  /**
   * 检查角色名称是否已存在（兼容旧接口）
   * @param {String} roleName 角色名称
   * @param {String} excludeId 排除的角色ID（用于编辑时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkRoleNameExists(roleName, excludeId = null) {
    return await this.repository.checkRoleNameExists(roleName, excludeId);
  }

  /**
   * 根据状态查找角色
   * @param {String} status 状态 ('1': 启用, '2': 禁用)
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByStatus(status, payload = {}, options = {}) {
    return await this.repository.findByStatus(status, payload, options);
  }

  /**
   * 获取所有启用的角色
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的角色列表
   */
  async getEnabledRoles(options = {}) {
    return await this.repository.getEnabledRoles(options);
  }

  // ======================== Role 权限管理方法 ========================

  /**
   * 更新角色菜单权限
   * @param {String} roleId 角色ID
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRoleMenus(roleId, menuIds) {
    return await this.repository.updateRoleMenus(roleId, menuIds);
  }

  /**
   * 更新角色按钮权限
   * @param {String} roleId 角色ID
   * @param {Array<String>} buttonCodes 按钮代码数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRoleButtons(roleId, buttonCodes) {
    return await this.repository.updateRoleButtons(roleId, buttonCodes);
  }

  /**
   * 批量更新角色权限（菜单+按钮）
   * @param {String} roleId 角色ID
   * @param {Array<String>} menuIds 菜单ID数组
   * @param {Array<String>} buttonCodes 按钮代码数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRolePermissions(roleId, menuIds, buttonCodes) {
    return await this.repository.updateRolePermissions(roleId, menuIds, buttonCodes);
  }

  /**
   * 获取角色的完整权限信息（包含菜单和按钮详细信息）
   * @param {String} roleId 角色ID
   * @return {Promise<Object|null>} 角色权限信息
   */
  async getRolePermissions(roleId) {
    return await this.repository.getRolePermissions(roleId);
  }

  /**
   * 根据菜单ID查找拥有该菜单权限的角色
   * @param {String} menuId 菜单ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async findRolesByMenuId(menuId, options = {}) {
    return await this.repository.findRolesByMenuId(menuId, options);
  }

  /**
   * 根据按钮代码查找拥有该按钮权限的角色
   * @param {String} buttonCode 按钮代码
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async findRolesByButtonCode(buttonCode, options = {}) {
    return await this.repository.findRolesByButtonCode(buttonCode, options);
  }

  // ======================== Role 批量操作方法 ========================

  /**
   * 批量更新角色状态
   * @param {Array<String>} roleIds 角色ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateRolesStatus(roleIds, status) {
    return await this.repository.updateRolesStatus(roleIds, status);
  }

  /**
   * 清理无效的菜单权限（当菜单被删除时）
   * @param {Array<String>} deletedMenuIds 已删除的菜单ID数组
   * @return {Promise<Object>} 清理结果
   */
  async cleanInvalidMenuPermissions(deletedMenuIds) {
    return await this.repository.cleanInvalidMenuPermissions(deletedMenuIds);
  }

  /**
   * 统计角色相关数据
   * @return {Promise<Object>} 统计信息
   */
  async getRoleStats() {
    return await this.repository.getRoleStats();
  }

  // ======================== 兼容原有接口的方法 ========================

  /**
   * 检查角色代码是否唯一（兼容原有接口）
   * @param {String} roleCode 角色代码
   * @param {String} excludeId 排除的角色ID
   * @return {Promise<Boolean>} 是否唯一（不存在）
   */
  async checkRoleCode(roleCode, excludeId = null) {
    const exists = await this.repository.checkRoleCodeExists(roleCode, excludeId);
    return !exists; // 返回是否唯一（与原接口保持一致）
  }

  /**
   * 检查角色名称是否唯一（兼容原有接口）
   * @param {String} roleName 角色名称
   * @param {String} excludeId 排除的角色ID
   * @return {Promise<Boolean>} 是否唯一（不存在）
   */
  async checkRoleName(roleName, excludeId = null) {
    const exists = await this.repository.checkRoleNameExists(roleName, excludeId);
    return !exists; // 返回是否唯一（与原接口保持一致）
  }

  // ======================== Repository 统计和管理方法 ========================

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 统计信息
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

module.exports = RoleService;
