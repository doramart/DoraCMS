/**
 * Role Repository 接口定义
 * 定义角色相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IRoleRepository extends IBaseRepository {
  /**
   * 根据角色名称查找角色
   * @param {String} roleName 角色名称
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 角色记录
   */
  async findByRoleName(roleName, options = {}) {
    throw new Error('Method findByRoleName() must be implemented');
  }

  /**
   * 根据角色代码查找角色
   * @param {String} roleCode 角色代码
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 角色记录
   */
  async findByRoleCode(roleCode, options = {}) {
    throw new Error('Method findByRoleCode() must be implemented');
  }

  /**
   * 检查角色代码是否已存在
   * @param {String} roleCode 角色代码
   * @param {String} excludeId 排除的角色ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkRoleCodeExists(roleCode, excludeId = null) {
    throw new Error('Method checkRoleCodeExists() must be implemented');
  }

  /**
   * 检查角色名称是否已存在
   * @param {String} roleName 角色名称
   * @param {String} excludeId 排除的角色ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkRoleNameExists(roleName, excludeId = null) {
    throw new Error('Method checkRoleNameExists() must be implemented');
  }

  /**
   * 根据状态查找角色
   * @param {String} status 状态 ('1': 启用, '2': 禁用)
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByStatus(status, payload = {}, options = {}) {
    throw new Error('Method findByStatus() must be implemented');
  }

  /**
   * 获取所有启用的角色
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的角色列表
   */
  async getEnabledRoles(options = {}) {
    throw new Error('Method getEnabledRoles() must be implemented');
  }

  /**
   * 更新角色菜单权限
   * @param {String} roleId 角色ID
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRoleMenus(roleId, menuIds) {
    throw new Error('Method updateRoleMenus() must be implemented');
  }

  /**
   * 更新角色按钮权限
   * @param {String} roleId 角色ID
   * @param {Array<String>} buttonCodes 按钮代码数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRoleButtons(roleId, buttonCodes) {
    throw new Error('Method updateRoleButtons() must be implemented');
  }

  /**
   * 批量更新角色权限（菜单+按钮）
   * @param {String} roleId 角色ID
   * @param {Array<String>} menuIds 菜单ID数组
   * @param {Array<String>} buttonCodes 按钮代码数组
   * @return {Promise<Object>} 更新结果
   */
  async updateRolePermissions(roleId, menuIds, buttonCodes) {
    throw new Error('Method updateRolePermissions() must be implemented');
  }

  /**
   * 根据菜单ID查找拥有该菜单权限的角色
   * @param {String} menuId 菜单ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async findRolesByMenuId(menuId, options = {}) {
    throw new Error('Method findRolesByMenuId() must be implemented');
  }

  /**
   * 根据按钮代码查找拥有该按钮权限的角色
   * @param {String} buttonCode 按钮代码
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 角色列表
   */
  async findRolesByButtonCode(buttonCode, options = {}) {
    throw new Error('Method findRolesByButtonCode() must be implemented');
  }

  /**
   * 获取角色的完整权限信息（包含菜单和按钮详细信息）
   * @param {String} roleId 角色ID
   * @return {Promise<Object|null>} 角色权限信息
   */
  async getRolePermissions(roleId) {
    throw new Error('Method getRolePermissions() must be implemented');
  }

  /**
   * 批量更新角色状态
   * @param {Array<String>} roleIds 角色ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateRolesStatus(roleIds, status) {
    throw new Error('Method updateRolesStatus() must be implemented');
  }

  /**
   * 清理无效的菜单权限（当菜单被删除时）
   * @param {Array<String>} deletedMenuIds 已删除的菜单ID数组
   * @return {Promise<Object>} 清理结果
   */
  async cleanInvalidMenuPermissions(deletedMenuIds) {
    throw new Error('Method cleanInvalidMenuPermissions() must be implemented');
  }

  /**
   * 统计角色相关数据
   * @return {Promise<Object>} 统计信息
   */
  async getRoleStats() {
    throw new Error('Method getRoleStats() must be implemented');
  }
}

module.exports = IRoleRepository;
