/**
 * Menu Repository 接口定义
 * 定义菜单相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IMenuRepository extends IBaseRepository {
  /**
   * 根据父级ID查找子菜单
   * @param {String} parentId 父级ID，默认 '0' 表示根级
   * @param {Object} options 查询选项 { includeDisabled: false, files: null }
   * @return {Promise<Array>} 子菜单列表
   */
  async findByParentId(parentId = '0', options = {}) {
    throw new Error('Method findByParentId() must be implemented');
  }

  /**
   * 根据菜单类型查找菜单
   * @param {String} menuType 菜单类型 ('1': 目录, '2': 菜单)
   * @param {Object} options 查询选项 { includeDisabled: false, files: null }
   * @return {Promise<Array>} 菜单列表
   */
  async findByMenuType(menuType, options = {}) {
    throw new Error('Method findByMenuType() must be implemented');
  }

  /**
   * 检查路由路径是否唯一
   * @param {String} routePath 路由路径
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkRoutePathUnique(routePath, excludeId = null) {
    throw new Error('Method checkRoutePathUnique() must be implemented');
  }

  /**
   * 检查路由名称是否唯一
   * @param {String} routeName 路由名称
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkRouteNameUnique(routeName, excludeId = null) {
    throw new Error('Method checkRouteNameUnique() must be implemented');
  }

  /**
   * 检查按钮权限标识是否全局唯一
   * @param {Array<String>} permissionCodes 按钮权限标识数组
   * @param {String} excludeMenuId 排除的菜单ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkButtonPermissionCodesUnique(permissionCodes, excludeMenuId = null) {
    throw new Error('Method checkButtonPermissionCodesUnique() must be implemented');
  }

  /**
   * 获取菜单及其所有子菜单
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 菜单及其子菜单列表
   */
  async getMenuWithChildren(menuId) {
    throw new Error('Method getMenuWithChildren() must be implemented');
  }

  /**
   * 获取所有按钮的API集合
   * @param {Array<String>} menuIds 菜单ID数组，为空则查询所有
   * @return {Promise<Array<String>>} API路径数组
   */
  async getButtonApis(menuIds = []) {
    throw new Error('Method getButtonApis() must be implemented');
  }

  /**
   * 获取菜单按钮的权限标识和 API 映射关系
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Array<Object>>} 按钮信息数组 [{permissionCode: String, api: String, menuId: String}]
   */
  async getMenuButtonsWithPermissionCodes(menuIds = []) {
    throw new Error('Method getMenuButtonsWithPermissionCodes() must be implemented');
  }

  /**
   * 获取菜单的路由路径信息（用于没有配置按钮的菜单）
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Array<Object>>} 菜单路由信息数组 [{id: String, routePath: String, hasButtons: Boolean}]
   */
  async getMenuRoutePaths(menuIds = []) {
    throw new Error('Method getMenuRoutePaths() must be implemented');
  }

  /**
   * 批量更新菜单状态
   * @param {Array<String>} menuIds 菜单ID数组
   * @param {String} status 状态值 ('0': 禁用, '1': 启用)
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(menuIds, status) {
    throw new Error('Method batchUpdateStatus() must be implemented');
  }

  /**
   * 更新菜单排序
   * @param {String} menuId 菜单ID
   * @param {Number} order 排序值
   * @return {Promise<Object>} 更新结果
   */
  async updateOrder(menuId, order) {
    throw new Error('Method updateOrder() must be implemented');
  }

  /**
   * 构建树形菜单结构
   * @param {Array} menuList 菜单列表
   * @param {String} parentId 父级ID，默认 '0'
   * @return {Array} 树形结构菜单
   */
  buildMenuTree(menuList, parentId = '0') {
    throw new Error('Method buildMenuTree() must be implemented');
  }

  /**
   * 根据菜单ID数组查找菜单
   * @param {Array<String>} menuIds 菜单ID数组
   * @param {Object} options 查询选项 { files: null, includeButtons: false }
   * @return {Promise<Array>} 菜单列表
   */
  async findByIds(menuIds, options = {}) {
    throw new Error('Method findByIds() must be implemented');
  }

  /**
   * 获取用户权限范围内的菜单
   * @param {Array<String>} userMenuIds 用户菜单权限ID数组
   * @param {Object} payload 查询参数 { hideInMenu: false }
   * @param {Object} options 查询选项 { files: null }
   * @return {Promise<Array>} 权限菜单列表
   */
  async findUserMenus(userMenuIds, payload = {}, options = {}) {
    throw new Error('Method findUserMenus() must be implemented');
  }

  /**
   * 根据按钮权限标识查找关联菜单
   * @param {Array<String>} permissionCodes 权限标识数组
   * @return {Promise<Array>} 关联菜单列表
   */
  async findMenusByPermissionCodes(permissionCodes) {
    throw new Error('Method findMenusByPermissionCodes() must be implemented');
  }

  /**
   * 获取菜单层级路径
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 菜单层级路径数组
   */
  async getMenuPath(menuId) {
    throw new Error('Method getMenuPath() must be implemented');
  }

  /**
   * 根据i18nKey查找菜单
   * @param {String} i18nKey 国际化键值
   * @param {Object} options 查询选项 { files: null }
   * @return {Promise<Object|null>} 菜单记录
   */
  async findByI18nKey(i18nKey, options = {}) {
    throw new Error('Method findByI18nKey() must be implemented');
  }

  /**
   * 获取菜单统计信息
   * @return {Promise<Object>} 统计信息 { totalCount, directoryCount, menuCount, enabledCount, disabledCount }
   */
  async getMenuStats() {
    throw new Error('Method getMenuStats() must be implemented');
  }
}

module.exports = IMenuRepository;
