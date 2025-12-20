/**
 * 优化后的 Menu MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 Menu 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 Menu 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 Menu 特有的业务逻辑 - 树形结构、层级管理
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持 buttons、query 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const MenuSchema = require('../../schemas/mariadb/MenuSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const { UniqueConstraintError, ValidationError } = require('../../../exceptions');
const _ = require('lodash');

class MenuMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Menu');

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
      const sequelize = this.connection.getSequelize();

      // 直接创建模型实例，避免依赖连接管理器的缓存
      this.model = MenuSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // Menu 暂时没有外部关联关系，所有数据都是自包含的
          // buttons 和 query 字段通过 Schema 的 get/set 方法处理
        },
      });

      // console.log('✅ MenuMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ MenuMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - Menu 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return []; // Menu 没有外部关联关系
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['menuName', 'routeName', 'routePath', 'menuDesc'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'order', order: 'asc' }, // 首先按排序字段升序
      { field: 'createdAt', order: 'desc' }, // 然后按创建时间降序
    ];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从MenuSchema获取所有字段
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 Menu特有的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // Menu模块特有的需要排除的字段
    const menuExcludeFields = [
      'children', // 虚拟字段 - 树形结构子节点
      'parent', // 关联字段 - 父节点
      'breadcrumb', // 虚拟字段 - 面包屑
    ];

    return [...baseExcludeFields, ...menuExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - Menu 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item, options);

    // 添加 Menu 特有的数据处理
    // 添加菜单类型文本
    if (item.menuType) {
      item.menuTypeText = this._getMenuTypeText(item.menuType);
    }

    // 确保 JSON 字段的默认值
    item.query = item.query || [];
    item.buttons = item.buttons || [];

    // 添加层级显示名称
    if (item.routeLevel) {
      item.levelText = `第${item.routeLevel}级`;
    }

    // 处理父子关系显示
    if (
      item.parentId &&
      item.parentId !== SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER &&
      item.parentId !== SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID
    ) {
      item.hasParent = true;
    } else {
      item.hasParent = false;
      // 保持原始值，不要强制转换为 null
      // item.parentId = null; // 注释掉这行，保持原始值
    }

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - Menu 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 Menu 特有的创建前处理
    // 设置默认值
    if (!data.menuType) data.menuType = SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU; // 默认为菜单类型
    if (!data.status) data.status = SYSTEM_CONSTANTS.STATUS.ENABLED; // 默认启用
    if (!data.hideInMenu) data.hideInMenu = false; // 默认显示
    if (!data.order) data.order = 0; // 默认排序

    // 处理父节点
    if (!data.parentId || data.parentId === '') {
      data.parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID; // 根节点统一为字符串 '0'
    }

    // 确保 JSON 字段格式正确
    if (!data.query) data.query = [];
    if (!data.buttons) data.buttons = [];

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - Menu 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 Menu 特有的更新前处理
    // 处理父节点
    if (data.parentId === '') {
      data.parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER;
    }

    return data;
  }

  // ===== 🔥 重写基类方法 - 添加 Menu 特殊逻辑 =====

  /**
   * 重写基类的 find 方法，添加树形结构处理逻辑
   * @param {Object} payload 查询参数
   * @param {Object} options 选项
   * @return {Promise} 查询结果
   */
  async find(payload = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 调用基类的 find 方法
      const result = await super.find(payload, options);

      // 🔥 Menu 特有逻辑：如果需要树形结构处理（通过 payload.flat 控制）
      if (!payload.flat && result && result.docs) {
        // 分页结果的树形处理
        result.docs = this.buildMenuTree(result.docs);
      } else if (!payload.flat && Array.isArray(result)) {
        // 非分页结果的树形处理
        return this.buildMenuTree(result);
      }

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  // ===== 🔥 Menu 特有的业务方法 =====

  /**
   * 检查菜单是否可以删除（无子菜单）- 统一异常处理版本
   * @param {String} menuId 菜单ID
   * @return {Promise<Boolean>} 是否可以删除
   * @throws {BusinessRuleError} 当菜单有子菜单时抛出异常
   */
  async checkMenuCanDelete(menuId) {
    try {
      const children = await this.findByParentId(menuId);
      if (children && children.length > 0) {
        throw this.exceptions.menu.hasChildren(menuId);
      }
      return true;
    } catch (error) {
      if (error.name === 'BusinessRuleError') {
        throw error;
      }
      this._handleError(error, 'checkMenuCanDelete', { menuId });
    }
  }

  /**
   * 检查父菜单是否存在 - 统一异常处理版本
   * @param {String} parentId 父菜单ID
   * @return {Promise<Boolean>} 父菜单是否存在
   * @throws {NotFoundError} 当父菜单不存在时抛出异常
   */
  async checkParentMenuExists(parentId) {
    try {
      // 根级菜单无需检查
      if (
        parentId === SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID ||
        parentId === SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER ||
        !parentId
      ) {
        return true;
      }

      const parentMenu = await this.findById(parentId);
      if (!parentMenu) {
        throw this.exceptions.menu.parentNotFound(parentId);
      }
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'checkParentMenuExists', { parentId });
    }
  }

  /**
   * 检查菜单类型有效性 - 统一异常处理版本
   * @param {String} menuType 菜单类型
   * @return {Promise<Boolean>} 菜单类型是否有效
   * @throws {ValidationError} 当菜单类型无效时抛出异常
   */
  async checkMenuTypeValid(menuType) {
    try {
      const validTypes = [SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.DIRECTORY, SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE.MENU];

      if (!validTypes.includes(menuType)) {
        throw this.exceptions.menu.invalidMenuType(menuType);
      }
      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'checkMenuTypeValid', { menuType });
    }
  }

  /**
   * 构建菜单树形结构
   * @param {Array} menuList 菜单列表
   * @param {String|Number} parentId 父级ID
   * @return {Array} 树形结构的菜单
   */
  buildMenuTree(menuList, parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER) {
    const tree = [];

    for (const menu of menuList) {
      if (
        menu.parentId === parentId ||
        (parentId === SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER && (!menu.parentId || menu.parentId === '0'))
      ) {
        const children = this.buildMenuTree(menuList, menu.id);
        if (children.length > 0) {
          menu.children = children;
        }
        tree.push(menu);
      }
    }

    // 按 order 字段排序
    return tree.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * 构建路由树结构
   * @param {Array} allMenus 所有菜单数据
   * @param {Array} userMenus 用户菜单ID数组
   * @param {Object} query 查询参数
   * @return {Array} 路由树结构
   */
  buildRouteTree(allMenus, userMenus = [], query = {}) {
    const includeHiddenRoutes = query.includeHiddenRoutes;

    // 首先过滤出用户有权限的菜单
    const filteredMenus = allMenus.filter(menu => {
      const menuId = String(menu.id);
      if (includeHiddenRoutes) {
        return userMenus.includes(menuId);
      }
      // 如果查询参数指定了 hideInMenu，则根据该参数过滤
      if (query.hideInMenu !== undefined) {
        return !menu.hideInMenu && userMenus.includes(menuId);
      }
      // 否则检查用户是否有该菜单的权限
      return userMenus.includes(menuId);
    });

    // 构建路由树结构
    const buildRouteTree = (menus, parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER) => {
      const result = [];
      for (const menu of menus) {
        if (menu.parentId === parentId) {
          const route = {
            name: menu.routeName,
            path: menu.routePath,
            component: menu.component,
            meta: {
              title: menu.menuName,
              i18nKey: menu.i18nKey,
              icon: menu.icon,
              constant: menu.constant,
              order: menu.order,
              keepAlive: menu.keepAlive,
              hideInMenu: menu.hideInMenu,
              activeMenu: menu.activeMenu,
              multiTab: menu.multiTab,
            },
          };

          if (menu.redirect) {
            route.redirect = menu.redirect;
          }

          if (menu.props) {
            route.props = menu.props;
          }

          // 递归构建子菜单
          const children = buildRouteTree(menus, menu.id);
          if (children.length) {
            route.children = children;
          }

          result.push(route);
        }
      }

      // 按 order 字段排序
      return result.sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));
    };

    return buildRouteTree(filteredMenus);
  }

  /**
   * 获取菜单树形结构（专用方法）
   * @param {Object} payload 查询参数
   * @param {Object} options 选项
   * @return {Promise<Array>} 树形菜单数据
   */
  async getMenuTree(payload = {}, options = {}) {
    try {
      // 获取所有菜单数据，强制平铺
      const allMenus = await this.find(
        { ...payload, pageSize: 1000, flat: true }, // flat: true 避免重复树形处理
        { ...options, filters: { status: SYSTEM_CONSTANTS.STATUS.ENABLED } } // 只获取启用的菜单
      );

      // 构建树形结构
      const menuData = allMenus.data || allMenus.docs || allMenus;
      const menuTree = this.buildMenuTree(menuData);

      this._logOperation('getMenuTree', payload, { count: menuTree.length });
      return menuTree;
    } catch (error) {
      this._handleError(error, 'getMenuTree', { payload, options });
    }
  }

  /**
   * 根据角色权限获取菜单
   * @param {Array} roleIds 角色ID数组
   * @param {Object} options 选项
   * @return {Promise<Array>} 菜单列表
   */
  async getMenusByRoles(roleIds, options = {}) {
    await this._ensureConnection();

    try {
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds];

      // 这里需要根据实际的角色权限逻辑来实现
      // 暂时返回所有启用的菜单
      const menus = await this.find(
        { pageSize: 1000 },
        {
          ...options,
          filters: {
            status: SYSTEM_CONSTANTS.STATUS.ENABLED,
            isShow: SYSTEM_CONSTANTS.STATUS.ENABLED,
          },
        }
      );

      this._logOperation('getMenusByRoles', { roleIds }, { count: menus.data?.length || 0 });
      return menus.data || menus.docs || [];
    } catch (error) {
      this._handleError(error, 'getMenusByRoles', { roleIds, options });
    }
  }

  /**
   * 获取按钮权限API列表
   * @param {Array} menuIds 菜单ID数组
   * @return {Promise<Array>} API列表
   */
  async getButtonApis(menuIds = []) {
    await this._ensureConnection();

    try {
      const whereCondition = { status: SYSTEM_CONSTANTS.STATUS.ENABLED };

      if (menuIds && menuIds.length > 0) {
        whereCondition.id = { [this.Op.in]: menuIds };
      }

      const renderMenus = await this.model.findAll({
        where: whereCondition,
        attributes: ['buttons'],
      });

      // 🔥 使用优化后的深度转换处理 buttons 字段
      const processedMenus = renderMenus.map(menu => this._deepToJSON(menu));

      // 收集所有按钮的 API
      const apiSet = new Set();
      processedMenus.forEach(menu => {
        if (menu.buttons && Array.isArray(menu.buttons)) {
          menu.buttons.forEach(button => {
            if (button.api) {
              apiSet.add(button.api);
            }
          });
        }
      });

      const apis = Array.from(apiSet);
      this._logOperation('getButtonApis', { menuIds }, { count: apis.length });
      return apis;
    } catch (error) {
      this._handleError(error, 'getButtonApis', { menuIds });
    }
  }

  /**
   * 获取菜单按钮的权限标识和 API 映射关系
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Array<Object>>} 按钮信息数组 [{permissionCode: String, api: String, menuId: String}]
   */
  async getMenuButtonsWithPermissionCodes(menuIds = []) {
    await this._ensureConnection();

    try {
      const whereCondition = { status: SYSTEM_CONSTANTS.STATUS.ENABLED };

      if (menuIds && menuIds.length > 0) {
        whereCondition.id = { [this.Op.in]: menuIds };
      }

      const renderMenus = await this.model.findAll({
        where: whereCondition,
        attributes: ['id', 'buttons'],
      });

      // 🔥 使用优化后的深度转换处理 buttons 字段
      const processedMenus = renderMenus.map(menu => this._deepToJSON(menu));

      // 收集所有按钮的权限标识和 api 映射关系
      const buttonList = [];
      processedMenus.forEach(menu => {
        if (menu.buttons && Array.isArray(menu.buttons)) {
          menu.buttons.forEach(button => {
            if (button.permissionCode) {
              buttonList.push({
                desc: button.desc || '',
                api: button.api || '',
                menuId: menu.id,
                permissionCode: button.permissionCode,
                httpMethod: button.httpMethod ? button.httpMethod.toUpperCase() : 'POST',
              });
            }
          });
        }
      });

      this._logOperation('getMenuButtonsWithPermissionCodes', { menuIds }, { count: buttonList.length });
      return buttonList;
    } catch (error) {
      this._handleError(error, 'getMenuButtonsWithPermissionCodes', { menuIds });
    }
  }

  /**
   * 获取菜单的路由路径信息（用于没有配置按钮的菜单）
   * @param {Array<String>} menuIds 菜单ID数组
   * @return {Promise<Array<Object>>} 菜单路由信息数组 [{id: String, routePath: String, hasButtons: Boolean}]
   */
  async getMenuRoutePaths(menuIds = []) {
    await this._ensureConnection();

    try {
      const whereCondition = { status: SYSTEM_CONSTANTS.STATUS.ENABLED };

      if (menuIds && menuIds.length > 0) {
        whereCondition.id = { [this.Op.in]: menuIds };
      }

      const renderMenus = await this.model.findAll({
        where: whereCondition,
        attributes: ['id', 'routePath', 'buttons'],
      });

      // 🔥 使用优化后的深度转换处理 buttons 字段
      const processedMenus = renderMenus.map(menu => this._deepToJSON(menu));

      // 返回菜单路由信息
      const menuRoutes = processedMenus.map(menu => ({
        id: menu.id,
        routePath: menu.routePath,
        hasButtons: menu.buttons && Array.isArray(menu.buttons) && menu.buttons.length > 0,
      }));

      this._logOperation('getMenuRoutePaths', { menuIds }, { count: menuRoutes.length });
      return menuRoutes;
    } catch (error) {
      this._handleError(error, 'getMenuRoutePaths', { menuIds });
    }
  }

  /**
   * 根据权限标识查找关联菜单
   * @param {Array<String>} permissionCodes 权限标识数组
   * @return {Promise<Array>} 关联菜单列表
   */
  async findMenusByPermissionCodes(permissionCodes) {
    await this._ensureConnection();

    try {
      if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
        return [];
      }

      const whereCondition = { status: SYSTEM_CONSTANTS.STATUS.ENABLED };
      const renderMenus = await this.model.findAll({
        where: whereCondition,
        attributes: ['id', 'menuName', 'routeName', 'routePath', 'buttons'],
      });

      const processedMenus = renderMenus.map(menu => this._deepToJSON(menu));
      const matchedMenus = processedMenus.filter(menu => {
        if (!Array.isArray(menu.buttons)) {
          return false;
        }
        return menu.buttons.some(button => button.permissionCode && permissionCodes.includes(button.permissionCode));
      });

      this._logOperation('findMenusByPermissionCodes', { permissionCodes }, { count: matchedMenus.length });
      return matchedMenus;
    } catch (error) {
      this._handleError(error, 'findMenusByPermissionCodes', { permissionCodes });
    }
  }

  /**
   * 根据父级ID获取子菜单
   * @param {String} parentId 父级ID
   * @param {Object} options 选项
   * @return {Promise<Array>} 子菜单列表
   */
  async getChildrenByParentId(parentId, options = {}) {
    try {
      const filters = { parentId, ...(options.filters || {}) };
      const result = await this.find(
        { pageSize: 1000, flat: true }, // 平铺结果，不需要树形处理
        { ...options, filters }
      );

      return result.data || result.docs || [];
    } catch (error) {
      this._handleError(error, 'getChildrenByParentId', { parentId, options });
    }
  }

  /**
   * 根据父级ID查找菜单（原始方法名保持兼容）
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByParentId(parentId = SYSTEM_CONSTANTS.PERMISSION.ROOT_PARENT_ID_NUMBER, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { parentId };
      const result = await this.find({ pageSize: 1000, flat: true }, { ...options, filters });

      this._logOperation('findByParentId', { parentId, options }, result);
      return result.data || result.docs || result;
    } catch (error) {
      this._handleError(error, 'findByParentId', { parentId, options });
    }
  }

  /**
   * 根据菜单类型查找菜单
   * @param {String} menuType 菜单类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 菜单列表
   */
  async findByMenuType(menuType, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { menuType };
      const result = await this.find({ pageSize: 1000, flat: true }, { ...options, filters });

      this._logOperation('findByMenuType', { menuType, options }, result);
      return result.data || result.docs || result;
    } catch (error) {
      this._handleError(error, 'findByMenuType', { menuType, options });
    }
  }

  /**
   * 检查菜单名称是否唯一
   * @param {String} menuName 菜单名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkMenuNameUnique(menuName, excludeId = null) {
    try {
      const query = { menuName };
      if (excludeId) {
        query.id = { [this.Op.ne]: excludeId };
      }
      const count = await this.model.count({ where: query });
      return count === 0;
    } catch (error) {
      this._handleError(error, 'checkMenuNameUnique', { menuName, excludeId });
      return false;
    }
  }

  /**
   * 检查路由名称是否唯一 - 统一异常处理版本
   * @param {String} routeName 路由名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当路由名称已存在时抛出异常
   */
  async checkRouteNameUnique(routeName, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkRouteNameUnique(this, routeName, excludeId);
      if (!isUnique) {
        throw this.exceptions.menu.routeNameExists(routeName);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkRouteNameUnique', { routeName, excludeId });
    }
  }

  /**
   * 检查路由路径是否唯一 - 统一异常处理版本
   * @param {String} routePath 路由路径
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当路由路径已存在时抛出异常
   */
  async checkRoutePathUnique(routePath, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkRoutePathUnique(this, routePath, excludeId);
      if (!isUnique) {
        throw this.exceptions.menu.routePathExists(routePath);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkRoutePathUnique', { routePath, excludeId });
    }
  }

  /**
   * 检查按钮权限标识是否唯一 - 统一异常处理版本
   * @param {Array} permissionCodes 权限标识数组
   * @param {String} excludeMenuId 排除的菜单ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当权限标识已存在时抛出异常
   */
  async checkButtonPermissionCodesUnique(permissionCodes, excludeMenuId = null) {
    await this._ensureConnection();

    try {
      if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
        return true;
      }

      const whereCondition = { status: SYSTEM_CONSTANTS.STATUS.ENABLED };
      if (excludeMenuId) {
        whereCondition.id = { [this.Op.ne]: excludeMenuId };
      }

      const menus = await this.model.findAll({
        where: whereCondition,
        attributes: ['buttons'],
      });

      // 收集所有现有的权限标识
      const existingCodes = new Set();
      menus.forEach(menu => {
        const menuJson = this._deepToJSON(menu);
        if (menuJson.buttons && Array.isArray(menuJson.buttons)) {
          menuJson.buttons.forEach(button => {
            if (button.permissionCode) {
              existingCodes.add(button.permissionCode);
            }
          });
        }
      });

      // 检查是否有重复
      const conflictCodes = permissionCodes.filter(code => existingCodes.has(code));
      if (conflictCodes.length > 0) {
        throw this.exceptions.menu.permissionCodeExists(conflictCodes.join(', '));
      }

      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkButtonPermissionCodesUnique', { permissionCodes, excludeMenuId });
    }
  }

  /**
   * 获取菜单及其所有子菜单
   * @param {String} menuId 菜单ID
   * @return {Promise<Array>} 包含主菜单和所有子菜单的数组集合
   */
  async getMenuWithChildren(menuId) {
    await this._ensureConnection();

    try {
      // 获取所有菜单（优化性能，一次性查询）
      const allMenus = await this.find({ pageSize: 1000, flat: true });
      const menuList = allMenus.data || allMenus.docs || allMenus;

      // 查找目标菜单
      const targetMenu = menuList.find(menu => menu.id == menuId);
      if (!targetMenu) {
        return [];
      }

      const result = [targetMenu];

      // 递归查找子菜单
      const findChildren = parentId => {
        const children = menuList.filter(menu => menu.parentId == parentId);
        for (const child of children) {
          result.push(child);
          findChildren(child.id);
        }
      };

      findChildren(menuId);

      this._logOperation('getMenuWithChildren', { menuId }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getMenuWithChildren', { menuId });
      return [];
    }
  }

  /**
   * 更新菜单排序
   * @param {Array} sortData 排序数据 [{id, sort}, ...]
   * @return {Promise<Object>} 更新结果
   */
  async updateMenuSort(sortData) {
    await this._ensureConnection();
    const transaction = await this.connection.getSequelize().transaction();

    try {
      const updatePromises = sortData.map(item =>
        this.model.update({ order: item.order || item.sort }, { where: { id: item.id }, transaction })
      );

      await Promise.all(updatePromises);
      await transaction.commit();

      this._logOperation('updateMenuSort', { sortData }, { success: true });
      return { success: true, updated: sortData.length };
    } catch (error) {
      await transaction.rollback();
      this._handleError(error, 'updateMenuSort', { sortData });
    }
  }

  /**
   * 更新菜单排序（单个）
   * @param {String} menuId 菜单ID
   * @param {Number} order 排序值
   * @return {Promise<Object>} 更新结果
   */
  async updateOrder(menuId, order) {
    await this._ensureConnection();

    try {
      const result = await this.model.update({ order, updatedAt: new Date() }, { where: { id: menuId } });

      this._logOperation('updateOrder', { menuId, order }, result);
      return { success: result[0] > 0, updated: result[0] };
    } catch (error) {
      this._handleError(error, 'updateOrder', { menuId, order });
    }
  }

  /**
   * 批量更新菜单状态
   * @param {Array} menuIds 菜单ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async updateMenuStatus(menuIds, status) {
    try {
      const idArray = Array.isArray(menuIds) ? menuIds : [menuIds];
      return await this.updateStatus(idArray, status);
    } catch (error) {
      this._handleError(error, 'updateMenuStatus', { menuIds, status });
    }
  }

  /**
   * 批量更新状态（原始方法名保持兼容）
   * @param {Array} menuIds 菜单ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(menuIds, status) {
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(menuIds) ? menuIds : [menuIds];
      const result = await this.model.update(
        { status, updatedAt: new Date() },
        { where: { id: { [this.Op.in]: idArray } } }
      );

      this._logOperation('batchUpdateStatus', { menuIds, status }, result);
      return { success: result[0] > 0, updated: result[0] };
    } catch (error) {
      this._handleError(error, 'batchUpdateStatus', { menuIds, status });
    }
  }

  // ===== 🔥 辅助方法 =====

  /**
   * 获取菜单类型文本
   * @param {String} menuType 菜单类型值
   * @return {String} 菜单类型文本
   * @private
   */
  _getMenuTypeText(menuType) {
    return SYSTEM_CONSTANTS.PERMISSION.MENU_TYPE_TEXT[menuType] || '未知';
  }
}

module.exports = MenuMariaRepository;
