/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2025-01-xx xx:xx:xx
 *
 * Menu Service - 使用 Repository 模式的完整重构版
 * 严格基于原功能实现，使用标准化的 Repository 接口
 */

'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class MenuService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 Menu Repository
    this.repository = this.repositoryFactory.createMenuRepository(ctx);
  }

  /**
   * 查找菜单列表
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 菜单列表数据
   */
  async find(payload = {}, options = {}) {
    // Repository 层已经处理了树形结构逻辑，直接返回结果
    return await this.repository.find(payload, options);
  }

  /**
   * 构建菜单树形结构
   * @param {Array} menuList 菜单列表
   * @param {String} parentId 父级ID
   * @return {Array} 树形结构的菜单
   */
  buildMenuTree(menuList, parentId = '0') {
    return this.repository.buildMenuTree(menuList, parentId);
  }

  /**
   * 构建路由树结构
   * @param {Array} allMenus 所有菜单数据
   * @param {Array} userMenus 用户菜单ID数组
   * @param {Object} query 查询参数
   * @return {Array} 路由树结构
   */
  buildRouteTree(allMenus, userMenus = [], query = {}) {
    return this.repository.buildRouteTree(allMenus, userMenus, query);
  }

  /**
   * 统计菜单数量
   * @param {Object} params 查询条件
   * @return {Promise<Number>} 菜单数量
   */
  async count(params = {}) {
    return await this.repository.count(params);
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
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 创建菜单
   * @param {Object} payload 菜单数据
   * @return {Promise<Object>} 创建的菜单
   */
  async create(payload) {
    return await this.repository.create(payload);
  }

  /**
   * 删除菜单
   * @param {Array|String} values 菜单ID数组或单个ID
   * @param {String} key 删除的键名
   * @return {Promise<Object>} 删除结果
   */
  async removes(values, key = 'id') {
    return await this.repository.remove(values, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: '0' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  /**
   * 更新菜单
   * @param {String} id 菜单ID
   * @param {Object} payload 更新数据
   * @return {Promise<Object>} 更新结果
   */
  async update(id, payload) {
    const updateData = { ...payload, updatedAt: new Date() };
    return await this.repository.update(id, updateData);
  }

  /**
   * 获取单个菜单
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 菜单信息
   */
  async item(options = {}) {
    return await this.repository.findOne(options);
  }

  /**
   * 根据父级ID查找菜单
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByParentId(parentId = '0', options = {}) {
    return await this.repository.findByParentId(parentId, options);
  }

  /**
   * 根据菜单类型查找
   * @param {String} menuType 菜单类型 (1: 目录, 2: 菜单)
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByMenuType(menuType, options = {}) {
    return await this.repository.findByMenuType(menuType, options);
  }

  /**
   * 检查路由路径是否唯一 - 统一异常处理版本
   * @param {String} routePath 路由路径
   * @param {String} excludeId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当路由路径已存在时抛出异常
   */
  async checkRoutePathUnique(routePath, excludeId = null) {
    return await this.repository.checkRoutePathUnique(routePath, excludeId);
  }

  /**
   * 检查路由名称是否唯一 - 统一异常处理版本
   * @param {String} routeName 路由名称
   * @param {String} excludeId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当路由名称已存在时抛出异常
   */
  async checkRouteNameUnique(routeName, excludeId = null) {
    return await this.repository.checkRouteNameUnique(routeName, excludeId);
  }

  /**
   * 检查按钮权限标识是否唯一 - 统一异常处理版本
   * @param {Array} permissionCodes 按钮权限标识数组
   * @param {String} excludeMenuId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当权限标识已存在时抛出异常
   */
  async checkButtonPermissionCodesUnique(permissionCodes, excludeMenuId = null) {
    return await this.repository.checkButtonPermissionCodesUnique(permissionCodes, excludeMenuId);
  }

  /**
   * 检查菜单是否可以删除 - 统一异常处理版本
   * @param {String} menuId 菜单ID
   * @return {Promise<Boolean>} 是否可以删除
   * @throws {BusinessRuleError} 当菜单有子菜单时抛出异常
   */
  async checkMenuCanDelete(menuId) {
    return await this.repository.checkMenuCanDelete(menuId);
  }

  /**
   * 检查父菜单是否存在 - 统一异常处理版本
   * @param {String} parentId 父菜单ID
   * @return {Promise<Boolean>} 父菜单是否存在
   * @throws {NotFoundError} 当父菜单不存在时抛出异常
   */
  async checkParentMenuExists(parentId) {
    return await this.repository.checkParentMenuExists(parentId);
  }

  /**
   * 检查菜单类型有效性 - 统一异常处理版本
   * @param {String} menuType 菜单类型
   * @return {Promise<Boolean>} 菜单类型是否有效
   * @throws {ValidationError} 当菜单类型无效时抛出异常
   */
  async checkMenuTypeValid(menuType) {
    return await this.repository.checkMenuTypeValid(menuType);
  }

  // ===== 兼容性方法（保持原有接口不变） =====

  /**
   * 检查路由路径是否唯一（兼容性方法）
   * @param {String} routePath 路由路径
   * @param {String} excludeId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @deprecated 请使用 checkRoutePathUnique 方法
   */
  async checkRoutePath(routePath, excludeId = null) {
    try {
      return await this.checkRoutePathUnique(routePath, excludeId);
    } catch (error) {
      // 兼容性处理：异常时返回false
      return false;
    }
  }

  /**
   * 检查路由名称是否唯一（兼容性方法）
   * @param {String} routeName 路由名称
   * @param {String} excludeId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @deprecated 请使用 checkRouteNameUnique 方法
   */
  async checkRouteName(routeName, excludeId = null) {
    try {
      return await this.checkRouteNameUnique(routeName, excludeId);
    } catch (error) {
      // 兼容性处理：异常时返回false
      return false;
    }
  }

  /**
   * 检查按钮权限标识是否唯一（兼容性方法）
   * @param {Array} permissionCodes 按钮权限标识数组
   * @param {String} excludeMenuId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @deprecated 请使用 checkButtonPermissionCodesUnique 方法
   */
  async checkButtonPermissionCodeUnique(permissionCodes, excludeMenuId = null) {
    try {
      return await this.checkButtonPermissionCodesUnique(permissionCodes, excludeMenuId);
    } catch (error) {
      // 兼容性处理：异常时返回false
      return false;
    }
  }

  /**
   * 获取指定菜单及其所有子菜单
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 菜单及其子菜单列表
   */
  async getMenuAndChildren(menuId) {
    return await this.repository.getMenuWithChildren(menuId);
  }

  /**
   * 更新菜单排序
   * @param {String} menuId 菜单ID
   * @param {Number} order 新的排序值
   * @return {Promise<Object>} 更新结果
   */
  async updateOrder(menuId, order) {
    return await this.repository.updateOrder(menuId, order);
  }

  /**
   * 批量更新菜单状态
   * @param {Array} menuIds 菜单ID数组
   * @param {String} status 状态值
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(menuIds, status) {
    return await this.repository.batchUpdateStatus(menuIds, status);
  }

  /**
   * 获取所有按钮的 API 集合
   * @param {Array} menuIds 菜单ID数组
   * @return {Promise<Array>} API 列表
   */
  async getButtonApis(menuIds = []) {
    return await this.repository.getButtonApis(menuIds);
  }

  /**
   * 获取菜单按钮的权限标识与 API 映射关系
   * @param {Array} menuIds 菜单ID数组
   * @return {Promise<Array>} 按钮信息数组 [{permissionCode: String, api: String, menuId: String}]
   */
  async getMenuButtonsWithPermissionCodes(menuIds = []) {
    return await this.repository.getMenuButtonsWithPermissionCodes(menuIds);
  }

  /**
   * 获取菜单的路由路径信息（用于没有配置按钮的菜单）
   * @param {Array} menuIds 菜单ID数组
   * @return {Promise<Array>} 菜单路由信息数组 [{id: String, routePath: String, hasButtons: Boolean}]
   */
  async getMenuRoutePaths(menuIds = []) {
    return await this.repository.getMenuRoutePaths(menuIds);
  }

  /**
   * 根据ID数组查找菜单
   * @param {Array} menuIds 菜单ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByIds(menuIds, options = {}) {
    return await this.repository.findByIds(menuIds, options);
  }

  /**
   * 查找用户菜单
   * @param {Array} userMenuIds 用户菜单ID数组
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findUserMenus(userMenuIds, payload = {}, options = {}) {
    return await this.repository.findUserMenus(userMenuIds, payload, options);
  }

  /**
   * 根据权限标识查找菜单
   * @param {Array} permissionCodes 权限标识数组
   * @return {Promise<Array>} 菜单列表
   */
  async findMenusByPermissionCodes(permissionCodes) {
    return await this.repository.findMenusByPermissionCodes(permissionCodes);
  }

  /**
   * 获取菜单路径
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 菜单路径数组
   */
  async getMenuPath(menuId) {
    return await this.repository.getMenuPath(menuId);
  }

  /**
   * 根据国际化键查找菜单
   * @param {String} i18nKey 国际化键
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByI18nKey(i18nKey, options = {}) {
    return await this.repository.findByI18nKey(i18nKey, options);
  }

  /**
   * 获取菜单统计信息
   * @return {Promise<Object>} 统计信息
   */
  async getMenuStats() {
    return await this.repository.getMenuStats();
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 信息
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

module.exports = MenuService;
